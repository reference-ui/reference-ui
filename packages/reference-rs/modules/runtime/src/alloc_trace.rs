//! Counting allocator and compile-span tracer for the `alloc-trace` instrument build.
//! It wraps the system allocator with atomic counters (bytes, blocks, live, peak,
//! size-class split) and snapshots one span per blocking compile call, adding the
//! request byte accounting plus the macOS allocator zone slack at span end. When
//! `ALLOC_TRACE_OUT` names a file, the span guard dumps one JSON report on drop;
//! without the env var it counts silently. This module only exists with the
//! feature enabled, so the shipped `.node` never pays for the counters.

use std::alloc::{GlobalAlloc, Layout, System};
use std::ffi::c_void;
use std::fs;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Instant;

/// Env var naming the JSON file the span guard dumps at compile end.
pub const TRACE_OUT_ENV: &str = "ALLOC_TRACE_OUT";

/// Inclusive upper bounds of the eight allocation size classes.
const BUCKET_LIMITS: [usize; 8] = [32, 128, 512, 2048, 8192, 32768, 131072, usize::MAX];

static ALLOC_BYTES: AtomicU64 = AtomicU64::new(0);
static ALLOC_BLOCKS: AtomicU64 = AtomicU64::new(0);
static FREE_BYTES: AtomicU64 = AtomicU64::new(0);
static FREE_BLOCKS: AtomicU64 = AtomicU64::new(0);
static LIVE_BYTES: AtomicU64 = AtomicU64::new(0);
static PEAK_LIVE: AtomicU64 = AtomicU64::new(0);
static REALLOCS: AtomicU64 = AtomicU64::new(0);
static SPAN_CALLS: AtomicU64 = AtomicU64::new(0);
static SPAN_ACTIVE: AtomicBool = AtomicBool::new(false);
static BUCKET_ALLOC_BYTES: [AtomicU64; 8] = bucket_zeros();
static BUCKET_ALLOC_BLOCKS: [AtomicU64; 8] = bucket_zeros();
static BUCKET_LIVE_BYTES: [AtomicU64; 8] = bucket_zeros();

const fn bucket_zeros() -> [AtomicU64; 8] {
    [
        AtomicU64::new(0),
        AtomicU64::new(0),
        AtomicU64::new(0),
        AtomicU64::new(0),
        AtomicU64::new(0),
        AtomicU64::new(0),
        AtomicU64::new(0),
        AtomicU64::new(0),
    ]
}

/// Global allocator counting every Rust-side allocation; Node's own malloc
/// traffic bypasses it, so the counters isolate the `.node` exactly.
pub struct TraceAlloc;

fn bucket(size: usize) -> usize {
    let mut index = 0;
    while index + 1 < BUCKET_LIMITS.len() && size > BUCKET_LIMITS[index] {
        index += 1;
    }
    index
}

fn note_alloc_bytes(size: usize) {
    let bytes = size as u64;
    ALLOC_BYTES.fetch_add(bytes, Ordering::Relaxed);
    ALLOC_BLOCKS.fetch_add(1, Ordering::Relaxed);
    let live = LIVE_BYTES.fetch_add(bytes, Ordering::Relaxed) + bytes;
    PEAK_LIVE.fetch_max(live, Ordering::Relaxed);
    let class = bucket(size);
    BUCKET_ALLOC_BYTES[class].fetch_add(bytes, Ordering::Relaxed);
    BUCKET_ALLOC_BLOCKS[class].fetch_add(1, Ordering::Relaxed);
    BUCKET_LIVE_BYTES[class].fetch_add(bytes, Ordering::Relaxed);
}

fn note_free_bytes(size: usize) {
    let bytes = size as u64;
    FREE_BYTES.fetch_add(bytes, Ordering::Relaxed);
    FREE_BLOCKS.fetch_add(1, Ordering::Relaxed);
    LIVE_BYTES.fetch_sub(bytes, Ordering::Relaxed);
    BUCKET_LIVE_BYTES[bucket(size)].fetch_sub(bytes, Ordering::Relaxed);
}

unsafe impl GlobalAlloc for TraceAlloc {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let ptr = unsafe { System.alloc(layout) };
        if !ptr.is_null() {
            note_alloc_bytes(layout.size());
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        unsafe { System.dealloc(ptr, layout) };
        note_free_bytes(layout.size());
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        let out = unsafe { System.realloc(ptr, layout, new_size) };
        if !out.is_null() {
            REALLOCS.fetch_add(1, Ordering::Relaxed);
            note_free_bytes(layout.size());
            note_alloc_bytes(new_size);
        }
        out
    }
}

#[derive(Clone, Copy, Default)]
struct Counters {
    alloc_bytes: u64,
    alloc_blocks: u64,
    free_bytes: u64,
    free_blocks: u64,
    live: u64,
    peak: u64,
    reallocs: u64,
}

fn capture() -> Counters {
    Counters {
        alloc_bytes: ALLOC_BYTES.load(Ordering::Relaxed),
        alloc_blocks: ALLOC_BLOCKS.load(Ordering::Relaxed),
        free_bytes: FREE_BYTES.load(Ordering::Relaxed),
        free_blocks: FREE_BLOCKS.load(Ordering::Relaxed),
        live: LIVE_BYTES.load(Ordering::Relaxed),
        peak: PEAK_LIVE.load(Ordering::Relaxed),
        reallocs: REALLOCS.load(Ordering::Relaxed),
    }
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
    pub fn note_files(&mut self, files: Option<&Vec<::atomic::VirtualSource>>) {
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

fn bucket_rows() -> Vec<serde_json::Value> {
    BUCKET_LIMITS
        .iter()
        .enumerate()
        .map(|(index, limit)| {
            serde_json::json!({
                "maxSize": limit,
                "allocBytes": BUCKET_ALLOC_BYTES[index].load(Ordering::Relaxed),
                "allocBlocks": BUCKET_ALLOC_BLOCKS[index].load(Ordering::Relaxed),
                "liveBytes": BUCKET_LIVE_BYTES[index].load(Ordering::Relaxed),
            })
        })
        .collect()
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
