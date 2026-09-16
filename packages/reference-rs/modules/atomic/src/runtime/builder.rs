//! Resolution of authored style declarations into runtime style plans and cascade slots.
//! Connects pre-expansion authored inputs to post-resolution cascade declarations.
//! Computes opaque cascade slots for property-condition pairings and applies system segments to class names.
//! Deduplicates identical authored intentions and collects resulting atomic utilities into the AtomSet.

use std::collections::{BTreeMap, HashSet};

use base_system::BaseSystem;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::plan::{RecipeRuntimeTable, RuntimeDeclaration, RuntimeStylePlan};
use super::serializer::{serialize_lookup_key, LookupKey};
use crate::atom::{AtomSet, AtomValue, Want};
use crate::diagnostics::Diagnostic;
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

fn r_object_to_atom_value(map: &serde_json::Map<String, Value>) -> Option<AtomValue> {
    let r_val = map.get("$r")?;
    let multiplier = if let Some(f) = r_val.as_f64() {
        if (f - f.round()).abs() < 1e-6 {
            format!("{}", f as i64)
        } else {
            format!("{f}")
        }
    } else {
        r_val.to_string()
    };
    Some(AtomValue::String(format!("{multiplier}r").into_boxed_str()))
}

fn scalar_to_atom_value(val: &Value) -> Option<AtomValue> {
    if let Some(s) = val.as_str() {
        return Some(AtomValue::String(s.into()));
    }
    if let Some(b) = val.as_bool() {
        return Some(AtomValue::Bool(b));
    }
    if val.is_null() {
        return Some(AtomValue::Null);
    }
    if let Some(n) = val.as_number() {
        return Some(AtomValue::Number(n.to_string().into_boxed_str()));
    }
    None
}

/// Convert a JSON value into an AtomValue representation for resolve passes.
fn json_to_atom_value(val: &Value) -> Option<AtomValue> {
    if let Some(scalar) = scalar_to_atom_value(val) {
        return Some(scalar);
    }
    if let Some(map) = val.as_object() {
        return r_object_to_atom_value(map);
    }
    None
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
    };
    let atoms = resolve_want_with(want, &mut session);
    for diag in local {
        if !diagnostics.contains(&diag) {
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

    /// Build runtime style plans from authored declarations, deduplicating keys.
    pub fn build(&mut self, decls: &[AuthoredDeclaration]) -> Vec<RuntimeStylePlan> {
        let mut plans = Vec::new();
        let mut seen_keys = HashSet::new();

        for decl in decls {
            let lookup_key = decl.lookup_key(self.system);
            if !seen_keys.insert(lookup_key) {
                continue;
            }

            let declarations = self.resolve_entry(decl);
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

    fn resolve_entry(&mut self, decl: &AuthoredDeclaration) -> Vec<RuntimeDeclaration> {
        if let Value::Array(arr) = &decl.value {
            return self.resolve_array(decl, arr);
        }

        let Some(atom_val) = json_to_atom_value(&decl.value) else {
            return Vec::new();
        };

        let when_boxed: smallvec::SmallVec<[Box<str>; 2]> =
            decl.when.iter().map(|w| w.clone().into_boxed_str()).collect();

        let want = Want::new(decl.prop.as_str(), atom_val)
            .with_when(when_boxed)
            .with_important(decl.important);

        let atoms =
            resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

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
    ) -> Vec<RuntimeDeclaration> {
        let mut out = Vec::new();
        let bp_scale = self.base_system.breakpoints();

        for (idx, elem) in arr.iter().enumerate() {
            if elem.is_null() {
                continue;
            }
            let Some(bp) = bp_scale.breakpoint_for_index(idx) else {
                continue;
            };
            let Some(atom_val) = json_to_atom_value(elem) else {
                continue;
            };

            let mut step_when = decl.when.clone();
            step_when.push(bp.to_string());
            let when_boxed: smallvec::SmallVec<[Box<str>; 2]> =
                step_when.iter().map(|w| w.clone().into_boxed_str()).collect();

            let want = Want::new(decl.prop.as_str(), atom_val)
                .with_when(when_boxed)
                .with_important(decl.important);

            let atoms =
                resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            for atom in atoms {
                let slot = derive_slot(&atom.prop, &decl.when, Some(bp));
                let class_name = class_name_with_system(&atom, self.system);
                self.atom_set.insert(atom);
                out.push(RuntimeDeclaration { slot, class_name });
            }
        }
        out
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
