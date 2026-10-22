//! Walks the include globs under the scan root and keeps the TypeScript sources the walk reaches.
//! It emits them as sorted root-relative file ids, one per real file: a file reached through several paths is listed under
//! its real path when one is in scope, else under its first alias in walk order, the rule the atomic walk applies too.
//! The walk follows symlinks, so a link whose target is gone is skipped instead of failing the whole scan, and a link that
//! closes a loop is cut the same way the atomic walk cuts it, so a file reachable only through that link is not listed
//! (the known limit the atomic README records). Any other walk error still fails the scan.

use std::collections::{BTreeSet, HashMap};
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};

use globwalk::{GlobWalkerBuilder, WalkError};

use crate::diagnostics::scan_failed;
use crate::scanner::paths::{is_external_file_id, path_to_unix};

/// One kept file: its root-relative id, and whether the walk reached it by a real path (no link between the root and its parent).
struct Candidate {
    file_id: String,
    real: bool,
}

/// The sorted root-relative ids of the in-scope sources, one per real file. Entries are visited in name order per directory,
/// so the first alias in walk order is the same one the atomic walk lists.
pub(super) fn discover_file_ids(root_dir: &Path, include: &[String]) -> Result<Vec<String>, String> {
    let walker = build_glob_walker(root_dir, include)?;
    let root = canonical_or_self(root_dir);
    let mut parents: HashMap<PathBuf, PathBuf> = HashMap::new();
    let mut chosen: HashMap<PathBuf, Candidate> = HashMap::new();
    for entry in walker {
        let Some(entry) = walked_entry(entry)? else {
            continue;
        };
        if !is_supported_source_entry(&entry) {
            continue;
        }
        let file_id = normalized_file_id(root_dir, entry.path())?;
        if is_external_file_id(&file_id) {
            continue;
        }
        let (identity, real) = identity_of(&root, root_dir, entry.path(), &mut parents);
        offer(&mut chosen, identity, Candidate { file_id, real });
    }
    let file_ids: BTreeSet<String> = chosen.into_values().map(|candidate| candidate.file_id).collect();
    Ok(file_ids.into_iter().collect())
}

/// The walk step's entry, or `None` for an entry the walk cuts: a dangling symlink, or a link that closes a loop.
/// Every other error fails the scan.
fn walked_entry(
    entry: Result<globwalk::DirEntry, WalkError>,
) -> Result<Option<globwalk::DirEntry>, String> {
    match entry {
        Ok(entry) => Ok(Some(entry)),
        Err(err) if is_dangling_link(&err) || is_loop_link(&err) => Ok(None),
        Err(err) => Err(scan_failed(format!("failed to walk scan root: {err}"))),
    }
}

/// True when the walk stopped at a symlink that points back to one of its ancestors. The cut link closes a loop: the files
/// under the ancestor are listed through the walk path, and a file reachable only through this link is not listed.
fn is_loop_link(err: &WalkError) -> bool {
    err.loop_ancestor().is_some()
}

/// True when the walk failed on a symlink whose target does not exist: the error names the link, carries
/// NotFound, and the link itself is still on disk. A loop or any other io failure is not dangling.
fn is_dangling_link(err: &WalkError) -> bool {
    let (Some(path), Some(io)) = (err.path(), err.io_error()) else {
        return false;
    };
    io.kind() == std::io::ErrorKind::NotFound
        && std::fs::symlink_metadata(path).is_ok_and(|meta| meta.file_type().is_symlink())
}

/// The identity of one kept file: its canonical parent directory joined with its name, which a real path and a link alias
/// resolve to alike. The flag says whether the parent is reached by a real path, meaning no link sits between the root and it.
fn identity_of(
    root: &Path,
    root_dir: &Path,
    path: &Path,
    parents: &mut HashMap<PathBuf, PathBuf>,
) -> (PathBuf, bool) {
    let parent = path.parent().unwrap_or(root_dir);
    let canon_parent = parents
        .entry(parent.to_path_buf())
        .or_insert_with(|| canonical_or_self(parent))
        .clone();
    let real = parent
        .strip_prefix(root_dir)
        .is_ok_and(|relative| canon_parent == root.join(relative));
    let name = path.file_name().unwrap_or(OsStr::new(""));
    (canon_parent.join(name), real)
}

/// Keeps one candidate per identity: a real path replaces an alias, and otherwise the first alias in walk order stays.
fn offer(chosen: &mut HashMap<PathBuf, Candidate>, identity: PathBuf, candidate: Candidate) {
    let keep_current = chosen
        .get(&identity)
        .is_some_and(|current| current.real || !candidate.real);
    if !keep_current {
        chosen.insert(identity, candidate);
    }
}

fn canonical_or_self(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

fn build_glob_walker(root_dir: &Path, include: &[String]) -> Result<globwalk::GlobWalker, String> {
    GlobWalkerBuilder::from_patterns(root_dir, include)
        .follow_links(true)
        .sort_by(|left, right| left.file_name().cmp(right.file_name()))
        .build()
        .map_err(|err| scan_failed(format!("failed to build glob walker: {err}")))
}

fn is_supported_source_entry(entry: &globwalk::DirEntry) -> bool {
    entry.file_type().is_file() && has_supported_source_extension(entry.path())
}

fn has_supported_source_extension(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|ext| ext.to_str()),
        Some("ts" | "tsx" | "mts" | "cts")
    )
}

fn normalized_file_id(root_dir: &Path, path: &Path) -> Result<String, String> {
    let relative = path.strip_prefix(root_dir).map_err(|err| {
        scan_failed(format!(
            "failed to normalize path {}: {err}",
            path.display()
        ))
    })?;
    Ok(path_to_unix(relative))
}
