//! Compile-span tracer and per-phase allocation ledger for `alloc-trace`.
//! It snapshots the counting allocator around one blocking compile call and,
//! when `ALLOC_TRACE_OUT` names a file, dumps one JSON report on drop holding
//! the span totals, the process census, and one row per compiler phase. Phase
//! guards mark the pipeline stages from the inside; each row carries the bytes
//! and blocks allocated and freed inside the phase plus live at its edges, so
//! the reserve/arena work can see which phase allocates what and what it
//! retains. Without the env var the span counts silently. This module only
//! exists with the feature enabled, so the shipped `.node` never pays for it.

use std::cell::RefCell;
use std::ffi::c_void;
use std::fs;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Instant;

use super::alloc_counters::{bucket_rows, capture, Counters};

/// Env var naming the JSON file the span guard dumps at compile end.
pub const TRACE_OUT_ENV: &str = "ALLOC_TRACE_OUT";

static SPAN_CALLS: AtomicU64 = AtomicU64::new(0);
static SPAN_ACTIVE: AtomicBool = AtomicBool::new(false);

/// One compiler-phase ledger row: counter deltas across the guard plus live
/// at both edges. Net growth is alloc minus free; the span-global peak is
/// never attributed per phase.
struct PhaseRow {
    name: &'static str,
    wall_ms: f64,
    alloc_bytes: u64,
    alloc_blocks: u64,
    free_bytes: u64,
    free_blocks: u64,
    live_enter: u64,
    live_exit: u64,
}

thread_local! {
    static PHASE_ROWS: RefCell<Vec<PhaseRow>> = const { RefCell::new(Vec::new()) };
}

/// RAII mark around one compiler phase. Snapshots the counters on enter and
/// pushes the delta row on drop; the span drains the rows at compile end.
/// The landed phases run strictly sequential, so each row slices the span.
pub struct PhaseGuard {
    name: &'static str,
    started: Instant,
    before: Counters,
}

impl PhaseGuard {
    pub fn enter(name: &'static str) -> Self {
        Self {
            name,
            started: Instant::now(),
            before: capture(),
        }
    }
}

impl Drop for PhaseGuard {
    fn drop(&mut self) {
        let after = capture();
        let row = PhaseRow {
            name: self.name,
            wall_ms: self.started.elapsed().as_secs_f64() * 1000.0,
            alloc_bytes: after.alloc_bytes - self.before.alloc_bytes,
            alloc_blocks: after.alloc_blocks - self.before.alloc_blocks,
            free_bytes: after.free_bytes - self.before.free_bytes,
            free_blocks: after.free_blocks - self.before.free_blocks,
            live_enter: self.before.live,
            live_exit: after.live,
        };
        PHASE_ROWS.with(|rows| rows.borrow_mut().push(row));
    }
}

/// Drop rows left by span-less compiles (feature-on tests, other entries),
/// so each span files exactly its own phases.
fn clear_phase_rows() {
    PHASE_ROWS.with(|rows| rows.borrow_mut().clear());
}

fn drain_phase_rows() -> Vec<PhaseRow> {
    PHASE_ROWS.with(|rows| std::mem::take(&mut *rows.borrow_mut()))
}

/// RAII span around one blocking compile call. Nested enters degrade to no-ops
/// so only the outermost call dumps; every span still counts process-wide.
pub struct CompileSpan {
    started: Instant,
    start_unix_ms: u64,
    before: Counters,
    zone_enter: Option<(usize, usize)>,
    request_json_bytes: usize,
    file_count: usize,
    files_content_bytes: usize,
    files_path_bytes: usize,
    active: bool,
}

/// Wall-clock milliseconds; lets the harness place GC events from the same
/// process inside or outside the compile window. Falls back to zero when the
/// system clock predates the epoch, which only means unplaceable.
fn unix_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|elapsed| elapsed.as_millis() as u64)
        .unwrap_or(0)
}

impl CompileSpan {
    pub fn enter(request_json_bytes: usize) -> Self {
        let active = !SPAN_ACTIVE.swap(true, Ordering::Relaxed);
        if active {
            SPAN_CALLS.fetch_add(1, Ordering::Relaxed);
            clear_phase_rows();
        }
        Self {
            started: Instant::now(),
            start_unix_ms: unix_ms(),
            before: capture(),
            zone_enter: zone_raw(),
            request_json_bytes,
            file_count: 0,
            files_content_bytes: 0,
            files_path_bytes: 0,
            active,
        }
    }

    /// Byte accounting of the handed-off sources, mirroring R1's deterministic
    /// reachable-live ledger (contents + paths + the request JSON string).
    pub fn note_files(&mut self, files: Option<&Vec<crate::VirtualSource>>) {
        let Some(sources) = files else { return };
        self.file_count = sources.len();
        for source in sources {
            self.files_content_bytes += source.content.len();
            self.files_path_bytes += source.path.len();
        }
    }
}

impl Drop for CompileSpan {
    fn drop(&mut self) {
        if !self.active {
            return;
        }
        SPAN_ACTIVE.store(false, Ordering::Relaxed);
        finish_span(self);
    }
}

#[cfg(target_os = "macos")]
#[repr(C)]
struct ZoneStats {
    blocks_in_use: u32,
    size_in_use: usize,
    max_size_in_use: usize,
    size_allocated: usize,
}

#[cfg(target_os = "macos")]
extern "C" {
    fn malloc_zone_statistics(zone: *mut c_void, stats: *mut ZoneStats);
}

