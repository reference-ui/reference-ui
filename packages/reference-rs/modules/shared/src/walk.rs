//! Disk traversal shared by the compiler crates, driven by a caller's `WalkSink`.
//! It takes a root, an include scope and the canonical identities already claimed, and lists the in-scope files in
//! walk order. The sink decides which files are sources, which directory names are skipped, and what happens to each
//! listed file.
//! A directory is entered only when an include pattern can still reach it by its path from the root, and every
//! directory entered records its canonical path and the include state of the path that reached it.
//! A symlinked directory is walked only when that pair is new, which bounds the walk by the directories times the
//! states they reach, while a real directory is always walked.
//! A file reached through several paths is listed once, under its first in-scope path in walk order, real paths before
//! link aliases.

use std::fs;
use std::path::{Path, PathBuf};

use rustc_hash::FxHashSet;

use crate::includes::{FileMatcher, GlobState};

/// What a traversal does with what it reads: which files are sources, which directory names are never entered, and
/// what happens to each file the walk lists.
pub trait WalkSink {
    /// True when the file is a candidate source. It is checked before the include scope, so a rejected file
    /// costs no match.
    fn keeps_file(&self, path: &Path) -> bool;
    /// True when a directory with this name is never entered.
    fn skips_dir(&self, name: &str) -> bool;
    /// Receives one listed file, in walk order.
    fn file(&mut self, path: &Path);
}

/// One walk entry: the readdir type plus the path it was read for.
struct WalkEntry {
    file_type: Option<std::fs::FileType>,
    path: std::path::PathBuf,
}

/// `(d_type, path)` pairs of one directory, sorted by path for determinism.
/// The type rides free with the readdir on typed filesystems; `None` keeps
/// the stat fallback for entries the OS refused to type. Entries share one
/// parent, so file-name order equals full-path order while comparing bytes
/// instead of walking components; names are unique, so the unstable sort
/// emits the same sequence the stable full-path sort did, minus its scratch.
fn sorted_entries(dir: &Path) -> Vec<WalkEntry> {
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
fn entry_is_dir(file_type: Option<&std::fs::FileType>, path: &Path) -> bool {
    match file_type {
        Some(known) if known.is_dir() => true,
        Some(known) if known.is_file() => false,
        _ => path.is_dir(),
    }
}

/// What one traversal enters: the include matcher that keeps files, and the liveness test that keeps a directory an
/// include pattern can still reach.
pub struct WalkScope<'m, 'a> {
    matcher: &'m FileMatcher<'a>,
    liveness: Liveness,
}

impl<'m, 'a> WalkScope<'m, 'a> {
    /// Binds the include patterns' literal directory prefixes to the matcher that keeps the files.
    pub fn new(patterns: &[String], matcher: &'m FileMatcher<'a>) -> Self {
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

/// Where a walk stands: the canonical path of the directory, its path from the walk root, whether a link carried the
/// walk there, and the include state of that path.
struct Place<'a> {
    canon: &'a Path,
    rel: &'a Path,
    via_link: bool,
    state: &'a GlobState,
}

/// The state of one traversal: the scope, the sink that keeps and reads files, the identities claimed so far, the
/// (canonical directory, include state) pairs already visited, and the link-alias files waiting for the real tree.
struct WalkCtx<'w, 'm, 'a> {
    scope: &'w WalkScope<'m, 'a>,
    sink: &'w mut dyn WalkSink,
    claimed: FxHashSet<PathBuf>,
    visited: FxHashSet<(PathBuf, GlobState)>,
    deferred: Vec<(PathBuf, PathBuf)>,
}

/// Lists the in-scope files under `root` in walk order, handing each one to `sink`. `claimed` holds the canonical
/// identities the caller already provides, so the walk never lists a file the list carries under another path. Link
/// aliases wait until the real tree is done, so a file listed under its real path is never listed again through a link.
/// `root` is the path the scope's matcher was bound to, so the root state strips the same prefix `matches_file` does.
pub fn walk_tree(
    root: &Path,
    scope: &WalkScope,
    claimed: FxHashSet<PathBuf>,
    sink: &mut dyn WalkSink,
) {
    let root_canon = canonical_or_self(root);
    let root_state = scope.matcher.root_state(root);
    let mut walk = WalkCtx {
        scope,
        sink,
        claimed,
        visited: FxHashSet::default(),
        deferred: Vec::new(),
    };
    walk.visited.insert((root_canon.clone(), root_state.clone()));
    let place = Place {
        canon: &root_canon,
        rel: Path::new(""),
        via_link: false,
        state: &root_state,
    };
    walk_dir(root, &place, &mut walk);
    drain_deferred(&mut walk);
}

/// The canonical form of `path`, or `path` itself when it cannot be resolved, so a missing root walks nothing.
pub fn canonical_or_self(path: &Path) -> PathBuf {
    dunce::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

/// Walks one directory in name order: subdirectories are entered when the scope can reach them and the sink does not
/// skip them, and files are read when in scope and unclaimed.
fn walk_dir(dir: &Path, place: &Place, walk: &mut WalkCtx) {
    for entry in sorted_entries(dir) {
        if !entry_is_dir(entry.file_type.as_ref(), &entry.path) {
            take_file(&entry.path, place.canon, place.via_link, walk);
        } else if !walk.sink.skips_dir(dir_name(&entry.path)) {
            enter_dir(&entry, place, walk);
        }
    }
}

/// The directory's own name as the sink sees it. A name that is not UTF-8 reads as empty, as the ignore check
/// always did.
fn dir_name(path: &Path) -> &str {
    path.file_name().and_then(|n| n.to_str()).unwrap_or("")
}

/// Enters one kept directory unless the include cannot reach it. Its state is the parent's state stepped by the entry
/// name, and its (canonical directory, state) pair is recorded. A real directory is always walked; a link is walked
/// only when its pair is new, so a link that closes a loop or repeats an earlier alias is cut where the earlier visit
/// already covers it.
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
        target
    } else {
        place.canon.join(name)
    };
    let state = walk.scope.matcher.step(place.state, name);
    let fresh = walk.visited.insert((canon.clone(), state.clone()));
    if link && !fresh {
        return;
    }
    let child = Place {
        canon: &canon,
        rel: &rel,
        via_link: place.via_link || link,
        state: &state,
    };
    walk_dir(path, &child, walk);
}

