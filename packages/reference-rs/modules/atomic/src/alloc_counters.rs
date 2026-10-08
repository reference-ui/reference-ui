//! Counting global allocator backing the `alloc-trace` instrument build.
//! It wraps the system allocator with atomic counters (bytes, blocks, live,
//! peak, size-class split) that the compile span and the phase guards
//! snapshot at their boundaries. Node's own malloc traffic bypasses it, so
//! the counters isolate the `.node` exactly. This module only exists with
//! the feature enabled, so the shipped `.node` never pays for the counters.

use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicU64, Ordering};

/// Inclusive upper bounds of the eight allocation size classes.
const BUCKET_LIMITS: [usize; 8] = [32, 128, 512, 2048, 8192, 32768, 131072, usize::MAX];

static ALLOC_BYTES: AtomicU64 = AtomicU64::new(0);
static ALLOC_BLOCKS: AtomicU64 = AtomicU64::new(0);
static FREE_BYTES: AtomicU64 = AtomicU64::new(0);
static FREE_BLOCKS: AtomicU64 = AtomicU64::new(0);
static LIVE_BYTES: AtomicU64 = AtomicU64::new(0);
static PEAK_LIVE: AtomicU64 = AtomicU64::new(0);
static REALLOCS: AtomicU64 = AtomicU64::new(0);
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
pub(crate) struct Counters {
    pub(crate) alloc_bytes: u64,
    pub(crate) alloc_blocks: u64,
    pub(crate) free_bytes: u64,
    pub(crate) free_blocks: u64,
    pub(crate) live: u64,
    pub(crate) peak: u64,
    pub(crate) reallocs: u64,
}

pub(crate) fn capture() -> Counters {
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

/// Size-class rows: process-cumulative alloc plus live at the caller's span
/// exit. Buckets stay span-global; phases slice bytes and blocks, never the
/// peak or the class split.
pub(crate) fn bucket_rows() -> Vec<serde_json::Value> {
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
