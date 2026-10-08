//! Native scan retention contract: needle-gate, short-rule reads, lossy
//! UTF-8, token lifecycle, and collect(token) parity with collect(files).
//! Takes tricky plus symlink trees and the M1e byte battery, and asserts the
//! scan/compile exactly-one-of contract without ever touching the disk twice.

use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

use atomic::scan::{self, ScanRequest};
use atomic::{BaseSystem, CompileRequest, VirtualSource};

/// Process-wide counter so parallel tests never share a temp root.
static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Unique temp root for one test: pid plus a monotonic counter.
fn temp_root(name: &str) -> PathBuf {
    let id = TEMP_COUNTER.fetch_add(1, Ordering::SeqCst);
    std::env::temp_dir().join(format!("atomic-scan-{id}-{name}-{}", std::process::id()))
}

/// Write one file under the root, creating parents; returns the full path.
fn write_file(root: &std::path::Path, rel: &str, bytes: &[u8]) -> String {
    let full = root.join(rel);
    std::fs::create_dir_all(full.parent().unwrap()).unwrap();
    std::fs::write(&full, bytes).unwrap();
    full.to_string_lossy().to_string()
}

/// Scan one tree: every listed path, one needle, verbatim gates. The
/// completeness flag stays false here: these pins exercise the kept walk.
fn scan_tree(root: &str, paths: &[String], needle: &str) -> scan::ScanResponse {
    scan::scan(&ScanRequest {
        paths: paths.to_vec(),
        needles: vec![needle.to_string()],
        cwd: root.to_string(),
        sep: "/".to_string(),
        retain: true,
        manifest: false,
        walk_complete: false,
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

/// (15) The needle-gate hits only files carrying the needle bytes (contains
/// semantics); empty needles hit nothing while retention still fills.
#[test]
fn needle_gate_hits_only_needle_files() {
    let root = temp_root("needle");
    let hit = write_file(&root, "src/hit.ts", b"import '@scope/pkg'\n");
    let miss = write_file(&root, "src/miss.ts", b"export const a = 1;\n");
    let root_str = root.to_string_lossy().to_string();
    let paths = vec![hit.clone(), miss.clone()];
    let response = scan_tree(&root_str, &paths, "@scope/pkg");
    assert_eq!(
        response.hits.iter().map(|h| &h.path).collect::<Vec<_>>(),
        vec![&hit]
    );
    assert_eq!(response.hits[0].content, "import '@scope/pkg'\n");
    assert_eq!(response.retained_count, 2);
    let token = response.retention_token.unwrap();
    scan::drain(token).unwrap();
    let empty = scan::scan(&ScanRequest {
        paths,
        needles: Vec::new(),
        cwd: root_str,
        sep: "/".to_string(),
        retain: true,
        manifest: false,
        walk_complete: false,
        include: Vec::new(),
    });
    assert!(empty.hits.is_empty());
    assert_eq!(empty.retained_count, 2);
    scan::drain(empty.retention_token.unwrap()).unwrap();
    std::fs::remove_dir_all(&root).unwrap();
}

/// (16) The short-rule reads every size class exactly: empty, small,
/// exact-64K (full plus zero), 64K+1 (full plus short), and multi-chunk.
#[test]
fn short_rule_reads_every_size_class() {
    let root = temp_root("short");
    let sizes = [0usize, 3, 65535, 65536, 65537, 200 * 1024];
    let mut paths = Vec::new();
    let mut expected = Vec::new();
    for (i, size) in sizes.iter().enumerate() {
        let body = format!("/*{i}*/").repeat(size.div_ceil(5) + 1)[..*size].to_string();
        paths.push(write_file(&root, &format!("src/f{i}.ts"), body.as_bytes()));
        expected.push(body);
    }
    let root_str = root.to_string_lossy().to_string();
    let response = scan_tree(&root_str, &paths, "/*needle-never-present*/");
    assert!(response.hits.is_empty());
    assert_eq!(response.retained_count, sizes.len());
    let retained = scan::drain(response.retention_token.unwrap()).unwrap();
    for (i, path) in paths.iter().enumerate() {
        let found = retained.files.iter().find(|(p, _)| p == path).unwrap();
        assert_eq!(found.1, expected[i], "size class {i} mismatch");
    }
    std::fs::remove_dir_all(&root).unwrap();
}

/// (17) Lossy UTF-8 pins the M1e battery code-point for code-point (node
/// `readFileSync(utf-8)` agrees on all nine; the TS battery re-proves it).
#[test]
fn lossy_utf8_pins_the_m1e_battery() {
    let root = temp_root("lossy");
    let vectors: &[(&str, &[u8], &str)] = &[
        ("overlong", b"A\xc0\xafB", "A\u{fffd}\u{fffd}B"),
        ("surrogate", b"\xed\xa0\x80Z", "\u{fffd}\u{fffd}\u{fffd}Z"),
        ("truncated2", b"a\xc3", "a\u{fffd}"),
        ("truncated3", b"b\xe2\x82", "b\u{fffd}"),
        ("cesu8", b"\xed\xa1\x8c\xed\xba\xa0", "\u{fffd}\u{fffd}\u{fffd}\u{fffd}\u{fffd}\u{fffd}"),
        ("bom", b"\xef\xbb\xbfc", "\u{feff}c"),
        ("lone80", b"d\x80e", "d\u{fffd}e"),
        ("fffe", b"\xff\xfef", "\u{fffd}\u{fffd}f"),
        ("valid4", b"\xf0\x9f\x98\x80", "\u{1f600}"),
    ];
    let mut paths = Vec::new();
    for (name, bytes, _) in vectors {
        paths.push(write_file(&root, &format!("src/{name}.ts"), bytes));
    }
    let root_str = root.to_string_lossy().to_string();
    let response = scan_tree(&root_str, &paths, "/*needle-never-present*/");
    assert_eq!(response.retained_count, vectors.len());
    let retained = scan::drain(response.retention_token.unwrap()).unwrap();
    for (i, (name, _, text)) in vectors.iter().enumerate() {
        assert_eq!(retained.files[i].1, *text, "vector {name} mismatch");
    }
    std::fs::remove_dir_all(&root).unwrap();
}

/// (18) Store lifecycle: drain moves once, double-drain and unknown fail
/// loud with distinct errors, release is idempotent, retain:false and empty
/// retentions mint no token.
#[test]
fn store_lifecycle_moves_once_and_fails_loud() {
    let root = temp_root("lifecycle");
    let live = write_file(&root, "src/a.ts", b"export const a = 1;\n");
    let root_str = root.to_string_lossy().to_string();
    let response = scan_tree(&root_str, &[live.clone()], "needle");
    let token = response.retention_token.unwrap();
    let drained = scan::drain(token).unwrap();
    assert_eq!(
        drained.files,
        vec![(live, "export const a = 1;\n".to_string())]
    );
    assert!(!drained.walk_complete);
    assert_eq!(scan::drain(token), Err(scan::TokenError::Drained(token)));
    assert!(!scan::release(token));
    assert_eq!(
        scan::drain(u64::MAX),
        Err(scan::TokenError::Unknown(u64::MAX))
    );
    let second = scan_tree(
        &root_str,
        &[write_file(&root, "src/b.ts", b"export const b = 1;\n")],
        "needle",
    );
    let live_token = second.retention_token.unwrap();
    assert!(scan::release(live_token));
    assert!(!scan::release(live_token));
    assert_eq!(
        scan::drain(live_token),
        Err(scan::TokenError::Unknown(live_token))
    );
    let matches_only = scan::scan(&ScanRequest {
        paths: vec![write_file(&root, "src/c.ts", b"export const c = 1;\n")],
        needles: Vec::new(),
        cwd: root_str.clone(),
        sep: "/".to_string(),
        retain: false,
        manifest: false,
        walk_complete: false,
        include: Vec::new(),
    });
    assert_eq!(matches_only.retained_count, 0);
    assert_eq!(matches_only.retention_token, None);
    let empty = scan_tree(&root_str, &[], "needle");
    assert_eq!(empty.retained_count, 0);
    assert_eq!(empty.retention_token, None);
    std::fs::remove_dir_all(&root).unwrap();
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

/// Read listed paths into virtual sources (the TS handoff mirror: unreadable
/// files drop, exactly as `readFileSync` failures become null).
fn read_virtual(paths: &[String]) -> Vec<VirtualSource> {
    paths
        .iter()
        .filter_map(|path| {
            std::fs::read_to_string(path)
                .ok()
                .map(|content| VirtualSource {
                    path: path.clone(),
                    content,
                })
        })
        .collect()
}

/// The retained subset as virtual sources: the manifest rels joined back to
/// absolute paths (the real handoff carries the retention set only, never
/// IGNORE-dir or extension-excluded files).
fn read_retained(root: &std::path::Path, manifest: &[scan::ManifestEntry]) -> Vec<VirtualSource> {
    manifest
        .iter()
        .map(|entry| {
            let full = root.join(&entry.path).to_string_lossy().to_string();
            VirtualSource {
                path: full.clone(),
                content: std::fs::read_to_string(&full).unwrap(),
            }
        })
        .collect()
}

/// Scan with the manifest on (test-only flag) for handoff mirroring.
fn scan_manifest(root: &str, paths: &[String], needle: &str) -> scan::ScanResponse {
    scan::scan(&ScanRequest {
        paths: paths.to_vec(),
        needles: vec![needle.to_string()],
        cwd: root.to_string(),
        sep: "/".to_string(),
        retain: true,
        manifest: true,
        walk_complete: false,
        include: Vec::new(),
    })
}

/// (19) collect(token) equals collect(files) equals the disk scan: identical
/// wants, sheets, and diagnostics on the tricky tree (retention-complete, so
/// the kept backfill walk reads zero and all three arms converge).
#[test]
fn collect_token_matches_files_and_disk_on_the_tricky_tree() {
    let root = temp_root("tricky");
    let (root_str, paths) = write_tricky_tree(&root);
    let response = scan_manifest(&root_str, &paths, "css");
    assert_eq!(response.retained_count, 3);
    let files = read_retained(&root, &response.manifest.as_ref().unwrap());
    let token = response.retention_token.unwrap();
    let from_token = compile_with(Some(root_str.clone()), None, Some(token));
    let from_files = compile_with(Some(root_str.clone()), Some(files), None);
    let from_disk = compile_with(Some(root_str.clone()), None, None);
    assert_eq!(from_token.wants, from_files.wants);
    assert_eq!(from_token.stylesheet, from_files.stylesheet);
    assert_eq!(from_token.diagnostics, from_files.diagnostics);
    assert_eq!(from_token, from_files);
    assert_eq!(from_token, from_disk);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Symlink tree: a real dir plus a linked dir, a linked file carrying the
/// target's bytes, and a dangling link. Unix-only: links need symlink
/// privileges the portable suite cannot assume.
#[cfg(unix)]
fn write_symlink_tree(root: &std::path::Path) -> (String, Vec<String>) {
    let live =
        "import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red' })\n";
    std::fs::create_dir_all(root.join("src/real")).unwrap();
    std::fs::write(root.join("src/real/a.ts"), live).unwrap();
    std::os::unix::fs::symlink(root.join("src/real"), root.join("src/linkdir")).unwrap();
    std::os::unix::fs::symlink(root.join("src/real/a.ts"), root.join("src/linkfile.ts")).unwrap();
    std::os::unix::fs::symlink(root.join("src/missing.ts"), root.join("src/dangling.ts")).unwrap();
    let paths = ["src/real/a.ts", "src/linkdir/a.ts", "src/linkfile.ts", "src/dangling.ts"]
        .iter()
        .map(|rel| root.join(rel).to_string_lossy().to_string())
        .collect();
    (root.to_string_lossy().to_string(), paths)
}

/// (19b) Link verdicts match on all three arms: linked dirs descend, linked
/// files carry target bytes, dangling links drop, and token equals files.
#[cfg(unix)]
#[test]
fn collect_token_matches_files_and_disk_on_the_symlink_tree() {
    let root = temp_root("symlinks");
    let (root_str, paths) = write_symlink_tree(&root);
    let response = scan_tree(&root_str, &paths, "css");
    assert_eq!(response.retained_count, 3);
    let token = response.retention_token.unwrap();
    let from_token = compile_with(Some(root_str.clone()), None, Some(token));
    let from_files = compile_with(Some(root_str.clone()), Some(read_virtual(&paths)), None);
    assert_eq!(from_token, from_files);
    assert_eq!(from_token, compile_with(Some(root_str), None, None));
    std::fs::remove_dir_all(&root).unwrap();
}

/// (20) Schema rejection: files-plus-token, unknown, and drained tokens yield
/// preamble-only artifacts with the stable ATM-E-* failure-class codes.
#[test]
fn schema_rejections_carry_stable_error_codes() {
    let root = temp_root("reject");
    let live = write_file(&root, "src/a.ts", b"export const a = 1;\n");
    let root_str = root.to_string_lossy().to_string();
    let files = Some(read_virtual(&[live]));
    let both = compile_with(Some(root_str.clone()), files.clone(), Some(11));
    assert_eq!(both.diagnostics.len(), 1);
    assert_eq!(
        both.diagnostics[0].code.as_str(),
        "ATM-E-CONFLICTING-SCAN-INPUTS"
    );
    let unknown = compile_with(Some(root_str.clone()), None, Some(u64::MAX));
    assert_eq!(
        unknown.diagnostics[0].code.as_str(),
        "ATM-E-UNKNOWN-RETENTION-TOKEN"
    );
    let response = scan_tree(&root_str, &[files.as_ref().unwrap()[0].path.clone()], "needle");
    let token = response.retention_token.unwrap();
    let drained_once = compile_with(Some(root_str.clone()), None, Some(token));
    assert!(drained_once.diagnostics.is_empty());
    let drained_twice = compile_with(Some(root_str), None, Some(token));
    assert_eq!(
        drained_twice.diagnostics[0].code.as_str(),
        "ATM-E-DRAINED-RETENTION-TOKEN"
    );
    for rejected in [&both, &unknown, &drained_twice] {
        assert!(rejected.stylesheet.starts_with("@layer"));
        assert_eq!(rejected.stylesheet, rejected.portable_stylesheet);
        assert!(rejected.wants.is_empty());
    }
    std::fs::remove_dir_all(&root).unwrap();
}
