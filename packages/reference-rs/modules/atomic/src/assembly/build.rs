//! Build helpers for assembly: partition the wants into the own atom set and the foreign groups
//! their backing names, lower each partition into its atoms, resolve the recipes against the consumer system, and
//! emit the css runtime map. Each helper reads the filled sinks and the consumer
//! `BaseSystem` and returns its product, so the stage order stays in `finish`.

use super::*;
use crate::atom::{Atom, ForeignAtoms};

/// Build plans plus the carried emitted-key set. Proof builds full plans
/// and no keys (render re-serializes as today); `!proof` builds diet plans
/// whose carried keys become the render join set, serialization-free.
pub(super) fn build_plans(
    builder: &mut runtime::PlanBuilder<'_>,
    authored: &[runtime::AuthoredDeclaration],
    proof: bool,
) -> (Vec<runtime::RuntimeStylePlan>, Option<BTreeSet<String>>) {
    if proof {
        (builder.build(authored), None)
    } else {
        let (plans, keys) = builder.build_diet(authored);
        let emitted: BTreeSet<String> = keys.into_iter().collect();
        (plans, Some(emitted))
    }
}

/// Partition wants by backing, then resolve each partition with the consumer
/// `BaseSystem`: own wants into the own set, every other want into the foreign
/// groups its backing names. Every want resolves with the same system; the
/// partition only decides where an atom lands. The pooled guard runs per
/// partition, so an empty foreign partition makes the own decision
/// byte-identical to the pre-partition single-set call.
pub(super) fn build_atom_sets(
    wants: &[crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    mut sink: Option<&mut DiagnosticsSession>,
) -> (AtomSet, ForeignAtoms) {
    let (own_wants, foreign_wants): (Vec<&crate::atom::Want>, Vec<&crate::atom::Want>) =
        wants.iter().partition(|want| want.backing.is_own());
    let mut own = AtomSet::new();
    PartitionSession {
        system,
        diagnostics: &mut *diagnostics,
        sink: sink.as_deref_mut(),
    }
    .resolve_into(&own_wants, &mut own);
    let mut foreign = ForeignAtoms::new();
    PartitionSession {
        system,
        diagnostics,
        sink,
    }
    .resolve_into(&foreign_wants, &mut foreign);
    (own, foreign)
}

/// Where one partition's resolved atoms land: the own set takes them as they
/// come; the foreign groups file each under its want's backing systems.
trait AtomTarget {
    fn take(&mut self, want: &crate::atom::Want, atom: Atom);
}

impl AtomTarget for AtomSet {
    fn take(&mut self, _want: &crate::atom::Want, atom: Atom) {
        self.insert(atom);
    }
}

impl AtomTarget for ForeignAtoms {
    fn take(&mut self, want: &crate::atom::Want, atom: Atom) {
        self.insert(atom, &want.backing);
    }
}

/// The resolve inputs one partition shares: the consumer system and the sinks
/// its facts report into.
struct PartitionSession<'a, 's> {
    system: &'a BaseSystem,
    diagnostics: &'a mut Vec<Diagnostic>,
    sink: Option<&'s mut DiagnosticsSession>,
}

impl PartitionSession<'_, '_> {
    /// Resolve one partition's wants into `target`, reporting resolve facts in
    /// want order: on the tail pool when the lane guard admits, else serially.
    fn resolve_into<T: AtomTarget>(&mut self, wants: &[&crate::atom::Want], target: &mut T) {
        match Lanes::Auto.guard(WorkKind::TailWants, wants.len()) {
            Some(guard) => self.resolve_pooled(wants, &guard, target),
            None => self.resolve_serial(wants, target),
        }
    }

    /// Resolve on the tail pool, committing facts and atoms in want order.
    fn resolve_pooled<T: AtomTarget>(
        &mut self,
        wants: &[&crate::atom::Want],
        guard: &crate::lanes::PoolGuard,
        target: &mut T,
    ) {
        let resolved = crate::resolve_pool::resolve_wants(wants, self.system, guard);
        for (&want, item) in wants.iter().zip(resolved) {
            if let Some(slot) = self.sink.as_deref_mut() {
                slot.extend_facts(item.facts);
            }
            self.diagnostics.extend(item.diagnostics);
            for atom in item.atoms {
                target.take(want, atom);
            }
        }
    }

    /// Resolve serially through one resolve session.
    fn resolve_serial<T: AtomTarget>(&mut self, wants: &[&crate::atom::Want], target: &mut T) {
        let mut session = resolve::ResolveSession {
            system: self.system,
            diagnostics: &mut *self.diagnostics,
            location: DiagnosticLocation::default(),
            sink: self.sink.as_deref_mut(),
            want: None,
        };
        for &want in wants {
            for atom in resolve::resolve_want_with(want, &mut session) {
                target.take(want, atom);
            }
        }
    }
}

/// Recipe definitions plus the observed selections gating their emission.
pub(super) struct RecipeInputs<'a> {
    extracted: &'a [recipes::Recipe],
    selections: &'a [crate::extract::recipes::selection::RecipeSelection],
}

impl<'a> RecipeInputs<'a> {
    pub(super) fn new(
        extracted: &'a [recipes::Recipe],
        selections: &'a [crate::extract::recipes::selection::RecipeSelection],
    ) -> Self {
        Self {
            extracted,
            selections,
        }
    }
}

/// Deduplicate spec and extracted recipes, then compile them to rules.
/// Selections join by className; spec recipes stay open by construction.
pub(super) fn compile_recipes(
    inputs: &RecipeInputs<'_>,
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: Option<&mut DiagnosticsSession>,
) -> Vec<recipes::CompiledRecipe> {
    let spec_recipes = recipes::from_spec(&system.recipes, diagnostics);
    let mut seen = FxHashSet::default();
    let mut valid = Vec::new();
    for recipe in spec_recipes.iter().chain(inputs.extracted.iter()) {
        if !seen.insert(&recipe.class_name) {
            diagnostics.push(recipe.location.error(
                DiagnosticCode::DuplicateRecipe,
                format!(
                    "Duplicate recipe className '{}' within system '{}'",
                    recipe.class_name, system.name
                ),
            ));
        } else {
            valid.push(recipe.clone());
        }
    }
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink,
        want: None,
    };
    let index =
        crate::extract::recipes::selection::SelectionIndex::new(inputs.selections, &spec_recipes);
    recipes::compile(&valid, &system.name, &mut session, &index)
}

/// Index the atom set's class names by their runtime lookup shape.
pub(super) fn build_css_runtime(atom_set: &AtomSet, system: &str) -> runtime::CssRuntime {
    let mut runtime = runtime::CssRuntime::new();
    for atom in atom_set {
        let c_name = stylesheet::name::class_name_with_system(atom, system);
        let val_key = atom.value.class_name_str();
        let key = if atom.conditions.is_empty() {
            format!("{}:{}", atom.prop, val_key)
        } else {
            let conds: Vec<&str> = atom.conditions.iter().map(When::authored).collect();
            format!("{}:{}:{}", conds.join(":"), atom.prop, val_key)
        };
        runtime.insert(key, c_name);
    }
    runtime
}
