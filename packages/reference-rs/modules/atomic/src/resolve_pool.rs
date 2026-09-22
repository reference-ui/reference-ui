//! Parallel want resolution. Each want lowers on its own; atoms and
//! diagnostics commit in input order on the caller. The base system is
//! shared read-only. Small batches stay on the serial loop in assembly.

use std::thread::Scope;

use base_system::BaseSystem;

use crate::atom::{Atom, Want};
use crate::diagnostics::{Diagnostic, DiagnosticFact, DiagnosticLocation, DiagnosticsSession};
use crate::extract_parallel::shard_strides;
use crate::lanes::PoolGuard;
use crate::resolve::{resolve_want_with, ResolveSession};

/// One want's atoms, rendered lines, and resolve facts, in resolve order.
pub(crate) struct ResolvedWant {
    pub atoms: Vec<Atom>,
    pub diagnostics: Vec<Diagnostic>,
    pub facts: Vec<DiagnosticFact>,
}

/// Resolve every want across the guarded lanes, strided for balance. Each
/// shard reports its positions; the caller places them back in input order.
pub(crate) fn resolve_wants(
    wants: &[Want],
    system: &BaseSystem,
    guard: &PoolGuard,
) -> Vec<ResolvedWant> {
    let workers = guard.workers().get();
    std::thread::scope(|scope| {
        let handles = spawn(scope, wants, system, workers);
        let mut placed: Vec<Option<ResolvedWant>> = Vec::with_capacity(wants.len());
        placed.resize_with(wants.len(), || None);
        for handle in handles {
            for (index, resolved) in join(handle) {
                placed[index] = Some(resolved);
            }
        }
        // Strides cover every index exactly once, so every slot fills.
        debug_assert!(placed.iter().all(|slot| slot.is_some()));
        placed.into_iter().flatten().collect()
    })
}

fn spawn<'scope, 'env>(
    scope: &'scope Scope<'scope, 'env>,
    wants: &'env [Want],
    system: &'env BaseSystem,
    workers: usize,
) -> Vec<std::thread::ScopedJoinHandle<'scope, Vec<(usize, ResolvedWant)>>> {
    let mut handles = Vec::with_capacity(workers);
    for shard in shard_strides(wants.len(), workers) {
        handles.push(scope.spawn(move || resolve_shard(wants, system, &shard)));
    }
    handles
}

fn resolve_shard(
    wants: &[Want],
    system: &BaseSystem,
    indexes: &[usize],
) -> Vec<(usize, ResolvedWant)> {
    indexes
        .iter()
        .map(|&index| (index, resolve_one(&wants[index], system)))
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
) -> Vec<(usize, ResolvedWant)> {
    match handle.join() {
        Ok(resolved) => resolved,
        Err(payload) => std::panic::resume_unwind(payload),
    }
}
