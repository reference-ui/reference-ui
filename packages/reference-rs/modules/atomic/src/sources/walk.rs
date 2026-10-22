//! Disk walk for source discovery: sorted directory entries with the readdir type riding free, the
//! fixed ignore set, and the extension gate, in one traversal shared by the collecting scan and the
//! union backfill. Takes a root, an include matcher and the canonical identities already claimed, and
//! emits the in-scope `(path, content)` pairs in walk order. A symlinked directory is entered only when it
//! admits a file of its target that no earlier admitted link admitted (or when it is the first to reach a
//! target that links to a directory), never back into an ancestor, and never under an engine-ignored directory,
//! so a loop ends at the link that closes it. A file reached through two paths is emitted once, under the
//! first in-scope path in walk order. The //! predicates here are shared with the native scan gate so they cannot drift apart.

use std::fs;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use rustc_hash::{FxHashMap, FxHashSet};

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

/// Recursively collect supported sources under `dir`, skipping fixed ignores. Nothing is claimed up
/// front, so the first in-scope path to each file wins, a real path ahead of a link alias.
pub(super) fn scan_dir(dir: &Path, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
    walk_tree(dir, matcher, FxHashSet::default(), acc);
}

/// The one traversal behind the collecting scan and the union backfill. `claimed` holds the canonical
/// identities the caller already provides, so the walk never reads a file the list carries under
/// another path. Link aliases wait until the real tree is done, so a file listed under its real path is
/// never listed again through a link.
pub(super) fn walk_tree(
    root: &Path,
    matcher: &FileMatcher,
    claimed: FxHashSet<PathBuf>,
    acc: &mut Vec<(String, String)>,
) {
    let mut walk = WalkCtx {
        matcher,
        claimed,
        entered: FxHashSet::default(),
        covered: FxHashMap::default(),
        physical: FxHashMap::default(),
        deferred: Vec::new(),
        acc,
    };
    walk_dir(root, &canonical_or_self(root), false, &mut walk);
    drain_deferred(&mut walk);
}

