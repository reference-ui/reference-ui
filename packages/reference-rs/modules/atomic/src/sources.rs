//! Source discovery for the atomic compile pipeline.
//! Takes the request's virtual `files` list or `root_dir` and emits sorted
//! `(path, content)` pairs for extraction. The disk scan skips fixed build and
//! metadata directories plus non-source extensions; the include scope then
//! filters both paths to matching files, silently dropping the rest.

use std::path::Path;

use rustc_hash::FxHashSet;

use crate::includes::{FileMatcher, IncludeScope};
use crate::{CompileRequest, VirtualSource};

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

/// Gather in-scope sources, sorted by path for deterministic extraction.
pub(crate) fn collect(request: &CompileRequest) -> Vec<(String, String)> {
    let mut sources = gather(request);
    sources.sort_unstable_by(|a, b| a.0.cmp(&b.0));
    sources
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
    let mut listed: Vec<WalkEntry> = entries
        .flatten()
        .map(|entry| WalkEntry {
            file_type: entry.file_type().ok(),
            path: entry.path(),
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

/// Provided `files` union-filled from disk when present, otherwise the
/// filtered `root_dir` scan. An empty list scans: absence and emptiness
/// both mean "the caller handed nothing over".
fn gather(request: &CompileRequest) -> Vec<(String, String)> {
    let patterns = request.include.as_deref().unwrap_or(&[]);
    let scope = IncludeScope::compile(patterns);
    let matcher = scope.matcher(request.root_dir.as_deref());
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return union_sources(files, request.root_dir.as_deref(), &matcher);
        }
    }

    let mut sources = Vec::new();
    if let Some(root_dir) = &request.root_dir {
        scan_dir(Path::new(root_dir), &matcher, &mut sources);
    }
    sources
}

/// Virtual sources inside the include scope; an open scope keeps every file.
fn filter_virtual_sources(files: &[VirtualSource], matcher: &FileMatcher) -> Vec<(String, String)> {
    files
        .iter()
        .filter(|file| matcher.matches_file(&file.path))
        .map(|file| (file.path.clone(), file.content.clone()))
        .collect()
}

/// Provided sources plus the scope-hit disk paths the list misses: provided
/// bytes win on collision and only missing paths read from disk, so set
/// equality holds by construction whatever glob engine built the list. With
/// no root the walk has nowhere to go and this is exactly the legacy
/// provided filter, so files-only callers keep byte-identical semantics.
/// The known-check runs inside the walk, so already-listed paths cost a
/// hash probe and never a transient path string; missing paths still read
/// from disk in walk order exactly as the two-phase walk did.
fn union_sources(
    files: &[VirtualSource],
    root: Option<&str>,
    matcher: &FileMatcher,
) -> Vec<(String, String)> {
    let mut provided = filter_virtual_sources(files, matcher);
    let Some(root_dir) = root else {
        return provided;
    };
    let mut known: FxHashSet<String> = provided.iter().map(|(path, _)| path.clone()).collect();
    let mut backfill = Backfill {
        matcher,
        known: &mut known,
        acc: &mut provided,
    };
    backfill_dir(Path::new(root_dir), &mut backfill);
    provided
}

/// Union-fill state: the scope matcher, the listed-path set, and the output.
struct Backfill<'a> {
    matcher: &'a FileMatcher<'a>,
    known: &'a mut FxHashSet<String>,
    acc: &'a mut Vec<(String, String)>,
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

/// Recursively collect supported sources under `dir`, skipping fixed ignores.
/// The include scope is a pure path predicate, so it runs before the read:
/// out-of-scope files cost a match, never I/O.
fn scan_dir(dir: &Path, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
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
fn is_kept_dir(path: &Path) -> bool {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
    !IGNORE_DIRS.contains(&name)
}

/// True for the extensions the extractor parses.
fn is_supported_extension(path: &Path) -> bool {
    let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
        return false;
    };
    matches!(ext, "tsx" | "ts" | "jsx" | "js")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    /// Process-wide counter so parallel tests never share a temp root.
    static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

    /// Unique temp root for one test: pid plus a monotonic counter.
    fn temp_root(name: &str) -> std::path::PathBuf {
        let id = TEMP_COUNTER.fetch_add(1, Ordering::SeqCst);
        std::env::temp_dir().join(format!(
            "lanea-union-{}-{id}-{name}",
            std::process::id()
        ))
    }

    /// Tricky tree: live, dotfile, and d.ts sources plus dist-, ignored-,
    /// and extension-excluded decoys. Returns the root string.
    fn write_tricky_tree(name: &str) -> (std::path::PathBuf, String) {
        let root = temp_root(name);
        let live = "export const a = 1;\n";
        for (rel, content) in [
            ("src/a.ts", live),
            ("src/.hidden.ts", live),
            ("src/t.d.ts", live),
            ("dist/skip.ts", live),
            ("node_modules/pkg/x.ts", live),
            ("src/data.json", "{}\n"),
        ] {
            let path = root.join(rel);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(&path, content).unwrap();
        }
        let root_str = root.to_string_lossy().to_string();
        (root, root_str)
    }

    /// Sorted gathered pairs for comparisons (gather itself is unordered).
    fn sorted(mut sources: Vec<(String, String)>) -> Vec<(String, String)> {
        sources.sort_unstable();
        sources
    }

    /// The disk scan keeps live sources, dotfiles, and d.ts files while
    /// dropping IGNORE dirs and non-source extensions.
    #[test]
    fn disk_scan_pins_the_tricky_set() {
        let (root, root_str) = write_tricky_tree("scan");
        let request = CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        };
        let paths: Vec<String> = sorted(gather(&request))
            .into_iter()
            .map(|(path, _)| path)
            .collect();
        assert_eq!(
            paths,
            [
                format!("{root_str}/src/.hidden.ts"),
                format!("{root_str}/src/a.ts"),
                format!("{root_str}/src/t.d.ts"),
            ]
        );
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Provided-everything plus a root equals the bare disk scan, and a
    /// provided subset backfills the missing disk paths to the same set.
    #[test]
    fn provided_union_matches_the_disk_scan() {
        let (root, root_str) = write_tricky_tree("union");
        let scanned = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        }));
        let all = scanned
            .iter()
            .map(|(path, content)| VirtualSource {
                path: path.clone(),
                content: content.clone(),
            })
            .collect::<Vec<_>>();
        let full = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            files: Some(all.clone()),
            ..Default::default()
        }));
        assert_eq!(full, scanned);
        let subset = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            files: Some(all[..1].to_vec()),
            ..Default::default()
        }));
        assert_eq!(subset, scanned);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Symlink tree: a real dir plus a linked dir, a linked file carrying
    /// the target's bytes, and a dangling link. Unix-only: links need
    /// symlink privileges the portable suite cannot assume.
    #[cfg(unix)]
    fn write_symlink_tree(name: &str) -> (std::path::PathBuf, String) {
        let root = temp_root(name);
        std::fs::create_dir_all(root.join("src/real")).unwrap();
        std::fs::write(root.join("src/real/a.ts"), "export const a = 1;\n").unwrap();
        std::os::unix::fs::symlink(root.join("src/real"), root.join("src/linkdir")).unwrap();
        std::os::unix::fs::symlink(root.join("src/real/a.ts"), root.join("src/linkfile.ts"))
            .unwrap();
        std::os::unix::fs::symlink(root.join("src/missing.ts"), root.join("src/dangling.ts"))
            .unwrap();
        let root_str = root.to_string_lossy().to_string();
        (root, root_str)
    }

    /// Links keep stat-everything verdicts on both walks: linked dirs
    /// descend, linked files carry target bytes, dangling links drop, and
    /// the union backfill completes a provided subset to the same set.
    #[cfg(unix)]
    #[test]
    fn symlinks_keep_stat_verdicts_on_both_walks() {
        let (root, root_str) = write_symlink_tree("symlinks");
        let scanned = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        }));
        let paths: Vec<String> = scanned
            .iter()
            .map(|(path, _)| path.clone())
            .collect();
        assert_eq!(
            paths,
            [
                format!("{root_str}/src/linkdir/a.ts"),
                format!("{root_str}/src/linkfile.ts"),
                format!("{root_str}/src/real/a.ts"),
            ]
        );
        let linked = scanned
            .iter()
            .find(|(path, _)| path.ends_with("linkfile.ts"))
            .unwrap();
        assert_eq!(linked.1, "export const a = 1;\n");
        let all = scanned
            .iter()
            .map(|(path, content)| VirtualSource {
                path: path.clone(),
                content: content.clone(),
            })
            .collect::<Vec<_>>();
        let subset = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            files: Some(all[..1].to_vec()),
            ..Default::default()
        }));
        assert_eq!(subset, scanned);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Provided files without a root keep legacy filter semantics exactly:
    /// no walk, no backfill, scope-filtered handoff only.
    #[test]
    fn files_without_root_keep_legacy_semantics() {
        let provided = vec![
            VirtualSource {
                path: "/elsewhere/a.ts".to_string(),
                content: "export const a = 1;\n".to_string(),
            },
            VirtualSource {
                path: "/elsewhere/b.ts".to_string(),
                content: "export const b = 2;\n".to_string(),
            },
        ];
        let request = CompileRequest {
            files: Some(provided.clone()),
            ..Default::default()
        };
        let gathered = sorted(gather(&request));
        let expected = sorted(
            provided
                .into_iter()
                .map(|file| (file.path, file.content))
                .collect(),
        );
        assert_eq!(gathered, expected);
    }
}
