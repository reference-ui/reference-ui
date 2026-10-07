//! Falsifier that discovery and extraction share one import resolver.
//!
//! `scan_workspace` builds a single [`ImportResolver`](crate::scanner::ImportResolver),
//! warms it while crawling reachable files, and carries it onto the
//! `ScannedWorkspace` that `extract_ast` later reads. This test removes the
//! resolved package from `node_modules` *after* the scan: the workspace
//! resolver must still answer from the discovery-warmed memo, extraction must
//! observe that same answer, and a fresh resolver on the mutated root must miss
//! — so dropping the resolver or rebuilding one inside extraction fails loudly.

use std::fs;

use crate::ast::extract_ast;
use crate::scanner::{scan_workspace, ImportResolver};
use crate::tests::fixtures::TempDir;

#[test]
fn scan_workspace_hands_extraction_a_discovery_warmed_resolver() {
    let root = TempDir::new("scanner-workspace-memo-sharing");
    root.write(
        "src/index.ts",
        "import type { Memo } from '@memo/lib';\nexport interface Local { memo?: Memo }\n",
    );
    root.write(
        "node_modules/@memo/lib/package.json",
        r#"{ "name": "@memo/lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@memo/lib/index.d.ts",
        "export interface Memo {}\n",
    );

    let workspace =
        scan_workspace(root.path(), &["src/**/*.ts".to_string()]).expect("scan should succeed");

    // Mutate the disk after discovery: only a warm memo can still answer.
    fs::remove_dir_all(root.path().join("node_modules/@memo/lib")).expect("remove package");

    let cached = workspace
        .resolver
        .resolve_import("src/index.ts", "@memo/lib", &workspace.file_ids);
    assert_eq!(
        cached.as_deref(),
        Some("node_modules/@memo/lib/index.d.ts"),
        "workspace resolver must serve discovery's cached hit after removal"
    );

    // End-to-end: extraction resolves through the very same resolver.
    let parsed = extract_ast(&workspace).expect("extract should succeed");
    let user_file = parsed
        .files
        .iter()
        .find(|file| file.file_id == "src/index.ts")
        .expect("user file was scanned");
    let binding = user_file
        .import_bindings
        .get("Memo")
        .expect("Memo import binding");
    assert_eq!(
        binding.target_file_id.as_deref(),
        Some("node_modules/@memo/lib/index.d.ts"),
        "extraction must reuse the discovery-warmed memo, not re-walk the disk"
    );

    // Control: a fresh resolver on the mutated root genuinely misses.
    let fresh = ImportResolver::new(root.path());
    assert_eq!(
        fresh.resolve_import("src/index.ts", "@memo/lib", &workspace.file_ids),
        None,
        "a fresh resolver re-walks the mutated disk and finds nothing"
    );
}
