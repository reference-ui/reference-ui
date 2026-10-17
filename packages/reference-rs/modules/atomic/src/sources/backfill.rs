//! Union backfill: completes a provided `files` list or a drained retention with the in-scope disk
//! paths it misses. Takes the scope matcher, the set of already-listed paths and the output
//! accumulator, and walks the root with the same traversal and gates as the collecting scan. Provided
//! bytes always win on collision, so only missing paths are read from disk. The `BACKFILL_WALKS`
//! counter records each completed walk for the test-only completeness telemetry.

use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};

use rustc_hash::FxHashSet;

use crate::includes::FileMatcher;

use super::walk::{entry_is_dir, is_kept_dir, is_supported_extension, sorted_entries, WalkEntry};

/// Union backfill walks completed this process (token path plus the legacy
/// `files` union). Skipped walks never increment: a complete retention
/// compiles with a zero delta.
static BACKFILL_WALKS: AtomicU64 = AtomicU64::new(0);

/// Backfill walks completed this process. Test-only telemetry: tests read
/// deltas around one compile, and the walk direction only grows, so a
/// `>= 1` assertion never flakes under parallel harnesses.
#[cfg(test)]
pub(super) fn backfill_walks() -> u64 {
    BACKFILL_WALKS.load(Ordering::SeqCst)
}

/// Count one union walk, then run it from `root`. The counter moves before the walk so a walk that
/// reads nothing still shows up in the telemetry.
pub(super) fn walk_root(root: &Path, backfill: &mut Backfill) {
    BACKFILL_WALKS.fetch_add(1, Ordering::SeqCst);
    backfill_dir(root, backfill);
}

/// Union-fill state: the scope matcher, the listed-path set, and the output.
pub(super) struct Backfill<'a> {
    pub(super) matcher: &'a FileMatcher<'a>,
    pub(super) known: &'a mut FxHashSet<String>,
    pub(super) acc: &'a mut Vec<(String, String)>,
}

/// Backfill walk over `dir`: same traversal, IGNORE set, extension gate,
/// and scope predicate as the collecting scan, so every path the scan
/// would read is visited, and only unlisted ones read from disk.
fn backfill_dir(dir: &Path, backfill: &mut Backfill) {
    for entry in sorted_entries(dir) {
        handle_backfill_entry(&entry, backfill);
    }
}

/// Descend into kept directories; read supported in-scope files the
/// provided list misses, skipping listed paths before any string is built.
fn handle_backfill_entry(entry: &WalkEntry, backfill: &mut Backfill) {
    let path = &entry.path;
    if entry_is_dir(entry.file_type.as_ref(), path) {
        if is_kept_dir(path) {
            backfill_dir(path, backfill);
        }
        return;
    }
    if !is_supported_extension(path) {
        return;
    }
    let path_str = path.to_string_lossy();
    if !backfill.matcher.matches_file(&path_str) {
        return;
    }
    let known_key: &str = &path_str;
    if backfill.known.contains(known_key) {
        return;
    }
    if let Ok(content) = std::fs::read_to_string(path) {
        backfill.known.insert(path_str.to_string());
        backfill.acc.push((path_str.to_string(), content));
    }
}
