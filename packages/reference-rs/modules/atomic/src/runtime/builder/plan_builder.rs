//! Plan assembly for one compile: `PlanBuilder` borrows the own and external atom sets and the diagnostics sink through `PlanSinks`.
//! `build`, `build_diet`, and `build_with_keys` walk declarations in order, deduplicating canonical keys so each plan is emitted once per target system.
//! `resolve_detached` resolves one declaration on private placeholder sets, the entry point the parallel plan pool uses on its workers.

use base_system::BaseSystem;
use rustc_hash::{FxBuildHasher, FxHashSet};
use serde_json::Value;

use super::{fresh_targets, insert_resolved, plan_for_system, AuthoredDeclaration, DetachedDecl};
use crate::atom::{AtomSet, AtomValue};
use crate::diagnostics::Diagnostic;
use crate::lanes::{Lanes, WorkKind};
use crate::runtime::plan::RuntimeStylePlan;
use crate::runtime::values::{json_to_atom_value, RefusalSite, RefuseR};

/// The mutable sinks one plan build writes into, bundled so `PlanBuilder::new`
/// takes them as a single argument beside the system, base system, and qualifiers.
pub struct PlanSinks<'a> {
    /// Own-declaration atoms; plan resolution merges into this set in place.
    pub atom_set: &'a mut AtomSet,
    /// External-declaration atoms, kept apart from the own set.
    pub external_atom_set: &'a mut AtomSet,
    /// Diagnostics raised while resolving the declarations.
    pub diagnostics: &'a mut Vec<Diagnostic>,
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
        qualifiers: &'a [String],
        sinks: PlanSinks<'a>,
    ) -> Self {
        Self {
            system,
            base_system,
            atom_set: sinks.atom_set,
            external_atom_set: sinks.external_atom_set,
            qualifiers,
            diagnostics: sinks.diagnostics,
        }
    }

    /// Convert one plan-JSON value, refusing fenced `$r` multipliers in place.
    pub(super) fn convert_value(
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
            return crate::runtime::plan_pool::build_keyed(self, decls, diet, &guard);
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
