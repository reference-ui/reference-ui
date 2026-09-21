//! Source discovery for the atomic compile pipeline.
//! Takes the request's virtual `files` list or `root_dir` and emits sorted
//! `(path, content)` pairs for extraction. The disk scan skips fixed build and
//! metadata directories plus non-source extensions; the include scope then
//! filters both paths to matching files, silently dropping the rest.

use std::collections::HashSet;
use std::path::Path;

use crate::includes::IncludeScope;
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

/// Provided `files` union-filled from disk when present, otherwise the
/// filtered `root_dir` scan. An empty list scans: absence and emptiness
/// both mean "the caller handed nothing over".
fn gather(request: &CompileRequest) -> Vec<(String, String)> {
    let patterns = request.include.as_deref().unwrap_or(&[]);
    let scope = IncludeScope::compile(patterns);
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return union_sources(files, request.root_dir.as_deref(), &scope);
        }
    }

    let mut sources = Vec::new();
    if let Some(root_dir) = &request.root_dir {
        scan_dir(
            Path::new(root_dir),
            &scope,
            request.root_dir.as_deref(),
            &mut sources,
        );
    }
    sources
}

/// Virtual sources inside the include scope; an open scope keeps every file.
fn filter_virtual_sources(
    files: &[VirtualSource],
    root: Option<&str>,
    scope: &IncludeScope,
) -> Vec<(String, String)> {
    files
        .iter()
        .filter(|file| scope.matches_file(root, &file.path))
        .map(|file| (file.path.clone(), file.content.clone()))
        .collect()
}

/// Provided sources plus the scope-hit disk paths the list misses: provided
/// bytes win on collision and only missing paths read from disk, so set
/// equality holds by construction whatever glob engine built the list. With
/// no root the walk has nowhere to go and this is exactly the legacy
/// provided filter, so files-only callers keep byte-identical semantics.
fn union_sources(
    files: &[VirtualSource],
    root: Option<&str>,
    scope: &IncludeScope,
) -> Vec<(String, String)> {
    let mut provided = filter_virtual_sources(files, root, scope);
    let Some(root_dir) = root else {
        return provided;
    };
    let mut known: HashSet<String> = provided.iter().map(|(path, _)| path.clone()).collect();
    let mut candidates = Vec::new();
    collect_candidate_paths(Path::new(root_dir), scope, root, &mut candidates);
    for path in candidates {
        if known.contains(&path) {
            continue;
        }
        if let Ok(content) = std::fs::read_to_string(&path) {
            known.insert(path.clone());
            provided.push((path, content));
        }
    }
    provided
}

/// Scope-hit candidate PATHS under `dir` (no reads): the union-fill walk.
/// Same traversal, IGNORE set, extension gate, and scope predicate as the
/// collecting scan, so every path the scan would read is a candidate.
fn collect_candidate_paths(
    dir: &Path,
    scope: &IncludeScope,
    root: Option<&str>,
    acc: &mut Vec<String>,
) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<_> = entries.flatten().map(|entry| entry.path()).collect();
    paths.sort();
    for path in paths {
        handle_candidate_entry(&path, scope, root, acc);
    }
}

/// Descend into kept directories, collect supported in-scope path strings.
fn handle_candidate_entry(
    path: &Path,
    scope: &IncludeScope,
    root: Option<&str>,
    acc: &mut Vec<String>,
) {
    if path.is_dir() {
        if is_kept_dir(path) {
            collect_candidate_paths(path, scope, root, acc);
        }
        return;
    }
    if !is_supported_extension(path) {
        return;
    }
    let path_str = path.to_string_lossy();
    if scope.matches_file(root, &path_str) {
        acc.push(path_str.to_string());
    }
}

/// Recursively collect supported sources under `dir`, skipping fixed ignores.
/// The include scope is a pure path predicate, so it runs before the read:
/// out-of-scope files cost a match, never I/O.
fn scan_dir(dir: &Path, scope: &IncludeScope, root: Option<&str>, acc: &mut Vec<(String, String)>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<_> = entries.flatten().map(|entry| entry.path()).collect();
    paths.sort();
    for path in paths {
        handle_dir_entry(&path, scope, root, acc);
    }
}

/// Descend into kept directories, read supported in-scope source files.
fn handle_dir_entry(
    path: &Path,
    scope: &IncludeScope,
    root: Option<&str>,
    acc: &mut Vec<(String, String)>,
) {
    if path.is_dir() {
        if is_kept_dir(path) {
            scan_dir(path, scope, root, acc);
        }
    } else if is_supported_extension(path) {
        let path_str = path.to_string_lossy();
        if scope.matches_file(root, &path_str) {
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
