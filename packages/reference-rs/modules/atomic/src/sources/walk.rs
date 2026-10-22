//! Disk walk for source discovery, shared by the collecting scan and the union backfill.
//! It takes a root, the include scope and the canonical identities already claimed, and emits the in-scope
//! `(path, content)` pairs in walk order. A directory is entered only when an include pattern can still reach
//! it by its path from the root, and a symlinked directory is entered under every alias that passes that test,
//! unless its target is already on the path being walked, which ends a loop at the link that closes it. A file
//! reached through several paths is emitted once, under its first in-scope path in walk order, real paths before
//! link aliases. The ignore set and the extension gate are shared with the native scan gate, so the two cannot
//! drift apart.

use std::fs;
use std::path::{Path, PathBuf};

use rustc_hash::FxHashSet;

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

/// What one traversal keeps and enters: the matcher that keeps a file, and the liveness test that keeps a
/// directory an include pattern can still reach.
pub(super) struct WalkScope<'m, 'a> {
    matcher: &'m FileMatcher<'a>,
    liveness: Liveness,
}

impl<'m, 'a> WalkScope<'m, 'a> {
    /// Binds the include patterns' literal directory prefixes to the matcher that keeps the files.
    pub(super) fn new(patterns: &[String], matcher: &'m FileMatcher<'a>) -> Self {
        Self {
            matcher,
            liveness: Liveness::new(patterns),
        }
    }
}

/// The literal directory prefixes of the positive include patterns. A directory can hold a match only when its
/// path agrees with one prefix on the segments both share; `None` means some pattern has no usable literal
/// prefix, so every directory is live.
struct Liveness {
    prefixes: Option<Vec<Vec<String>>>,
}

impl Liveness {
    fn new(patterns: &[String]) -> Self {
        let positive: Vec<&str> = patterns
            .iter()
            .map(String::as_str)
            .filter(|pattern| !pattern.starts_with('!'))
            .map(|pattern| pattern.strip_prefix("./").unwrap_or(pattern))
            .collect();
        let prefixes: Option<Vec<Vec<String>>> =
            positive.iter().map(|pattern| literal_prefix(pattern)).collect();
        match prefixes {
            Some(list) if !list.is_empty() => Self {
                prefixes: Some(list),
            },
            _ => Self { prefixes: None },
        }
    }

    fn live(&self, rel: &Path) -> bool {
        match &self.prefixes {
            Some(prefixes) => prefixes.iter().any(|prefix| agrees(prefix, rel)),
            None => true,
        }
    }
}

/// The literal directory segments a pattern starts from. `None` when a segment is empty, `.` or `..`, when the
/// pattern is absolute, or when no literal directory comes before the first glob. The last segment names files
/// and is never part of the prefix.
fn literal_prefix(pattern: &str) -> Option<Vec<String>> {
    let segments: Vec<&str> = pattern.split('/').collect();
    if pattern.starts_with('/') || segments.iter().any(|s| matches!(*s, "" | "." | "..")) {
        return None;
    }
    let literal: Vec<String> = segments[..segments.len() - 1]
        .iter()
        .copied()
        .take_while(|segment| !has_glob_syntax(segment))
        .map(str::to_string)
        .collect();
    (!literal.is_empty()).then_some(literal)
}

fn has_glob_syntax(segment: &str) -> bool {
    segment.contains(|c: char| matches!(c, '*' | '?' | '[' | ']' | '{' | '}' | '(' | ')' | '!'))
}

/// True when the path agrees with the prefix on every segment both have, so a directory above a prefix is kept.
fn agrees(prefix: &[String], rel: &Path) -> bool {
    prefix
        .iter()
        .zip(rel.components())
        .all(|(literal, part)| part.as_os_str() == literal.as_str())
}

/// Where a walk stands: the canonical path of the directory, its path from the walk root, and whether a link
/// carried the walk there.
struct Place<'a> {
    canon: &'a Path,
    rel: &'a Path,
    via_link: bool,
}

/// The state of one traversal: the scope, the identities claimed so far, the canonical directories on the path
/// being walked, the link-alias files waiting for the real tree, and the output.
struct WalkCtx<'w, 'm, 'a> {
    scope: &'w WalkScope<'m, 'a>,
    claimed: FxHashSet<PathBuf>,
    path: Vec<PathBuf>,
    deferred: Vec<(PathBuf, PathBuf)>,
    acc: &'w mut Vec<(String, String)>,
}

