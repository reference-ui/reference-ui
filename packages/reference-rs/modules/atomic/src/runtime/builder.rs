//! Resolution of authored style declarations into runtime style plans and cascade slots.
//! Connects pre-expansion authored inputs to post-resolution cascade declarations.
//! Computes opaque cascade slots for property-condition pairings and applies system segments to class names.
//! Deduplicates identical authored intentions and collects resulting atomic utilities into the AtomSet.

use std::collections::BTreeMap;

use base_system::BaseSystem;
use rustc_hash::{FxBuildHasher, FxHashSet};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::plan::{RecipeRuntimeTable, RuntimeDeclaration, RuntimeStylePlan};
use super::serializer::{serialize_lookup_key, LookupKey};
use super::values::{is_duplicate, json_to_atom_value, RefusalSite, RefuseR};
use crate::atom::{AtomSet, AtomValue, Want};
use crate::diagnostics::{Diagnostic, DiagnosticLocation};
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
    pub atom_set: &'a mut AtomSet,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> PlanBuilder<'a> {
    pub fn new(
        system: &'a str,
        base_system: &'a BaseSystem,
        atom_set: &'a mut AtomSet,
        diagnostics: &'a mut Vec<Diagnostic>,
    ) -> Self {
        Self {
            system,
            base_system,
            atom_set,
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
            let lookup_key = decl.lookup_key(self.system);
            if !seen_keys.insert(lookup_key) {
                continue;
            }

            let declarations = self.resolve_entry(decl, false);
            if !declarations.is_empty() {
                plans.push(RuntimeStylePlan {
                    system: self.system.to_string(),
                    when: decl.when.clone(),
                    prop: decl.prop.clone(),
                    value: decl.value.clone(),
                    important: decl.important,
                    declarations,
                });
            }
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
        // Plans, keys, and seen keys are bounded by the decl count.
        let mut plans = Vec::with_capacity(decls.len());
        let mut keys = Vec::with_capacity(decls.len());
        let mut seen_keys = FxHashSet::with_capacity_and_hasher(decls.len(), FxBuildHasher);

        for decl in decls {
            let lookup_key = decl.lookup_key(self.system);
            // Borrowed membership probe: duplicates skip with zero clone.
            if seen_keys.contains(&lookup_key) {
                continue;
            }

            let declarations = self.resolve_entry(decl, diet);
            if declarations.is_empty() {
                // Failed decls still join the seen set (same skip-next
                // behavior), moving the owned key: zero clone.
                seen_keys.insert(lookup_key);
                continue;
            }
            // Success needs the key twice (set + carried keys): one clone.
            seen_keys.insert(lookup_key.clone());
            keys.push(lookup_key);
            plans.push(RuntimeStylePlan {
                system: self.system.to_string(),
                when: decl.when.clone(),
                prop: decl.prop.clone(),
                value: decl.value.clone(),
                important: decl.important,
                declarations,
            });
        }

        (plans, keys)
    }

    fn resolve_entry(&mut self, decl: &AuthoredDeclaration, diet: bool) -> Vec<RuntimeDeclaration> {
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

        let when_boxed: smallvec::SmallVec<[Box<str>; 2]> = decl
            .when
            .iter()
            .map(|w| w.clone().into_boxed_str())
            .collect();

        let want = Want::new(decl.prop.as_str(), atom_val)
            .with_when(when_boxed)
            .with_important(decl.important);

        let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

        if diet {
            return diet_declarations(insert_diet_atoms(&mut *self.atom_set, atoms));
        }
        let mut out = Vec::with_capacity(atoms.len());
        for atom in atoms {
            let slot = derive_slot(&atom.prop, &decl.when, None);
            let class_name = class_name_with_system(&atom, self.system);
            self.atom_set.insert(atom);
            out.push(RuntimeDeclaration { slot, class_name });
        }
        out
    }

    fn resolve_array(
        &mut self,
        decl: &AuthoredDeclaration,
        arr: &[Value],
        diet: bool,
    ) -> Vec<RuntimeDeclaration> {
        let mut out = Vec::new();
        let mut diet_any = false;
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
            let when_boxed: smallvec::SmallVec<[Box<str>; 2]> = step_when
                .iter()
                .map(|w| w.clone().into_boxed_str())
                .collect();

            let want = Want::new(decl.prop.as_str(), atom_val)
                .with_when(when_boxed)
                .with_important(decl.important);

            let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            if diet {
                diet_any |= insert_diet_atoms(&mut *self.atom_set, atoms);
                continue;
            }
            for atom in atoms {
                let slot = derive_slot(&atom.prop, &decl.when, Some(bp));
                let class_name = class_name_with_system(&atom, self.system);
                self.atom_set.insert(atom);
                out.push(RuntimeDeclaration { slot, class_name });
            }
        }
        if diet {
            return diet_declarations(diet_any);
        }
        out
    }

    fn resolve_object(
        &mut self,
        decl: &AuthoredDeclaration,
        map: &serde_json::Map<String, Value>,
        diet: bool,
    ) -> Vec<RuntimeDeclaration> {
        let mut out = Vec::new();
        let mut diet_any = false;
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
            let when_boxed: smallvec::SmallVec<[Box<str>; 2]> = step_when
                .iter()
                .map(|w| w.clone().into_boxed_str())
                .collect();

            let want = Want::new(decl.prop.as_str(), atom_val)
                .with_when(when_boxed)
                .with_important(decl.important);

            let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            if diet {
                diet_any |= insert_diet_atoms(&mut *self.atom_set, atoms);
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
                let class_name = class_name_with_system(&atom, self.system);
                self.atom_set.insert(atom);
                out.push(RuntimeDeclaration { slot, class_name });
            }
        }
        if diet {
            return diet_declarations(diet_any);
        }
        out
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

/// Insert diet-path atoms, reporting whether any resolved. Slot/class
/// materialization stays skipped; the inserts are load-bearing (the subset
/// proof holed on leaf-`!` responsive objects, ATM-LEAF-11, where the plan
/// pass resolves object-level important atoms no pass-1 want produces).
fn insert_diet_atoms(atom_set: &mut AtomSet, atoms: Vec<crate::atom::Atom>) -> bool {
    let nonempty = !atoms.is_empty();
    for atom in atoms {
        atom_set.insert(atom);
    }
    nonempty
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
