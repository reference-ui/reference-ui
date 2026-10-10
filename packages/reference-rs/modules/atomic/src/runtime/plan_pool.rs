//! Parallel plan build. First-seen declarations resolve on workers; the
//! caller replays key order, dedupes diagnostics, and inserts atoms.
//! Duplicate keys never resolve, matching the serial skip.

use std::thread::Scope;

use rustc_hash::{FxBuildHasher, FxHashSet};

use super::builder::{
    fresh_targets, insert_resolved, plan_for_system, AuthoredDeclaration, DetachedDecl, PlanBuilder,
};
use super::plan::RuntimeStylePlan;
use super::values::is_duplicate;
use crate::extract_parallel::shard_strides;
use crate::lanes::PoolGuard;

/// Keyed build for a declaration list large enough to shard.
pub(crate) fn build_keyed(
    builder: &mut PlanBuilder<'_>,
    decls: &[AuthoredDeclaration],
    diet: bool,
    guard: &PoolGuard,
) -> (Vec<RuntimeStylePlan>, Vec<String>) {
    let work = first_seen(builder.system, builder.qualifiers, decls);
    let ctx = PlanCtx {
        builder,
        decls,
        work: &work,
        diet,
        workers: guard.workers().get(),
    };
    let resolved = resolve_seen(&ctx);
    commit(builder, decls, resolved, diet)
}

/// Indexes of the first declaration for each `(external, own-key)` identity, in
/// decl order. External declarations with no foreign qualifier emit nothing, so
/// they never resolve. The marker keeps an own declaration and an external one
/// with identical identity from collapsing into a single plan.
fn first_seen(system: &str, qualifiers: &[String], decls: &[AuthoredDeclaration]) -> Vec<usize> {
    let mut seen = FxHashSet::with_capacity_and_hasher(decls.len(), FxBuildHasher);
    let mut work = Vec::new();
    for (index, decl) in decls.iter().enumerate() {
        if decl.external && qualifiers.len() < 2 {
            continue;
        }
        if seen.insert((decl.external, decl.lookup_key(system))) {
            work.push(index);
        }
    }
    work
}

/// Shared inputs for one keyed plan build over first-seen declarations.
struct PlanCtx<'a> {
    builder: &'a PlanBuilder<'a>,
    decls: &'a [AuthoredDeclaration],
    work: &'a [usize],
    diet: bool,
    /// Workers from the entry guard; always at least two.
    workers: usize,
}

fn resolve_seen(ctx: &PlanCtx<'_>) -> Vec<Option<DetachedDecl>> {
    let mut resolved = Vec::with_capacity(ctx.work.len());
    std::thread::scope(|scope| {
        let handles = spawn(scope, ctx);
        for handle in handles {
            resolved.extend(join_shard(handle));
        }
    });
    let mut placed = std::iter::repeat_with(|| None)
        .take(ctx.decls.len())
        .collect::<Vec<_>>();
    for (index, decl) in resolved {
        placed[index] = Some(decl);
    }
    placed
}

fn spawn<'scope, 'env>(
    scope: &'scope Scope<'scope, 'env>,
    ctx: &'env PlanCtx<'env>,
) -> Vec<std::thread::ScopedJoinHandle<'scope, Vec<(usize, DetachedDecl)>>> {
    let mut handles = Vec::with_capacity(ctx.workers);
    for shard in shard_strides(ctx.work.len(), ctx.workers) {
        let indexes: Vec<usize> = shard.iter().map(|&spot| ctx.work[spot]).collect();
        handles.push(scope.spawn(move || resolve_shard(ctx, &indexes)));
    }
    handles
}

fn join_shard(
    handle: std::thread::ScopedJoinHandle<'_, Vec<(usize, DetachedDecl)>>,
) -> Vec<(usize, DetachedDecl)> {
    match handle.join() {
        Ok(resolved) => resolved,
        Err(payload) => std::panic::resume_unwind(payload),
    }
}

fn resolve_shard(ctx: &PlanCtx<'_>, indexes: &[usize]) -> Vec<(usize, DetachedDecl)> {
    indexes
        .iter()
        .map(|&index| {
            let resolved = PlanBuilder::resolve_detached(
                ctx.builder.system,
                ctx.builder.base_system,
                &ctx.decls[index],
                ctx.diet,
            );
            (index, resolved)
        })
        .collect()
}

fn commit(
    builder: &mut PlanBuilder<'_>,
    decls: &[AuthoredDeclaration],
    mut resolved: Vec<Option<DetachedDecl>>,
    diet: bool,
) -> (Vec<RuntimeStylePlan>, Vec<String>) {
    let mut plans = Vec::with_capacity(decls.len());
    let mut keys = Vec::with_capacity(decls.len());
    let mut seen = FxHashSet::with_capacity_and_hasher(decls.len(), FxBuildHasher);
    for (index, decl) in decls.iter().enumerate() {
        let Some(detached) = resolved[index].take() else {
            continue;
        };
        absorb_diagnostics(builder, detached.diagnostics);
        for (system, key) in fresh_targets(builder.system, builder.qualifiers, decl, &seen) {
            let plan = plan_for_system(decl, &detached.resolved, &system, diet);
            if plan.declarations.is_empty() {
                seen.insert(key);
            } else {
                seen.insert(key.clone());
                keys.push(key);
                plans.push(plan);
            }
        }
        insert_resolved(
            detached.resolved,
            decl.external,
            builder.atom_set,
            builder.external_atom_set,
        );
    }
    (plans, keys)
}

/// Merge one declaration's diagnostics into the shared builder, dropping repeats.
fn absorb_diagnostics(
    builder: &mut PlanBuilder<'_>,
    diagnostics: Vec<crate::diagnostics::Diagnostic>,
) {
    for diagnostic in diagnostics {
        if !is_duplicate(builder.diagnostics, &diagnostic) {
            builder.diagnostics.push(diagnostic);
        }
    }
}
