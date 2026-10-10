//! Resolution of authored style declarations into runtime style plans and cascade slots.
//! Connects pre-expansion authored inputs to post-resolution cascade declarations.
//! Computes opaque cascade slots for property-condition pairings and applies system segments to class names.
//! Deduplicates identical authored intentions and collects resulting atomic utilities into the AtomSet.
//! Own declarations target the compiling system; external declarations expand once per
//! foreign qualifier, routing their atoms into the separate external set.

use std::collections::BTreeMap;

use base_system::BaseSystem;
use rustc_hash::{FxBuildHasher, FxHashSet};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::plan::{RecipeRuntimeTable, RuntimeDeclaration, RuntimeStylePlan};
use super::serializer::{serialize_lookup_key, LookupKey};
use super::values::{is_duplicate, json_to_atom_value, RefusalSite, RefuseR};
use crate::atom::{Atom, AtomSet, AtomValue, Want};
use crate::diagnostics::{Diagnostic, DiagnosticLocation};
use crate::lanes::{Lanes, WorkKind};
use crate::resolve::{resolve_want_with, ResolveSession};
use crate::stylesheet::name::class_name_with_system;

/// Authored style declaration captured before shorthand, macro, or array expansion.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthoredDeclaration {
    pub when: Vec<String>,
    pub prop: String,
    pub value: Value,
    pub important: bool,
    /// True when the declaration was authored on an external component; the
    /// runtime builder routes these to foreign-qualifier plans. Absent from
    /// the wire when false so the own path stays byte-identical.
    #[serde(default, skip_serializing_if = "crate::atom::is_false")]
    pub external: bool,
}

impl AuthoredDeclaration {
    /// Compute the stable lookup key for this declaration within the given system.
    pub fn lookup_key(&self, system: &str) -> String {
        serialize_lookup_key(&LookupKey {
            system,
            when: &self.when,
            prop: &self.prop,
            value: &self.value,
            important: self.important,
        })
    }
}

/// Derive the cascade slot for a property and condition chain.
pub fn derive_slot(prop: &str, when: &[String], breakpoint: Option<&str>) -> String {
    let canonical = canon::resolve_canonical_prop(prop);
    let cond_parts: Vec<&str> = when
        .iter()
        .map(|w| w.strip_prefix('_').unwrap_or(w.as_str()))
        .collect();

    let base_slot = if cond_parts.is_empty() {
        canonical.to_string()
    } else {
        format!("{}:{}", cond_parts.join(":"), canonical)
    };

    if let Some(bp) = breakpoint {
        format!("{base_slot}@{bp}")
    } else {
        base_slot
    }
}

