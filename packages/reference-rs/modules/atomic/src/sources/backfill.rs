//! Union backfill: completes a provided `files` list or a drained retention with the in-scope disk
//! paths it misses. Takes the scope matcher and the provided sources, claims the canonical identity of
//! each provided file before the walk, and appends only the disk files no claim covers, so a file the
//! list carries under one path is never read again under another. Provided bytes always win on
//! collision. The `BACKFILL_WALKS` counter records each completed walk for the test-only completeness
//! telemetry.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use rustc_hash::{FxHashMap, FxHashSet};

use crate::includes::FileMatcher;

use super::walk::{canonical_or_self, walk_tree};

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

/// Count one union walk, then run it from `root`, appending to `acc` the disk sources it does not
/// already carry. The counter moves before the walk so a walk that reads nothing still shows up in the
/// telemetry.
pub(super) fn walk_root(root: &Path, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
    BACKFILL_WALKS.fetch_add(1, Ordering::SeqCst);
    let claimed = claims_of(acc);
    walk_tree(root, matcher, claimed, acc);
}

/// The canonical identity of each provided source: its parent directory's canonical path joined with
/// the file name. Each parent resolves once, so a long list costs one resolve per directory, not per
/// file.
fn claims_of(provided: &[(String, String)]) -> FxHashSet<PathBuf> {
    let mut parents: FxHashMap<&Path, PathBuf> = FxHashMap::default();
    let mut claims = FxHashSet::default();
    for (path, _) in provided {
        let path = Path::new(path);
        let (Some(parent), Some(name)) = (path.parent(), path.file_name()) else {
            continue;
        };
        let canon = parents
            .entry(parent)
            .or_insert_with(|| canonical_or_self(parent));
        claims.insert(canon.join(name));
    }
    claims
}
