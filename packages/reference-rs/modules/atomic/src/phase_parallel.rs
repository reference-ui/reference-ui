//! Parallel parse phase: one parse per file, on the worker that walks it.
//!
//! Workers fold owned records from a private parse, including the styletrace
//! module, then report to the coordinator. The coordinator merges constants
//! in source order, traces from those modules, and resolves imports. Workers
//! then walk the trees they still hold. Programs never cross a thread; shards
//! commit in input order. A dead lane fails its rendezvous instead of hanging
//! the phase, so panics surface as compile errors, never hangs.

use std::any::Any;
use std::path::Path;
use std::sync::{Arc, Mutex};

use oxc_allocator::Allocator;
use oxc_parser::ParserReturn;
use rustc_hash::FxHashSet;

use crate::extract::constants::LocalConstants;
use crate::extract::identity_map::ExportMap;
use crate::extract_parallel;
use crate::hosts::{self, ResolvedHosts};
use crate::lanes::PoolGuard;
use crate::phase_gate::{CoordGate, LaneFailure, LaneGate, PhaseCmd, Stage};
use crate::phase_lane::{self, OwnedFile, RecordIn};
use crate::stream::SourceSlot;
use crate::{streaming_candidate, string_skip, BreakpointScale, CompileRequest};

/// Cross-file answers published after the owned fold, before the walk.
#[derive(Clone)]
pub(crate) struct Published {
    pub constants: Arc<LocalConstants>,
    pub hosts: ResolvedHosts,
    pub traced: FxHashSet<String>,
    pub source_ids: Vec<Option<u32>>,
    pub maps: Vec<Option<Arc<ExportMap>>>,
}

/// Inputs every lane borrows. The coordinator alone holds the sinks.
pub(crate) struct Shared<'a> {
    pub request: &'a CompileRequest,
    pub sources: &'a [(String, String)],
    pub streamed: &'a [bool],
    pub files: &'a [Mutex<OwnedFile>],
    pub published: &'a Mutex<Option<Arc<Published>>>,
    pub breakpoints: &'a BreakpointScale,
    pub system: &'a str,
    pub surface: &'a styletrace::StyleSurface,
    pub trace_root: Option<&'a Path>,
}

// Lanes share `&Shared` through the scope and read `Arc<Published>` after
// publish; both stay `Send + Sync` or the phase must not compile.
const _: fn() = || {
    fn share<T: Send + Sync>() {}
    share::<Shared<'_>>();
    share::<Published>();
};

/// Parse, resolve, and walk across the guarded lanes. The caller plans the
/// lane count; the guard proves this phase may spawn. Every shard runs on a
/// spawned lane while the caller only coordinates, so a dying lane fails its
/// rendezvous instead of hanging a barrier. Lane panics return as errors; a
/// coordinator panic is caught into an error after the lanes release and join.
pub(crate) fn run(
    request: &CompileRequest,
    sources: &[(String, String)],
    mut sinks: super::CompileSinks<'_>,
    guard: &PoolGuard,
) -> Result<(Vec<usize>, ResolvedHosts), String> {
    let streamed: Vec<bool> = sources
        .iter()
        .map(|(_, content)| streaming_candidate(content))
        .collect();
    let mut slots: Vec<SourceSlot> = streamed.iter().copied().map(SourceSlot::new).collect();
    let files: Vec<Mutex<OwnedFile>> = (0..sources.len())
        .map(|_| Mutex::new(OwnedFile::blank()))
        .collect();
    let shards = extract_parallel::shard_strides(sources.len(), guard.workers().get());
    if shards.is_empty() {
        return Ok((Vec::new(), vacant_hosts(request)));
    }
    let published = Mutex::new(None);
    let breakpoints = request.base_system.breakpoints();
    let surface = hosts::engine_surface(&request.base_system);
    let trace_root = hosts::trace_root(request);
    let shared = Shared {
        request,
        sources,
        streamed: &streamed,
        files: &files,
        published: &published,
        breakpoints,
        system: request.base_system.name.as_str(),
        surface: &surface,
        trace_root: trace_root.as_deref(),
    };
    // Unwind safety: a caught coordinator panic aborts the compile outright,
    // so the borrowed sinks and slots are never reused in a broken state.
    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        orchestrate(&shared, &shards, &mut slots, &mut sinks)
    }));
    match outcome {
        Ok(Ok(output)) => Ok(output),
        Ok(Err(failure)) => Err(failure.message()),
        Err(payload) => Err(coordinator_panic_message(&payload)),
    }
}

