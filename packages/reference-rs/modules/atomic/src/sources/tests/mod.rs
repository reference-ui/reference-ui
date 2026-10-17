//! Shared fixtures for the source-discovery tests: a process-unique temp root, the tricky disk tree
//! with live and decoy files, and the scan and compile request builders for the retention token path.
//! The `disk` and `retention` children pin the walk and the completeness contract against these
//! fixtures. Compiled only under `cfg(test)`.

use std::sync::atomic::{AtomicU64, Ordering};

use crate::CompileRequest;

mod disk;
mod retention;

/// Process-wide counter so parallel tests never share a temp root.
static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Unique temp root for one test: pid plus a monotonic counter.
pub(super) fn temp_root(name: &str) -> std::path::PathBuf {
    let id = TEMP_COUNTER.fetch_add(1, Ordering::SeqCst);
    std::env::temp_dir().join(format!(
        "lanea-union-{}-{id}-{name}",
        std::process::id()
    ))
}

/// Tricky tree: live, dotfile, and d.ts sources plus dist-, ignored-,
/// and extension-excluded decoys. Returns the root string.
pub(super) fn write_tricky_tree(name: &str) -> (std::path::PathBuf, String) {
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
pub(super) fn sorted(mut sources: Vec<(String, String)>) -> Vec<(String, String)> {
    sources.sort_unstable();
    sources
}

/// Native scan request over explicit paths with the completeness flag
/// and covered scope the TS glob gate asserted for this enumeration.
pub(super) fn scan_request(
    paths: Vec<String>,
    cwd: &str,
    include: Vec<String>,
    walk_complete: bool,
) -> crate::scan::ScanRequest {
    crate::scan::ScanRequest {
        paths,
        needles: Vec::new(),
        cwd: cwd.to_string(),
        sep: "/".to_string(),
        retain: true,
        manifest: false,
        walk_complete,
        include,
    }
}

/// Absolute paths of every file under the tricky tree (live plus decoys):
/// the complete enumeration the glob gate would hand the scan.
pub(super) fn tricky_paths(root: &std::path::Path) -> Vec<String> {
    [
        "src/a.ts",
        "src/.hidden.ts",
        "src/t.d.ts",
        "dist/skip.ts",
        "node_modules/pkg/x.ts",
        "src/data.json",
    ]
    .into_iter()
    .map(|rel| root.join(rel).to_string_lossy().to_string())
    .collect()
}

/// Token-path compile over one root with no `files` (the exactly-one-of
/// happy path): drains the token and settles backfill by contract.
pub(super) fn token_request(root: &str, token: u64, include: Option<Vec<String>>) -> CompileRequest {
    CompileRequest {
        root_dir: Some(root.to_string()),
        retention_token: Some(token),
        include,
        ..Default::default()
    }
}
