//! Retention-contract tests: a complete scan skips the union backfill, an incomplete flag or a scope or
//! root mismatch keeps the walk, and the skip and walk arms agree byte for byte. Each test scans a
//! fixture into a retention token, drains it through `collect_checked`, then asserts the outcome and
//! the sources. Compiled only under `cfg(test)` as a child of `sources::tests`.

use super::{scan_request, sorted, temp_root, token_request, tricky_paths, write_tricky_tree};
use crate::sources::backfill::backfill_walks;
use crate::sources::collect_checked;
use crate::sources::gather::gather;
use crate::sources::request::BackfillOutcome;
use crate::CompileRequest;

/// A complete retention over the same scope and root skips the union
/// backfill walk: zero walks, and the sources equal the disk scan set.
#[test]
fn complete_retention_skips_the_backfill_walk() {
    let (root, root_str) = write_tricky_tree("skip");
    let scanned = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        ..Default::default()
    }));
    let response = crate::scan::scan(&scan_request(
        tricky_paths(&root),
        &root_str,
        Vec::new(),
        true,
    ));
    let token = response.retention_token.unwrap();
    let (sources, outcome) =
        collect_checked(&token_request(&root_str, token, None)).unwrap();
    assert_eq!(outcome, BackfillOutcome::Skipped);
    assert_eq!(sorted(sources), scanned);
    std::fs::remove_dir_all(&root).unwrap();
}

/// An incomplete flag keeps the walk: the counter grows and the union
/// still completes the listed paths to the disk scan set.
#[test]
fn incomplete_flag_keeps_the_walk_and_matches() {
    let (root, root_str) = write_tricky_tree("walk");
    let scanned = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        ..Default::default()
    }));
    let before = backfill_walks();
    let response = crate::scan::scan(&scan_request(
        tricky_paths(&root),
        &root_str,
        Vec::new(),
        false,
    ));
    let token = response.retention_token.unwrap();
    let (sources, outcome) =
        collect_checked(&token_request(&root_str, token, None)).unwrap();
    assert_eq!(outcome, BackfillOutcome::Walked);
    assert!(backfill_walks() - before >= 1);
    assert_eq!(sorted(sources), scanned);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Skip and walk arms agree byte-for-byte on one complete fixture: same
/// paths in the same order with identical contents.
#[test]
fn skip_matches_walk_byte_for_byte() {
    let (root, root_str) = write_tricky_tree("identical");
    let request = |complete: bool| {
        let response = crate::scan::scan(&scan_request(
            tricky_paths(&root),
            &root_str,
            Vec::new(),
            complete,
        ));
        token_request(&root_str, response.retention_token.unwrap(), None)
    };
    let (skipped, skip_outcome) = collect_checked(&request(true)).unwrap();
    let (walked, walk_outcome) = collect_checked(&request(false)).unwrap();
    assert_eq!(skip_outcome, BackfillOutcome::Skipped);
    assert_eq!(walk_outcome, BackfillOutcome::Walked);
    assert_eq!(skipped, walked);
    std::fs::remove_dir_all(&root).unwrap();
}

/// A scope the scan did not cover keeps the walk: the drained list filters
/// to the compile scope and the walk union-fills the rest of it.
#[test]
fn scope_mismatch_keeps_the_walk() {
    let root = temp_root("scope");
    for rel in ["src/a.ts", "theme/t.ts"] {
        let path = root.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, "export const a = 1;\n").unwrap();
    }
    let root_str = root.to_string_lossy().to_string();
    let paths = ["src/a.ts", "theme/t.ts"]
        .into_iter()
        .map(|rel| root.join(rel).to_string_lossy().to_string())
        .collect();
    let response = crate::scan::scan(&scan_request(
        paths,
        &root_str,
        vec!["src/**".to_string()],
        true,
    ));
    let token = response.retention_token.unwrap();
    let (sources, outcome) = collect_checked(&token_request(
        &root_str,
        token,
        Some(vec!["theme/**".to_string()]),
    ))
    .unwrap();
    assert_eq!(outcome, BackfillOutcome::Walked);
    assert_eq!(sources, [(format!("{root_str}/theme/t.ts"), "export const a = 1;\n".to_string())]);
    std::fs::remove_dir_all(&root).unwrap();
}

/// A root the scan did not cover keeps the walk: drained bytes union with
/// the walked root exactly as the unskipped path always combined them.
#[test]
fn root_mismatch_keeps_the_walk() {
    let first = temp_root("root-a");
    let second = temp_root("root-b");
    std::fs::create_dir_all(first.join("src")).unwrap();
    std::fs::write(first.join("src/a.ts"), "export const a = 1;\n").unwrap();
    std::fs::create_dir_all(second.join("src")).unwrap();
    std::fs::write(second.join("src/b.ts"), "export const b = 2;\n").unwrap();
    let first_str = first.to_string_lossy().to_string();
    let second_str = second.to_string_lossy().to_string();
    let response = crate::scan::scan(&scan_request(
        vec![first.join("src/a.ts").to_string_lossy().to_string()],
        &first_str,
        Vec::new(),
        true,
    ));
    let token = response.retention_token.unwrap();
    let (sources, outcome) =
        collect_checked(&token_request(&second_str, token, None)).unwrap();
    assert_eq!(outcome, BackfillOutcome::Walked);
    assert_eq!(
        sorted(sources),
        sorted(vec![
            (
                format!("{first_str}/src/a.ts"),
                "export const a = 1;\n".to_string(),
            ),
            (
                format!("{second_str}/src/b.ts"),
                "export const b = 2;\n".to_string(),
            ),
        ])
    );
    std::fs::remove_dir_all(&first).unwrap();
    std::fs::remove_dir_all(&second).unwrap();
}