/// Raw default-zone reading: reserved bytes plus bytes the program holds. A
/// null zone selects the default zone shared with Node. Reserved counts whole
/// region chunks the allocator claimed, including never-faulted pages, so it
/// can exceed RSS; the enter-to-exit delta is the compile-attributable part.
#[cfg(target_os = "macos")]
fn zone_raw() -> Option<(usize, usize)> {
    let mut stats = ZoneStats {
        blocks_in_use: 0,
        size_in_use: 0,
        max_size_in_use: 0,
        size_allocated: 0,
    };
    unsafe { malloc_zone_statistics(std::ptr::null_mut(), &mut stats) };
    Some((stats.size_allocated, stats.size_in_use))
}

#[cfg(not(target_os = "macos"))]
fn zone_raw() -> Option<(usize, usize)> {
    None
}

fn zone_value(raw: Option<(usize, usize)>) -> serde_json::Value {
    match raw {
        Some((allocated, in_use)) => serde_json::json!({
            "sizeAllocated": allocated,
            "sizeInUse": in_use,
            "slack": allocated.saturating_sub(in_use),
        }),
        None => serde_json::Value::Null,
    }
}

fn span_value(span: &CompileSpan, after: &Counters, end_unix_ms: u64) -> serde_json::Value {
    serde_json::json!({
        "wallMs": span.started.elapsed().as_secs_f64() * 1000.0,
        "startUnixMs": span.start_unix_ms,
        "endUnixMs": end_unix_ms,
        "allocBytes": after.alloc_bytes - span.before.alloc_bytes,
        "allocBlocks": after.alloc_blocks - span.before.alloc_blocks,
        "freeBytes": after.free_bytes - span.before.free_bytes,
        "freeBlocks": after.free_blocks - span.before.free_blocks,
        "liveAtEnter": span.before.live,
        "liveAtExit": after.live,
        "netGrowth": after.live as i64 - span.before.live as i64,
        "peakLive": after.peak.saturating_sub(span.before.live),
        "reallocs": after.reallocs - span.before.reallocs,
        "requestJsonBytes": span.request_json_bytes,
        "fileCount": span.file_count,
        "filesContentBytes": span.files_content_bytes,
        "filesPathBytes": span.files_path_bytes,
        "zoneAtEnter": zone_value(span.zone_enter),
        "zoneAtExit": zone_value(zone_raw()),
    })
}

fn process_value(after: &Counters) -> serde_json::Value {
    serde_json::json!({
        "spans": SPAN_CALLS.load(Ordering::Relaxed),
        "allocBytes": after.alloc_bytes,
        "allocBlocks": after.alloc_blocks,
        "freeBytes": after.free_bytes,
        "freeBlocks": after.free_blocks,
        "liveBytes": after.live,
        "peakLiveBytes": after.peak,
        "buckets": bucket_rows(),
    })
}

fn phase_rows_value(rows: &[PhaseRow]) -> Vec<serde_json::Value> {
    rows.iter()
        .map(|row| {
            serde_json::json!({
                "name": row.name,
                "wallMs": row.wall_ms,
                "allocBytes": row.alloc_bytes,
                "allocBlocks": row.alloc_blocks,
                "freeBytes": row.free_bytes,
                "freeBlocks": row.free_blocks,
                "liveAtEnter": row.live_enter,
                "liveAtExit": row.live_exit,
            })
        })
        .collect()
}

fn trace_out_path() -> Option<String> {
    match std::env::var(TRACE_OUT_ENV) {
        Ok(path) if !path.is_empty() => Some(path),
        _ => None,
    }
}

fn write_report(path: &str, report: &serde_json::Value) {
    let text = match serde_json::to_string_pretty(report) {
        Ok(text) => text,
        Err(err) => {
            eprintln!("[alloc-trace] failed to serialize report: {err}");
            return;
        }
    };
    if let Err(err) = fs::write(path, text) {
        eprintln!("[alloc-trace] failed to write {path}: {err}");
    }
}

fn finish_span(span: &CompileSpan) {
    let after = capture();
    let end_unix_ms = unix_ms();
    let report = serde_json::json!({
        "schema": 1,
        "span": span_value(span, &after, end_unix_ms),
        "process": process_value(&after),
        "phases": phase_rows_value(&drain_phase_rows()),
    });
    if let Some(path) = trace_out_path() {
        write_report(&path, &report);
    }
}

/// Current cumulative counters as JSON for the `getAllocTrace` probe export.
pub fn snapshot_json() -> String {
    let current = capture();
    serde_json::json!({
        "schema": 1,
        "spans": SPAN_CALLS.load(Ordering::Relaxed),
        "allocBytes": current.alloc_bytes,
        "allocBlocks": current.alloc_blocks,
        "freeBytes": current.free_bytes,
        "freeBlocks": current.free_blocks,
        "liveBytes": current.live,
        "peakLiveBytes": current.peak,
        "buckets": bucket_rows(),
    })
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::{drain_phase_rows, CompileSpan, PhaseGuard};

    /// Guard mechanics: rows land in enter order and the span files exactly
    /// its own phases. Deltas read zero here — unit tests link the default
    /// allocator, not TraceAlloc — so this pins shape, and the instrumented
    /// `.node` E2E proves live counts.
    #[test]
    fn phase_rows_drain_in_enter_order() {
        drain_phase_rows();
        {
            let _first = PhaseGuard::enter("first");
        }
        {
            let _second = PhaseGuard::enter("second");
        }
        let rows = drain_phase_rows();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].name, "first");
        assert_eq!(rows[1].name, "second");
        assert!(drain_phase_rows().is_empty());
    }

    #[test]
    fn span_enter_clears_stale_rows() {
        {
            let _stale = PhaseGuard::enter("stale");
        }
        let span = CompileSpan::enter(0);
        assert!(drain_phase_rows().is_empty());
        drop(span);
    }
}
