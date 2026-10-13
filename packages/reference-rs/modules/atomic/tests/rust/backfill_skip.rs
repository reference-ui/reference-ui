//! Walk-completeness skip parity: a complete retention over the same scope
//! and root compiles the identical artifact as the files and disk arms. Takes
//! the tricky tree through a complete scan plus both control arms and asserts
//! full-result equality, so the skipped union backfill walk drops nothing.

use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

use atomic::scan::{self, ScanRequest};
use atomic::{BaseSystem, CompileRequest, VirtualSource};

/// Process-wide counter so parallel tests never share a temp root.
static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Unique temp root for one test: pid plus a monotonic counter.
fn temp_root(name: &str) -> PathBuf {
    let id = TEMP_COUNTER.fetch_add(1, Ordering::SeqCst);
    std::env::temp_dir().join(format!("atomic-skip-{id}-{name}-{}", std::process::id()))
}

/// Write one file under the root, creating parents; returns the full path.
fn write_file(root: &std::path::Path, rel: &str, bytes: &[u8]) -> String {
    let full = root.join(rel);
    std::fs::create_dir_all(full.parent().unwrap()).unwrap();
    std::fs::write(&full, bytes).unwrap();
    full.to_string_lossy().to_string()
}

/// Tricky tree: live, dotfile, and d.ts sources plus dist-, ignored-, and
/// extension-excluded decoys. Returns the root string plus all listed paths.
fn write_tricky_tree(root: &std::path::Path) -> (String, Vec<String>) {
    let live =
        "import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red' })\n";
    let mut paths = Vec::new();
    for (rel, content) in [
        ("src/a.ts", live),
        ("src/.hidden.ts", live),
        ("src/t.d.ts", live),
        ("dist/skip.ts", live),
        ("node_modules/pkg/x.ts", live),
        ("src/data.json", "{}\n"),
    ] {
        paths.push(write_file(root, rel, content.as_bytes()));
    }
    (root.to_string_lossy().to_string(), paths)
}

/// Complete scan with the manifest on: the asserted enumeration plus the
/// retained set the files arm mirrors.
fn scan_complete(root: &str, paths: &[String]) -> scan::ScanResponse {
    scan::scan(&ScanRequest {
        paths: paths.to_vec(),
        needles: vec!["css".to_string()],
        cwd: root.to_string(),
        sep: "/".to_string(),
        retain: true,
        manifest: true,
        walk_complete: true,
        include: Vec::new(),
    })
}

/// Compile over the lib fixture with proof rows for the differential.
fn compile_with(
    root: Option<String>,
    files: Option<Vec<VirtualSource>>,
    token: Option<u64>,
) -> atomic::CompileResult {
    atomic::compile(&CompileRequest {
        root_dir: root,
        files,
        retention_token: token,
        base_system: BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    })
    .expect("compile succeeds")
}

/// The skip arm converges with files and disk: a complete retention over the
/// same scope and root compiles the identical artifact without the union
/// backfill walk.
#[test]
fn collect_complete_token_skips_and_matches_files_and_disk() {
    let root = temp_root("skip-parity");
    let (root_str, paths) = write_tricky_tree(&root);
    let response = scan_complete(&root_str, &paths);
    assert_eq!(response.retained_count, 3);
    let files: Vec<VirtualSource> = response
        .manifest
        .as_ref()
        .unwrap()
        .iter()
        .map(|entry| {
            let full = root.join(&entry.path).to_string_lossy().to_string();
            VirtualSource {
                path: full.clone(),
                content: std::fs::read_to_string(&full).unwrap(),
            }
        })
        .collect();
    let token = response.retention_token.unwrap();
    let from_token = compile_with(Some(root_str.clone()), None, Some(token));
    let from_files = compile_with(Some(root_str.clone()), Some(files), None);
    assert_eq!(from_token, from_files);
    assert_eq!(from_token, compile_with(Some(root_str), None, None));
    std::fs::remove_dir_all(&root).unwrap();
}