fn resolve_with_unique_diagnostics(
    want: &Want,
    base_system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<crate::atom::Atom> {
    let mut local = Vec::new();
    let mut session = ResolveSession {
        system: base_system,
        diagnostics: &mut local,
        location: DiagnosticLocation::default(),
        // Plan re-resolve echoes the rendered line with no facts attached,
        // so is_duplicate still drops repeats by message as today.
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(want, &mut session);
    for diag in local {
        if !is_duplicate(diagnostics, &diag) {
            diagnostics.push(diag);
        }
    }
    atoms
}

/// Context for resolving authored declarations into style plans and atoms.
pub struct PlanBuilder<'a> {
    pub system: &'a str,
    pub base_system: &'a BaseSystem,
    /// Atoms from own (non-external) declarations. Shared with the want-derived
    /// own set; plan resolution merges into it in place.
    pub atom_set: &'a mut AtomSet,
    /// Atoms from external declarations, keyed apart from the own set so the
    /// two partitions stay distinct for counts and grouped emission.
    pub external_atom_set: &'a mut AtomSet,
    /// Composed-system qualifier list, own first (`[own, …foreign]`). Own
    /// declarations target only `system`; external declarations expand once
    /// per foreign qualifier.
    pub qualifiers: &'a [String],
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> PlanBuilder<'a> {
    pub fn new(
        system: &'a str,
        base_system: &'a BaseSystem,
        atom_set: &'a mut AtomSet,
        external_atom_set: &'a mut AtomSet,
        qualifiers: &'a [String],
        diagnostics: &'a mut Vec<Diagnostic>,
    ) -> Self {
        Self {
            system,
            base_system,
            atom_set,
            external_atom_set,
            qualifiers,
            diagnostics,
        }
    }

    /// Convert one plan-JSON value, refusing fenced `$r` multipliers in place.
    fn convert_value(
        &mut self,
        val: &Value,
        prop: &str,
        when: &[String],
        important: bool,
    ) -> Option<AtomValue> {
        let site = RefusalSite {
            prop,
            when,
            important,
            value: val,
        };
        let mut refuse = RefuseR {
            system: self.system,
            diagnostics: self.diagnostics,
        };
        json_to_atom_value(val, site, &mut refuse)
    }

    /// Build runtime style plans from authored declarations, deduplicating keys.
    pub fn build(&mut self, decls: &[AuthoredDeclaration]) -> Vec<RuntimeStylePlan> {
        // Plans and seen keys are bounded by the decl count: reserve once.
        let mut plans = Vec::with_capacity(decls.len());
        let mut seen_keys = FxHashSet::with_capacity_and_hasher(decls.len(), FxBuildHasher);

        for decl in decls {
            let (mut decl_plans, _) = self.expand_decl(decl, false, &mut seen_keys);
            plans.append(&mut decl_plans);
        }

        plans
    }

    /// Build full plans plus the carried canonical keys, deduped in plan order.
    /// The keys are the same dedupe strings `build` computes, so they equal
    /// the render-side emitted set without a second serialization (pinned).
    pub fn build_with_keys(
        &mut self,
        decls: &[AuthoredDeclaration],
    ) -> (Vec<RuntimeStylePlan>, Vec<String>) {
        self.build_keyed(decls, false)
    }

    /// Build diet plans plus the carried canonical keys for the `!proof` path.
    /// Resolve, the emptiness gate, and the atom-set inserts run exactly as
    /// in `build`; only the per-atom slot/class strings are replaced by one
    /// zero-alloc placeholder per plan (insert-skip died on the LEAF-11 hole).
    pub fn build_diet(
        &mut self,
        decls: &[AuthoredDeclaration],
    ) -> (Vec<RuntimeStylePlan>, Vec<String>) {
        self.build_keyed(decls, true)
    }

    /// Keyed build shared by the full and diet paths. Keys ride alongside
    /// pushed plans only, so `keys.len() == plans.len()` in plan order.
    fn build_keyed(
        &mut self,
        decls: &[AuthoredDeclaration],
        diet: bool,
    ) -> (Vec<RuntimeStylePlan>, Vec<String>) {
        if let Some(guard) = Lanes::Auto.guard(WorkKind::TailWants, decls.len()) {
            return super::plan_pool::build_keyed(self, decls, diet, &guard);
        }
        // Plans, keys, and seen keys are bounded by the decl count.
        let mut plans = Vec::with_capacity(decls.len());
        let mut keys = Vec::with_capacity(decls.len());
        let mut seen_keys = FxHashSet::with_capacity_and_hasher(decls.len(), FxBuildHasher);

        for decl in decls {
            let (mut decl_plans, mut decl_keys) =
                self.expand_decl(decl, diet, &mut seen_keys);
            plans.append(&mut decl_plans);
            keys.append(&mut decl_keys);
        }

        (plans, keys)
    }

    /// Resolve one declaration and expand it into plans plus canonical keys
    /// for every fresh target system. Own declarations target only the own
    /// system; external declarations target every foreign qualifier. Atoms
    /// route to the own or external set by `decl.external`. An all-seen decl
    /// resolves nothing, matching the single-key skip.
    fn expand_decl(
        &mut self,
        decl: &AuthoredDeclaration,
        diet: bool,
        seen: &mut FxHashSet<String>,
    ) -> (Vec<RuntimeStylePlan>, Vec<String>) {
        let fresh = fresh_targets(self.system, self.qualifiers, decl, seen);
        if fresh.is_empty() {
            return (Vec::new(), Vec::new());
        }
        let resolved = self.resolve_entry(decl, diet);
        let mut plans = Vec::with_capacity(fresh.len());
        let mut keys = Vec::with_capacity(fresh.len());
        for (system, key) in fresh {
            let plan = plan_for_system(decl, &resolved, &system, diet);
            if plan.declarations.is_empty() {
                // Failed decls still join the seen set (same skip-next
                // behavior), moving the owned key: zero clone.
                seen.insert(key);
            } else {
                // Success needs the key twice (set + carried keys): one clone.
                seen.insert(key.clone());
                keys.push(key);
                plans.push(plan);
            }
        }
        insert_resolved(resolved, decl.external, self.atom_set, self.external_atom_set);
        (plans, keys)
    }

    fn resolve_entry(&mut self, decl: &AuthoredDeclaration, diet: bool) -> Vec<ResolvedAtom> {
        if let Value::Array(arr) = &decl.value {
            return self.resolve_array(decl, arr, diet);
        }
        if let Value::Object(map) = &decl.value {
            if !map.contains_key("$r") && !map.contains_key("$token") {
                return self.resolve_object(decl, map, diet);
            }
        }

        let Some(atom_val) =
            self.convert_value(&decl.value, &decl.prop, &decl.when, decl.important)
        else {
            return Vec::new();
        };

        let want = want_at(decl, atom_val, &decl.when);
        let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

        if diet {
            return diet_resolved(atoms);
        }
        let mut out = Vec::with_capacity(atoms.len());
        for atom in atoms {
            let slot = derive_slot(&atom.prop, &decl.when, None);
            out.push(ResolvedAtom { slot, atom });
        }
        out
    }

    fn resolve_array(
        &mut self,
        decl: &AuthoredDeclaration,
        arr: &[Value],
        diet: bool,
    ) -> Vec<ResolvedAtom> {
        let mut out = Vec::new();
        let bp_scale = self.base_system.breakpoints();

        for (idx, elem) in arr.iter().enumerate() {
            if elem.is_null() {
                continue;
            }
            let Some(bp) = bp_scale.breakpoint_for_index(idx) else {
                continue;
            };
            let mut step_when = decl.when.clone();
            step_when.push(bp.to_string());
            let Some(atom_val) = self.convert_value(elem, &decl.prop, &step_when, decl.important)
            else {
                continue;
            };
            let want = want_at(decl, atom_val, &step_when);
            let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            if diet {
                out.extend(diet_resolved(atoms));
                continue;
            }
            for atom in atoms {
                let slot = derive_slot(&atom.prop, &decl.when, Some(bp));
                out.push(ResolvedAtom { slot, atom });
            }
        }
        out
    }

    fn resolve_object(
        &mut self,
        decl: &AuthoredDeclaration,
        map: &serde_json::Map<String, Value>,
        diet: bool,
    ) -> Vec<ResolvedAtom> {
        let mut out = Vec::new();
        let bp_scale = self.base_system.breakpoints();

        for (key, elem) in map {
            if elem.is_null() {
                continue;
            }
            let mut step_when = decl.when.clone();
            step_when.push(key.clone());
            let Some(atom_val) = self.convert_value(elem, &decl.prop, &step_when, decl.important)
            else {
                continue;
            };
            let want = want_at(decl, atom_val, &step_when);
            let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            if diet {
                out.extend(diet_resolved(atoms));
                continue;
            }
            let responsive = key == "base" || bp_scale.names().iter().any(|n| n == key);

            for atom in atoms {
                let slot = object_slot(
                    &atom.prop,
                    &decl.when,
                    &step_when,
                    responsive.then_some(key.as_str()),
                );
                out.push(ResolvedAtom { slot, atom });
            }
        }
        out
    }

    /// Resolve one declaration on private placeholder atom sets. The caller
    /// expands the resolved atoms and routes them by `decl.external`.
    pub(crate) fn resolve_detached(
        system: &str,
        base_system: &BaseSystem,
        decl: &AuthoredDeclaration,
        diet: bool,
    ) -> DetachedDecl {
        let mut atom_set = AtomSet::new();
        let mut external_atom_set = AtomSet::new();
        let mut diagnostics = Vec::new();
        let resolved = {
            let mut builder = PlanBuilder {
                system,
                base_system,
                atom_set: &mut atom_set,
                external_atom_set: &mut external_atom_set,
                qualifiers: &[],
                diagnostics: &mut diagnostics,
            };
            builder.resolve_entry(decl, diet)
        };
        DetachedDecl {
            resolved,
            diagnostics,
        }
    }
}

/// One resolved atom plus its cascade slot, before system qualification.
pub(super) struct ResolvedAtom {
    pub(super) slot: String,
    pub(super) atom: Atom,
}

/// One declaration resolved away from the shared atom set.
pub(crate) struct DetachedDecl {
    pub resolved: Vec<ResolvedAtom>,
    pub diagnostics: Vec<Diagnostic>,
}

/// Build the resolve want for one authored value at one condition step.
fn want_at(
    decl: &AuthoredDeclaration,
    atom_val: AtomValue,
    when: &[String],
) -> Want {
    let when_boxed: smallvec::SmallVec<[Box<str>; 2]> =
        when.iter().map(|w| w.clone().into_boxed_str()).collect();
    Want::new(decl.prop.as_str(), atom_val)
        .with_when(when_boxed)
        .with_important(decl.important)
}

/// Zero-slot wrappers for the diet path: only emptiness and the atoms matter,
/// so slot materialization stays skipped.
fn diet_resolved(atoms: Vec<Atom>) -> Vec<ResolvedAtom> {
    atoms
        .into_iter()
        .map(|atom| ResolvedAtom {
            slot: String::new(),
            atom,
        })
        .collect()
}

/// Fresh `(system, key)` plan targets for one declaration: the own system for
/// own declarations, every foreign qualifier for external ones, skipping keys
/// already in `seen`. Empty means the declaration contributes nothing.
pub(super) fn fresh_targets(
    system: &str,
    qualifiers: &[String],
    decl: &AuthoredDeclaration,
    seen: &FxHashSet<String>,
) -> Vec<(String, String)> {
    if decl.external {
        qualifiers
            .iter()
            .skip(1)
            .filter_map(|qualifier| {
                let key = decl.lookup_key(qualifier);
                (!seen.contains(&key)).then(|| (qualifier.clone(), key))
            })
            .collect()
    } else {
        let key = decl.lookup_key(system);
        if seen.contains(&key) {
            Vec::new()
        } else {
            vec![(system.to_string(), key)]
        }
    }
}

/// Expand one declaration's resolved atoms for one target system into a plan.
/// The diet path emits one placeholder declaration when anything resolved;
/// the full path qualifies each atom's class with `system`.
pub(super) fn plan_for_system(
    decl: &AuthoredDeclaration,
    resolved: &[ResolvedAtom],
    system: &str,
    diet: bool,
) -> RuntimeStylePlan {
    let declarations = if diet {
        diet_declarations(!resolved.is_empty())
    } else {
        resolved
            .iter()
            .map(|resolved| RuntimeDeclaration {
                slot: resolved.slot.clone(),
                class_name: class_name_with_system(&resolved.atom, system),
            })
            .collect()
    };
    RuntimeStylePlan {
        system: system.to_string(),
        when: decl.when.clone(),
        prop: decl.prop.clone(),
        value: decl.value.clone(),
        important: decl.important,
        declarations,
    }
}

/// Move one declaration's resolved atoms into the partition its marker selects.
pub(super) fn insert_resolved(
    resolved: Vec<ResolvedAtom>,
    external: bool,
    atom_set: &mut AtomSet,
    external_atom_set: &mut AtomSet,
) {
    let target = if external { external_atom_set } else { atom_set };
    for resolved in resolved {
        target.insert(resolved.atom);
    }
}

/// Object slot: a breakpoint key joins the `@` responsive family; any other
/// key reads as nested `when` parts so `_hover` keys merge with `_hover:
/// { … }` blocks instead of bare props.
fn object_slot(
    prop: &str,
    decl_when: &[String],
    step_when: &[String],
    bp: Option<&str>,
) -> String {
    if let Some(bp) = bp {
        derive_slot(prop, decl_when, Some(bp))
    } else {
        derive_slot(prop, step_when, None)
    }
}

/// Diet verdicts: one zero-alloc placeholder iff any atom resolved, else empty.
/// Length is unread on `!proof` (slim drops plans, render reads carried keys),
/// so minimal length keeps the pushed ⟺ nonempty invariant only.
fn diet_declarations(nonempty: bool) -> Vec<RuntimeDeclaration> {
    if nonempty {
        vec![RuntimeDeclaration {
            slot: String::new(),
            class_name: String::new(),
        }]
    } else {
        Vec::new()
    }
}

/// Build runtime style plans from authored declarations, deduplicating keys.
pub fn build_runtime_style_plans(
    builder: &mut PlanBuilder<'_>,
    decls: &[AuthoredDeclaration],
) -> Vec<RuntimeStylePlan> {
    builder.build(decls)
}

/// Convert compiled recipes into RecipeRuntimeTables keyed by qualified name.
pub fn build_recipe_runtime_tables(
    compiled: &[crate::recipes::CompiledRecipe],
) -> BTreeMap<String, RecipeRuntimeTable> {
    compiled
        .iter()
        .map(|rec| (rec.table.qualified_name.clone(), rec.table.clone()))
        .collect()
}