/// Spawn one lane per shard, drive the rendezvous rounds, then commit. The
/// scope joins every lane before returning — including while unwinding, when
/// the dropped command senders release the waiting lanes first.
fn orchestrate(
    shared: &Shared<'_>,
    shards: &[Vec<usize>],
    slots: &mut [SourceSlot],
    sinks: &mut super::CompileSinks<'_>,
) -> Result<(Vec<usize>, ResolvedHosts), LaneFailure> {
    std::thread::scope(|scope| {
        let links = crate::phase_gate::links(shards.len());
        let mut handles = Vec::with_capacity(shards.len());
        for (shard, gate) in shards.iter().zip(links.lanes) {
            handles.push(scope.spawn(move || run_lane(shared, shard, gate)));
        }
        drive_rounds(shared, &links.coord, handles, &mut *sinks)?;
        Ok(crate::phase_commit::settle(shared, slots, sinks))
    })
}

/// Drive record, refs, and walk as three rendezvous rounds, then join.
/// Reports arrive lane by lane: a dead lane fails its own receive, so the
/// round aborts instead of hanging on a peer that will never report.
fn drive_rounds<'scope>(
    shared: &Shared<'_>,
    gates: &[CoordGate],
    handles: Vec<std::thread::ScopedJoinHandle<'scope, ()>>,
    sinks: &mut super::CompileSinks<'_>,
) -> Result<(), LaneFailure> {
    if let Err(lane) = await_reports(gates) {
        return abort(gates, handles, LaneFailure::new(lane, Stage::Record));
    }
    let (constants, staged) = crate::phase_merge::publish(shared, sinks);
    let mut graph = crate::phase_merge::build_graph(shared.sources, staged, constants.as_ref());
    broadcast(gates, PhaseCmd::Proceed);
    if let Err(lane) = await_reports(gates) {
        return abort(gates, handles, LaneFailure::new(lane, Stage::Refs));
    }
    crate::phase_walk::resolve_all(shared, &mut graph);
    broadcast(gates, PhaseCmd::Proceed);
    if let Err(lane) = await_reports(gates) {
        return abort(gates, handles, LaneFailure::new(lane, Stage::Walk));
    }
    join_all(handles);
    Ok(())
}

/// Wait for every lane's report for this round, in lane order. Only the dead
/// lane's receive fails; healthy lanes always send before they wait.
fn await_reports(gates: &[CoordGate]) -> Result<(), usize> {
    for (lane, gate) in gates.iter().enumerate() {
        if gate.await_report().is_err() {
            return Err(lane);
        }
    }
    Ok(())
}

/// Send one verdict to every lane. Dead lanes fail silently; the coordinator
/// already recorded them through their report channels.
fn broadcast(gates: &[CoordGate], cmd: PhaseCmd) {
    for gate in gates {
        gate.command(cmd);
    }
}

/// Abort the round: stop the survivors, join every lane, report the dead one.
/// Joined panic payloads are dropped, never resumed: the failure surfaces as
/// the compile error this returns.
fn abort<'scope>(
    gates: &[CoordGate],
    handles: Vec<std::thread::ScopedJoinHandle<'scope, ()>>,
    failure: LaneFailure,
) -> Result<(), LaneFailure> {
    broadcast(gates, PhaseCmd::Abort);
    join_all(handles);
    Err(failure)
}

/// Join every lane, dropping panic payloads (see [`abort`]).
fn join_all<'scope>(handles: Vec<std::thread::ScopedJoinHandle<'scope, ()>>) {
    for handle in handles {
        let _ = handle.join();
    }
}