/// A trailing-slash root still names the scanned root: normalization
/// keeps the skip instead of paying a walk for punctuation.
#[test]
fn trailing_slash_root_still_skips() {
    let (root, root_str) = write_tricky_tree("slash");
    let response = crate::scan::scan(&scan_request(
        tricky_paths(&root),
        &root_str,
        Vec::new(),
        true,
    ));
    let token = response.retention_token.unwrap();
    let request = token_request(&format!("{root_str}/"), token, None);
    let (sources, outcome) = collect_checked(&request).unwrap();
    assert_eq!(outcome, BackfillOutcome::Skipped);
    assert_eq!(sources.len(), 3);
    std::fs::remove_dir_all(&root).unwrap();
}

/// A file deleted after a complete scan still serves its retained bytes
/// on the skip: the snapshot holds, exactly as the walk arm holds it.
#[test]
fn dropped_file_serves_retained_bytes_on_skip() {
    let (root, root_str) = write_tricky_tree("dropped");
    let response = crate::scan::scan(&scan_request(
        tricky_paths(&root),
        &root_str,
        Vec::new(),
        true,
    ));
    let token = response.retention_token.unwrap();
    std::fs::remove_file(root.join("src/a.ts")).unwrap();
    let (sources, outcome) =
        collect_checked(&token_request(&root_str, token, None)).unwrap();
    assert_eq!(outcome, BackfillOutcome::Skipped);
    let held = sources
        .iter()
        .find(|(path, _)| path.ends_with("src/a.ts"))
        .unwrap();
    assert_eq!(held.1, "export const a = 1;\n");
    std::fs::remove_dir_all(&root).unwrap();
}

/// An unreadable path (a directory wearing a source extension) drops on
/// both arms: the scan read fails and the walk descends into nothing.
#[test]
fn unreadable_path_stays_dropped_on_skip() {
    let (root, root_str) = write_tricky_tree("unreadable");
    std::fs::create_dir_all(root.join("src/dir.ts")).unwrap();
    let mut paths = tricky_paths(&root);
    paths.push(root.join("src/dir.ts").to_string_lossy().to_string());
    let request = |complete: bool| {
        let response = crate::scan::scan(&scan_request(
            paths.clone(),
            &root_str,
            Vec::new(),
            complete,
        ));
        token_request(&root_str, response.retention_token.unwrap(), None)
    };
    let (skipped, skip_outcome) = collect_checked(&request(true)).unwrap();
    let (walked, walk_outcome) = collect_checked(&request(false)).unwrap();
    assert_eq!(skip_outcome, BackfillOutcome::Skipped);
    assert_eq!(walk_outcome, BackfillOutcome::Walked);
    assert_eq!(skipped, walked);
    assert!(!skipped.iter().any(|(path, _)| path.ends_with("dir.ts")));
    std::fs::remove_dir_all(&root).unwrap();
}

/// An empty root mints no token, so compile takes the legacy disk scan
/// (no backfill question arises) and finds nothing either way.
#[test]
fn empty_root_takes_the_legacy_scan() {
    let root = temp_root("empty");
    std::fs::create_dir_all(&root).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let response = crate::scan::scan(&scan_request(Vec::new(), &root_str, Vec::new(), true));
    assert_eq!(response.retention_token, None);
    let request = CompileRequest {
        root_dir: Some(root_str),
        ..Default::default()
    };
    let (sources, outcome) = collect_checked(&request).unwrap();
    assert_eq!(outcome, BackfillOutcome::Legacy);
    assert!(sources.is_empty());
    std::fs::remove_dir_all(&root).unwrap();
}

/// One live file skips: the single-file root pays no walk for one read.
#[test]
fn single_file_skips() {
    let root = temp_root("single");
    std::fs::create_dir_all(root.join("src")).unwrap();
    std::fs::write(root.join("src/a.ts"), "export const a = 1;\n").unwrap();
    let root_str = root.to_string_lossy().to_string();
    let response = crate::scan::scan(&scan_request(
        vec![root.join("src/a.ts").to_string_lossy().to_string()],
        &root_str,
        Vec::new(),
        true,
    ));
    let token = response.retention_token.unwrap();
    let (sources, outcome) =
        collect_checked(&token_request(&root_str, token, None)).unwrap();
    assert_eq!(outcome, BackfillOutcome::Skipped);
    assert_eq!(sources.len(), 1);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Sources without style calls still list (collection never parses), and
/// an all-dead tree skips like any complete retention.
#[test]
fn all_dead_sources_still_skip() {
    let root = temp_root("dead");
    for name in ["a.ts", "b.ts"] {
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(root.join("src").join(name), "export const x = 1;\n").unwrap();
    }
    let root_str = root.to_string_lossy().to_string();
    let paths = ["src/a.ts", "src/b.ts"]
        .into_iter()
        .map(|rel| root.join(rel).to_string_lossy().to_string())
        .collect();
    let response = crate::scan::scan(&scan_request(paths, &root_str, Vec::new(), true));
    let token = response.retention_token.unwrap();
    let (sources, outcome) =
        collect_checked(&token_request(&root_str, token, None)).unwrap();
    assert_eq!(outcome, BackfillOutcome::Skipped);
    assert_eq!(sources.len(), 2);
    std::fs::remove_dir_all(&root).unwrap();
}
