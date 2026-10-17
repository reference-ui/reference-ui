//! Disk walk for source discovery: sorted directory entries with the readdir type riding free,
//! the fixed ignore set, and the extension gate. Takes a directory and an include matcher and
//! emits the in-scope `(path, content)` pairs in walk order. Symlinks and unknown types fall back
//! to a stat so every verdict matches the plain walk, and the predicates here are shared with the
//! union backfill and the native scan gate so they cannot drift apart.

use std::path::{Path, PathBuf};

use crate::includes::FileMatcher;

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

/// One walk entry: the readdir type plus the path it was read for.
pub(super) struct WalkEntry {
    pub(super) file_type: Option<std::fs::FileType>,
    pub(super) path: std::path::PathBuf,
}

/// `(d_type, path)` pairs of one directory, sorted by path for determinism.
/// The type rides free with the readdir on typed filesystems; `None` keeps
/// the stat fallback for entries the OS refused to type. Entries share one
/// parent, so file-name order equals full-path order while comparing bytes
/// instead of walking components; names are unique, so the unstable sort
/// emits the same sequence the stable full-path sort did, minus its scratch.
pub(super) fn sorted_entries(dir: &Path) -> Vec<WalkEntry> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let dir_bytes = dir.as_os_str().len();
    let mut listed: Vec<WalkEntry> = entries
        .flatten()
        .map(|entry| {
            // entry.path() joins dir and name through a growing buffer
            // (one realloc per entry); pushing both parts into an
            // exactly-sized buffer joins the identical bytes with none.
            let name = entry.file_name();
            let mut path = PathBuf::with_capacity(dir_bytes + 1 + name.len());
            path.push(dir);
            path.push(&name);
            WalkEntry {
                file_type: entry.file_type().ok(),
                path,
            }
        })
        .collect();
    listed.sort_unstable_by(|a, b| a.path.file_name().cmp(&b.path.file_name()));
    listed
}

/// True when the entry is a directory: the free d_type decides for plain
/// files and dirs; symlinks, unknown types, and refused stats fall through
/// to `is_dir()`, so every verdict matches the old stat-everything walk.
pub(super) fn entry_is_dir(file_type: Option<&std::fs::FileType>, path: &Path) -> bool {
    match file_type {
        Some(known) if known.is_dir() => true,
        Some(known) if known.is_file() => false,
        _ => path.is_dir(),
    }
}

/// Recursively collect supported sources under `dir`, skipping fixed ignores.
/// The include scope is a pure path predicate, so it runs before the read:
/// out-of-scope files cost a match, never I/O.
pub(super) fn scan_dir(dir: &Path, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
    for entry in sorted_entries(dir) {
        handle_dir_entry(&entry, matcher, acc);
    }
}

/// Descend into kept directories, read supported in-scope source files.
fn handle_dir_entry(entry: &WalkEntry, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
    let path = &entry.path;
    if entry_is_dir(entry.file_type.as_ref(), path) {
        if is_kept_dir(path) {
            scan_dir(path, matcher, acc);
        }
    } else if is_supported_extension(path) {
        let path_str = path.to_string_lossy();
        if matcher.matches_file(&path_str) {
            if let Ok(content) = std::fs::read_to_string(path) {
                acc.push((path_str.to_string(), content));
            }
        }
    }
}

/// True when a directory (already stat-checked by the caller) sits outside
/// the IGNORE set. The name check alone decides; no second stat.
pub(super) fn is_kept_dir(path: &Path) -> bool {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
    !is_ignored_dir_name(name)
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