/// Recursively collect supported sources under `dir`, skipping fixed ignores. Nothing is claimed up front, so the
/// first in-scope path to each file wins, a real path ahead of a link alias.
pub(super) fn scan_dir(dir: &Path, scope: &WalkScope, acc: &mut Vec<(String, String)>) {
    walk_tree(dir, scope, FxHashSet::default(), acc);
}

/// The one traversal behind the collecting scan and the union backfill. `claimed` holds the canonical identities
/// the caller already provides, so the walk never reads a file the list carries under another path. Link aliases
/// wait until the real tree is done, so a file listed under its real path is never listed again through a link.
pub(super) fn walk_tree(
    root: &Path,
    scope: &WalkScope,
    claimed: FxHashSet<PathBuf>,
    acc: &mut Vec<(String, String)>,
) {
    let root_canon = canonical_or_self(root);
    let mut walk = WalkCtx {
        scope,
        claimed,
        path: vec![root_canon.clone()],
        deferred: Vec::new(),
        acc,
    };
    let place = Place {
        canon: &root_canon,
        rel: Path::new(""),
        via_link: false,
    };
    walk_dir(root, &place, &mut walk);
    drain_deferred(&mut walk);
}

/// The canonical form of `path`, or `path` itself when it cannot be resolved, so a missing root walks nothing.
pub(super) fn canonical_or_self(path: &Path) -> PathBuf {
    dunce::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

/// Walks one directory in name order: subdirectories are entered when the scope can reach them, and files are
/// read when in scope and unclaimed.
fn walk_dir(dir: &Path, place: &Place, walk: &mut WalkCtx) {
    for entry in sorted_entries(dir) {
        if !entry_is_dir(entry.file_type.as_ref(), &entry.path) {
            take_file(&entry.path, place.canon, place.via_link, walk);
        } else if is_kept_dir(&entry.path) {
            enter_dir(&entry, place, walk);
        }
    }
}

/// Enters one kept directory unless the include cannot reach it, or a link's target is already on the path being
/// walked: that link closes a loop. The canonical path is pushed for the whole subtree and popped after it.
fn enter_dir(entry: &WalkEntry, place: &Place, walk: &mut WalkCtx) {
    let path = &entry.path;
    let Some(name) = path.file_name() else {
        return;
    };
    let rel = place.rel.join(name);
    if !walk.scope.liveness.live(&rel) {
        return;
    }
    let link = is_symlink(entry);
    let canon = if link {
        let Ok(target) = dunce::canonicalize(path) else {
            return;
        };
        if walk.path.contains(&target) {
            return;
        }
        target
    } else {
        place.canon.join(name)
    };
    walk.path.push(canon.clone());
    let child = Place {
        canon: &canon,
        rel: &rel,
        via_link: place.via_link || link,
    };
    walk_dir(path, &child, walk);
    walk.path.pop();
}

/// True when the entry is itself a symbolic link. A type the readdir did not report costs one lstat.
fn is_symlink(entry: &WalkEntry) -> bool {
    match &entry.file_type {
        Some(known) => known.is_symlink(),
        None => fs::symlink_metadata(&entry.path).is_ok_and(|meta| meta.file_type().is_symlink()),
    }
}

/// Handles one supported source inside the include scope. The scope is a pure path predicate, so an out-of-scope
/// file costs a match and claims nothing. A real path claims and reads at once; a link alias is only queued, and
/// reads at the end if no real path listed the same file.
fn take_file(path: &Path, canon: &Path, via_link: bool, walk: &mut WalkCtx) {
    if !is_supported_extension(path) {
        return;
    }
    let path_str = path.to_string_lossy();
    if !walk.scope.matcher.matches_file(&path_str) {
        return;
    }
    let Some(name) = path.file_name() else {
        return;
    };
    let identity = canon.join(name);
    if via_link {
        walk.deferred.push((identity, path.to_path_buf()));
    } else if walk.claimed.insert(identity) {
        read_into(path, walk.acc);
    }
}

/// Lists the queued link aliases in walk order: the first one for each identity that no real path claimed is read,
/// and the rest of that identity are skipped by the same claim.
fn drain_deferred(walk: &mut WalkCtx) {
    for (identity, path) in std::mem::take(&mut walk.deferred) {
        if walk.claimed.insert(identity) {
            read_into(&path, walk.acc);
        }
    }
}

/// Reads one listed source and appends it; an unreadable file is dropped, as the walk always did.
fn read_into(path: &Path, acc: &mut Vec<(String, String)>) {
    if let Ok(content) = fs::read_to_string(path) {
        acc.push((path.to_string_lossy().into_owned(), content));
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