/// Describe a coordinator panic as the compile error it becomes. The lanes
/// already exited and joined: unwinding dropped their command senders, so no
/// lane waited while the coordinator died.
fn coordinator_panic_message(payload: &(dyn Any + Send)) -> String {
    let detail = payload
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| payload.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("unknown panic payload");
    format!("parallel phase: coordinator panicked ({detail}); compile aborted")
}

/// One shard on its own thread: parse, report, then walk after the publish.
/// The lane sends one report per round and exits on abort; it never waits on
/// a peer, so a dead sibling cannot hang it. Parses borrow the lane-local
/// arenas across every round; programs never cross a thread.
fn run_lane(shared: &Shared<'_>, shard: &[usize], gate: LaneGate) {
    let retained = shard
        .iter()
        .copied()
        .filter(|index| !shared.streamed[*index])
        .collect::<Vec<_>>();
    let allocators: Vec<Allocator> = retained.iter().map(|_| Allocator::default()).collect();
    stage_streamed(shared, shard);
    let parsed = parse_retained(shared, &retained, &allocators);
    record_retained(shared, &retained, &parsed);
    if !gate.rendezvous() {
        return;
    }
    crate::phase_walk::store_refs(shared, &retained, &parsed);
    if !gate.rendezvous() {
        return;
    }
    crate::phase_walk::walk_retained(shared, &retained, &parsed);
    gate.finish();
}

/// Streamed files parse, fold, and drop before the retained arenas exist.
fn stage_streamed(shared: &Shared<'_>, shard: &[usize]) {
    for &index in shard {
        if !shared.streamed[index] {
            continue;
        }
        let (path, content) = &shared.sources[index];
        #[cfg(test)]
        crate::phase_gate::panic_marker(content, "p0a-panic-record");
        let allocator = Allocator::default();
        let parsed = crate::parse_source(path, content, &allocator);
        let mut file = phase_lane::lock(&shared.files[index]);
        phase_lane::record(
            &mut file,
            &RecordIn {
                path,
                content,
                parsed: &parsed,
                harvest: false,
                trace_root: shared.trace_root,
                surface: shared.surface,
            },
        );
    }
}

/// Retained parses, borrowing the lane's allocators for the rest of the phase.
/// The `'alloc` tie keeps every parse inside the lane frame: parses borrow the
/// lane allocators, never shared data, so none can escape the lane.
fn parse_retained<'alloc>(
    shared: &Shared<'alloc>,
    indices: &[usize],
    allocators: &'alloc [Allocator],
) -> Vec<ParserReturn<'alloc>> {
    indices
        .iter()
        .zip(allocators.iter())
        .map(|(&index, allocator)| {
            let (path, content) = &shared.sources[index];
            crate::parse_source(path, content, allocator)
        })
        .collect()
}

/// Fold retained parses into their slots, including the harvest pool.
fn record_retained(shared: &Shared<'_>, indices: &[usize], parsed: &[ParserReturn<'_>]) {
    for (&index, parsed) in indices.iter().zip(parsed.iter()) {
        let (path, content) = &shared.sources[index];
        #[cfg(test)]
        crate::phase_gate::panic_marker(content, "p0a-panic-record");
        let mut file = phase_lane::lock(&shared.files[index]);
        phase_lane::record(
            &mut file,
            &RecordIn {
                path,
                content,
                parsed,
                harvest: !string_skip(content),
                trace_root: shared.trace_root,
                surface: shared.surface,
            },
        );
    }
}

/// The published bundle, if the coordinator stored one.
pub(crate) fn load_published(shared: &Shared<'_>) -> Option<Arc<Published>> {
    lock_published(shared.published).clone()
}

/// Lock the publish slot, recovering it after a poisoned guard.
pub(crate) fn lock_published(
    mutex: &Mutex<Option<Arc<Published>>>,
) -> std::sync::MutexGuard<'_, Option<Arc<Published>>> {
    mutex.lock().unwrap_or_else(|poison| poison.into_inner())
}

/// Hosts when the phase never published: configured names only.
pub(crate) fn vacant_hosts(request: &CompileRequest) -> ResolvedHosts {
    ResolvedHosts {
        traced: Vec::new(),
        configured: request.jsx_hosts.clone().unwrap_or_default(),
        owned_props: std::collections::BTreeMap::new(),
    }
}
