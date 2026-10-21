//! Parallel want resolution. Each want lowers on its own; atoms and
//! diagnostics commit in input order on the caller. The base system is
//! shared read-only. Small batches stay on the serial loop in assembly. A lane that panics comes back as
//! a compile error from `resolve_wants`, never as a resumed unwind.

use std::thread::Scope;

use base_system::BaseSystem;

use crate::atom::{Atom, Want};
use crate::diagnostics::{Diagnostic, DiagnosticFact, DiagnosticLocation, DiagnosticsSession};
use crate::extract_parallel::shard_strides;
use crate::lanes::{lane_panic, spawn_lane, PoolGuard};
use crate::resolve::{resolve_want_with, ResolveSession};

/// One want's atoms, rendered lines, and resolve facts, in resolve order.
pub(crate) struct ResolvedWant {
    pub atoms: Vec<Atom>,
    pub diagnostics: Vec<Diagnostic>,
    pub facts: Vec<DiagnosticFact>,
}

/// Resolve every want across the guarded lanes, strided for balance. Each
/// shard reports its positions; the caller places them back in input order.
/// Every lane is joined before the first panic message is returned.
pub(crate) fn resolve_wants(
    wants: &[&Want],
    system: &BaseSystem,
    guard: &PoolGuard,
) -> Result<Vec<ResolvedWant>, String> {
    let workers = guard.workers().get();
    let placed = std::thread::scope(|scope| {
        let handles = spawn(scope, wants, system, workers);
        collect_placed(wants.len(), handles)
    })?;
    // Strides cover every index exactly once, so every slot fills.
    debug_assert!(placed.iter().all(|slot| slot.is_some()));
    Ok(placed.into_iter().flatten().collect())
}

/// Join every lane, then place each shard's wants at their input index. Every lane is joined
/// before the first failure is returned.
fn collect_placed(
    len: usize,
    handles: Vec<std::thread::ScopedJoinHandle<'_, Vec<(usize, ResolvedWant)>>>,
) -> Result<Vec<Option<ResolvedWant>>, String> {
    // Joining every handle before the first `?` keeps the lanes from outliving the failure.
    let joined: Vec<_> = handles.into_iter().map(join).collect();
    let mut placed: Vec<Option<ResolvedWant>> = Vec::with_capacity(len);
    placed.resize_with(len, || None);
    for shard in joined {
        for (index, item) in shard? {
            placed[index] = Some(item);
        }
    }
    Ok(placed)
}

fn spawn<'scope, 'env, 'w>(
    scope: &'scope Scope<'scope, 'env>,
    wants: &'env [&'w Want],
    system: &'env BaseSystem,
    workers: usize,
) -> Vec<std::thread::ScopedJoinHandle<'scope, Vec<(usize, ResolvedWant)>>>
where
    'w: 'env,
{
    let mut handles = Vec::with_capacity(workers);
    for shard in shard_strides(wants.len(), workers) {
        handles.push(spawn_lane(scope, move || {
            resolve_shard(wants, system, &shard)
        }));
    }
    handles
}

fn resolve_shard(
    wants: &[&Want],
    system: &BaseSystem,
    indexes: &[usize],
) -> Vec<(usize, ResolvedWant)> {
    indexes
        .iter()
        .map(|&index| {
            // Test-only: a want from the marked source file panics the lane that owns it.
            #[cfg(test)]
            crate::phase_gate::panic_marker(
                wants[index].file.as_deref().unwrap_or(""),
                "p1-panic-resolve",
            );
            (index, resolve_one(wants[index], system))
        })
        .collect()
}

fn resolve_one(want: &Want, system: &BaseSystem) -> ResolvedWant {
    let mut diagnostics = Vec::new();
    let mut facts = DiagnosticsSession::new();
    let atoms = {
        let mut session = ResolveSession {
            system,
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: Some(&mut facts),
            want: None,
        };
        resolve_want_with(want, &mut session)
    };
    ResolvedWant {
        atoms,
        diagnostics,
        facts: facts.take_facts(),
    }
}

fn join(
    handle: std::thread::ScopedJoinHandle<'_, Vec<(usize, ResolvedWant)>>,
) -> Result<Vec<(usize, ResolvedWant)>, String> {
    handle
        .join()
        .map_err(|payload| lane_panic("resolve", &*payload))
}