/// The canonical form of `path`, or `path` itself when it cannot be resolved, so a missing root walks
/// nothing.
pub(super) fn canonical_or_self(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

/// What one link target holds, scanned without following links: its supported files relative to the target, and
/// whether it holds a link to a kept directory.
#[derive(Default)]
struct Physical {
    files: Vec<PathBuf>,
    dir_links: bool,
}

/// The state of one traversal: the scope, the identities claimed so far, the link targets entered, the files each
/// target's admitted aliases cover, the scanned targets, the link-alias files waiting for the real tree, and the output.
struct WalkCtx<'w, 'a> {
    matcher: &'w FileMatcher<'a>,
    claimed: FxHashSet<PathBuf>,
    entered: FxHashSet<PathBuf>,
    covered: FxHashMap<PathBuf, FxHashSet<PathBuf>>,
    physical: FxHashMap<PathBuf, Rc<Physical>>,
    deferred: Vec<(PathBuf, PathBuf)>,
    acc: &'w mut Vec<(String, String)>,
}

impl WalkCtx<'_, '_> {
    /// The scanned contents of `target`, scanned once per walk.
    fn physical_of(&mut self, target: &Path) -> Rc<Physical> {
        if let Some(found) = self.physical.get(target) {
            return Rc::clone(found);
        }
        let mut scanned = Physical::default();
        scan_physical(target, Path::new(""), &mut scanned);
        let scanned = Rc::new(scanned);
        self.physical.insert(target.to_path_buf(), Rc::clone(&scanned));
        scanned
    }
}

/// Scans `dir` for what a link to it can admit: supported files, relative to the scan root, and links to kept
/// directories. Links are not followed, so a target's own tree is what its alias admits.
fn scan_physical(dir: &Path, rel: &Path, out: &mut Physical) {
    for entry in sorted_entries(dir) {
        scan_physical_entry(&entry, rel, out);
    }
}

/// One entry of a target's tree: a real directory is scanned, a link is noted, and a supported file is kept.
fn scan_physical_entry(entry: &WalkEntry, rel: &Path, out: &mut Physical) {
    let path = &entry.path;
    let Some(name) = path.file_name() else {
        return;
    };
    let child_rel = rel.join(name);
    if is_symlink(entry) {
        scan_physical_link(path, child_rel, out);
    } else if entry_is_dir(entry.file_type.as_ref(), path) {
        if is_kept_dir(path) {
            scan_physical(path, &child_rel, out);
        }
    } else if path.is_file() && is_supported_extension(path) {
        out.files.push(child_rel);
    }
}

/// A link is noted when it leads to a directory the walk would enter, and kept when it is a supported file.
fn scan_physical_link(path: &Path, child_rel: PathBuf, out: &mut Physical) {
    if path.is_dir() {
        out.dir_links |= is_kept_dir(path);
    } else if path.is_file() && is_supported_extension(path) {
        out.files.push(child_rel);
    }
}

/// Walks one directory whose canonical path is `canon`, in name order. `via_link` says whether the
/// alias this directory is reached by runs through a symlink. Subdirectories are entered under their own
/// names; files are read when in scope and unclaimed.
fn walk_dir(dir: &Path, canon: &Path, via_link: bool, walk: &mut WalkCtx) {
    for entry in sorted_entries(dir) {
        if !entry_is_dir(entry.file_type.as_ref(), &entry.path) {
            take_file(&entry.path, canon, via_link, walk);
        } else if is_kept_dir(&entry.path) {
            enter_dir(&entry, canon, via_link, walk);
        }
    }
}

/// Descends into one kept directory when `child_canon` allows it. Anything reached through a symlink
/// carries `via_link` into its whole subtree.
fn enter_dir(entry: &WalkEntry, canon: &Path, via_link: bool, walk: &mut WalkCtx) {
    let link = is_symlink(entry);
    if let Some(child) = child_canon(entry, canon, link, walk) {
        walk_dir(&entry.path, &child, via_link || link, walk);
    }
}

/// The canonical directory a walk enters for one kept directory entry, or None when the walk must not
/// enter it. A real directory sits canonically under its parent, so its path is the parent's joined with
/// its name and costs no syscall. A symlink is resolved once: a target that is an ancestor of the
/// directory holding the link is a loop and is cut, and a link the admission rule rejects is skipped.
fn child_canon(entry: &WalkEntry, canon: &Path, link: bool, walk: &mut WalkCtx) -> Option<PathBuf> {
    if !link {
        return entry.path.file_name().map(|name| canon.join(name));
    }
    let target = fs::canonicalize(&entry.path).ok()?;
    if canon.starts_with(&target) || !admit_link(&entry.path, &target, walk) {
        return None;
    }
    Some(target)
}

/// Admits one link alias to its target. The alias is entered when it admits a supported file of the target that no
/// earlier admitted alias admitted, or when it is the first to reach a target that holds links to directories. An
/// alias the include rejects, or one whose files earlier aliases already cover, is skipped, so an out-of-scope link
/// never takes ownership of a target an in-scope link also reaches. Every admission covers a new file or is a
/// target's first visit, so the walk ends.
fn admit_link(alias: &Path, target: &Path, walk: &mut WalkCtx) -> bool {
    let physical = walk.physical_of(target);
    let matcher = walk.matcher;
    let covered = walk.covered.get(target);
    let fresh: Vec<PathBuf> = physical
        .files
        .iter()
        .filter(|rel| !covered.is_some_and(|set| set.contains(*rel)))
        .filter(|rel| matcher.matches_file(&alias.join(rel).to_string_lossy()))
        .cloned()
        .collect();
    let first_visit = walk.entered.insert(target.to_path_buf());
    if fresh.is_empty() && !(physical.dir_links && first_visit) {
        return false;
    }
    walk.covered.entry(target.to_path_buf()).or_default().extend(fresh);
    true
}

/// True when the entry is itself a symbolic link. A type the readdir did not report costs one lstat.
fn is_symlink(entry: &WalkEntry) -> bool {
    match &entry.file_type {
        Some(known) => known.is_symlink(),
        None => fs::symlink_metadata(&entry.path).is_ok_and(|meta| meta.file_type().is_symlink()),
    }
}

/// Handles one supported source inside the include scope. The scope is a pure path predicate, so an
/// out-of-scope alias costs a match and claims nothing. A real path claims and reads at once; a link
/// alias is only queued, and reads at the end if no real path listed the same file.
fn take_file(path: &Path, canon: &Path, via_link: bool, walk: &mut WalkCtx) {
    if !is_supported_extension(path) {
        return;
    }
    let path_str = path.to_string_lossy();
    if !walk.matcher.matches_file(&path_str) {
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

/// Lists the queued link aliases in walk order: the first one for each identity that no real path
/// claimed is read, and the rest of that identity are skipped by the same claim.
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
