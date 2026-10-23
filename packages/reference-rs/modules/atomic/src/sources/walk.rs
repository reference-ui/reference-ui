//! Atomic's policy for the disk walk: which directories it skips and which sources it reads.
//! The traversal itself lives in `shared::walk`, which enters only the directories the include scope can reach and
//! walks each link alias once per directory and include state; this module hands it those rules as a `WalkSink`.
//! `scan_dir` and `WalkScope::new` keep their paths and signatures, and `canonical_or_self` is re-exported for the
//! union backfill and the link tests. A listed path is read only when it stats as a regular file, so a FIFO or
//! device named like a source is skipped unopened.

use std::fs;
use std::path::{Path, PathBuf};

use rustc_hash::FxHashSet;
use shared::walk::{self as traversal, WalkSink};

pub(super) use shared::walk::{canonical_or_self, WalkScope};

/// Directories the disk walk never descends into (build + metadata).
const IGNORE_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    ".turbo",
    "target",
    ".reference-ui",
    ".reference",
    ".pipeline",
];

/// Recursively collect supported sources under `dir`, skipping fixed ignores. Nothing is claimed up front, so the
/// first in-scope path to each file wins, a real path ahead of a link alias.
pub(super) fn scan_dir(dir: &Path, scope: &WalkScope, acc: &mut Vec<(String, String)>) {
    walk_tree(dir, scope, FxHashSet::default(), acc);
}

/// The one traversal behind the collecting scan and the union backfill, run with atomic's sink. `claimed` holds the
/// canonical identities the caller already provides, so the walk never reads a file the list carries under another
/// path.
pub(super) fn walk_tree(
    root: &Path,
    scope: &WalkScope,
    claimed: FxHashSet<PathBuf>,
    acc: &mut Vec<(String, String)>,
) {
    traversal::walk_tree(root, scope, claimed, &mut Collect { acc });
}

/// Atomic's walk sink: the extension gate and the ignore set decide, and each listed file is read into `acc`.
struct Collect<'a> {
    acc: &'a mut Vec<(String, String)>,
}

impl WalkSink for Collect<'_> {
    fn keeps_file(&self, path: &Path) -> bool {
        is_supported_extension(path)
    }

    fn skips_dir(&self, name: &str) -> bool {
        is_ignored_dir_name(name)
    }

    fn file(&mut self, path: &Path) {
        read_into(path, self.acc);
    }
}

/// Reads one listed source and appends it; an unreadable file is dropped, as the walk always did. The path is stat'd
/// first and read only when it is a regular file, so a FIFO, socket or device named like a source is never opened.
fn read_into(path: &Path, acc: &mut Vec<(String, String)>) {
    if !fs::metadata(path).is_ok_and(|meta| meta.is_file()) {
        return;
    }
    if let Ok(content) = fs::read_to_string(path) {
        acc.push((path.to_string_lossy().into_owned(), content));
    }
}

/// True when a directory name is engine-ignored; shared verbatim with the
/// native scan gate so the set cannot drift between the two paths.
pub(crate) fn is_ignored_dir_name(name: &str) -> bool {
    IGNORE_DIRS.contains(&name)
}

/// True for the extensions the extractor parses.
pub(crate) fn is_supported_extension(path: &Path) -> bool {
    let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
        return false;
    };
    matches!(ext, "tsx" | "ts" | "jsx" | "js")
}