/// True when the entry is itself a symbolic link. A type the readdir did not report costs one lstat.
fn is_symlink(entry: &WalkEntry) -> bool {
    match &entry.file_type {
        Some(known) => known.is_symlink(),
        None => fs::symlink_metadata(&entry.path).is_ok_and(|meta| meta.file_type().is_symlink()),
    }
}

/// Handles one candidate file inside the include scope. The sink's extension gate runs first and the include matcher
/// second, so an out-of-scope file costs a match and claims nothing. A real path claims and lists at once; a link alias
/// is only queued, and lists at the end if no real path listed the same file.
fn take_file(path: &Path, canon: &Path, via_link: bool, walk: &mut WalkCtx) {
    if !walk.sink.keeps_file(path) {
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
        walk.sink.file(path);
    }
}

/// Lists the queued link aliases in walk order: the first one for each identity that no real path claimed is listed,
/// and the rest of that identity are skipped by the same claim.
fn drain_deferred(walk: &mut WalkCtx) {
    for (identity, path) in std::mem::take(&mut walk.deferred) {
        if walk.claimed.insert(identity) {
            walk.sink.file(&path);
        }
    }
}

#[cfg(test)]
mod tests {
    use std::path::{Path, PathBuf};

    use rustc_hash::FxHashSet;

    use super::{walk_tree, WalkScope, WalkSink};
    use crate::includes::IncludeScope;
    use crate::testing::ScratchWorkspace;

    /// A sink that keeps `.ts` files, never enters `node_modules`, and records what the walk lists.
    #[derive(Default)]
    struct Recorder {
        listed: Vec<PathBuf>,
    }

    impl WalkSink for Recorder {
        fn keeps_file(&self, path: &Path) -> bool {
            path.extension().is_some_and(|ext| ext == "ts")
        }

        fn skips_dir(&self, name: &str) -> bool {
            name == "node_modules"
        }

        fn file(&mut self, path: &Path) {
            self.listed.push(path.to_path_buf());
        }
    }

    #[test]
    fn the_sink_decides_which_files_are_listed_and_which_dirs_are_entered() {
        let workspace = ScratchWorkspace::new("walk_sink");
        workspace.write("src/a/x.ts", "export {}\n");
        workspace.write("src/b/y.mjs", "export {}\n");
        workspace.write("src/c.ts", "export {}\n");
        workspace.write("node_modules/pkg/z.ts", "export {}\n");
        let root = workspace.root();
        let scope = IncludeScope::compile(&[]);
        let matcher = scope.matcher(root.to_str());
        let walk = WalkScope::new(&[], &matcher);
        let mut sink = Recorder::default();
        walk_tree(root, &walk, FxHashSet::default(), &mut sink);
        let listed: Vec<PathBuf> = sink
            .listed
            .iter()
            .map(|path| path.strip_prefix(root).expect("listed under the root").to_path_buf())
            .collect();
        assert_eq!(listed, vec![PathBuf::from("src/a/x.ts"), PathBuf::from("src/c.ts")]);
    }
}
