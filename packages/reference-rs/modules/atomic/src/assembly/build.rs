//! Build helpers for assembly: partition the wants into own and external atom sets,
//! lower each set into its atoms, resolve the recipes against the consumer system, and
//! emit the css runtime map. Each helper reads the filled sinks and the consumer
//! `BaseSystem` and returns its product, so the stage order stays in `finish`.

use super::*;

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

/// Partition wants by the external marker, then resolve each partition into
/// its own atom set with the consumer `BaseSystem`. Every want resolves with
/// the same system; the partition only decides which set an atom lands in.
/// The pooled guard runs per partition, so an empty external partition makes
/// the own decision byte-identical to the pre-partition single-set call.
pub(super) fn build_atom_sets(
    wants: &[crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    mut sink: Option<&mut DiagnosticsSession>,
) -> (AtomSet, AtomSet) {
    let (own_wants, external_wants): (Vec<&crate::atom::Want>, Vec<&crate::atom::Want>) =
        wants.iter().partition(|want| !want.external);
    let own = build_atom_set(&own_wants, system, diagnostics, sink.as_deref_mut());
    let external = build_atom_set(&external_wants, system, diagnostics, sink.as_deref_mut());
    (own, external)
}

/// Resolve one partition's wants into an atom set, reporting resolve facts.
fn build_atom_set(
    wants: &[&crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    mut sink: Option<&mut DiagnosticsSession>,
) -> AtomSet {
    if let Some(pooled) = build_atom_set_pooled(wants, system, diagnostics, &mut sink) {
        return pooled;
    }
    let mut atom_set = AtomSet::new();
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink,
        want: None,
    };
    for &want in wants {
        for atom in resolve::resolve_want_with(want, &mut session) {
            atom_set.insert(atom);
        }
    }
    atom_set
}

/// Resolve one partition's wants on the tail pool, committing atoms in input
/// order. Returns `None` when the lane guard declines so the caller runs serial.
fn build_atom_set_pooled(
    wants: &[&crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: &mut Option<&mut DiagnosticsSession>,
) -> Option<AtomSet> {
    let guard = Lanes::Auto.guard(WorkKind::TailWants, wants.len())?;
    let mut atom_set = AtomSet::new();
    for item in crate::resolve_pool::resolve_wants(wants, system, &guard) {
        if let Some(slot) = sink.as_deref_mut() {
            slot.extend_facts(item.facts);
        }
        diagnostics.extend(item.diagnostics);
        for atom in item.atoms {
            atom_set.insert(atom);
        }
    }
    Some(atom_set)
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
