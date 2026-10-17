//! Resolution of authored style declarations into runtime style plans and cascade slots.
//! Connects pre-expansion authored inputs to post-resolution cascade declarations.
//! Computes opaque cascade slots for property-condition pairings and applies system segments to class names.
//! Deduplicates identical authored intentions and collects resulting atomic utilities into the AtomSet.
//! Own declarations target the compiling system; external declarations expand once per
//! foreign qualifier, routing their atoms into the separate external set.

mod plan_builder;
mod resolve;

pub use plan_builder::{PlanBuilder, PlanSinks};

use std::collections::BTreeMap;

use rustc_hash::FxHashSet;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::plan::{RecipeRuntimeTable, RuntimeDeclaration, RuntimeStylePlan};
use super::serializer::{serialize_lookup_key, LookupKey};
use crate::atom::{Atom, AtomSet};
use crate::diagnostics::Diagnostic;
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

/// One resolved atom plus its cascade slot, before system qualification.
pub(super) struct ResolvedAtom {
    pub(super) slot: String,
    pub(super) atom: Atom,
}

/// One declaration resolved away from the shared atom set.
pub(crate) struct DetachedDecl {
    pub(super) resolved: Vec<ResolvedAtom>,
    pub diagnostics: Vec<Diagnostic>,
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
