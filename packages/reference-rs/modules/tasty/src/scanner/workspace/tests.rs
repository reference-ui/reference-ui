//! Workspace discovery tests.
//! Pins traversal layout, library boundaries, dangling-link tolerance, the failures for a missing or unreadable scan root
//! and for an include glob with an unclosed class or braces past the limits, and resolver memoization over temp-dir fixtures.

mod dangling_links;
mod discovery_layout;
mod library_boundaries;
mod memo;

use super::scan_workspace;
use crate::tests::fixtures::TempDir;

#[test]
fn scan_workspace_follows_user_reexports_of_external_modules() {
    let root = TempDir::new("scanner-workspace-reexports");
    root.write(
        "src/index.ts",
        "export type { ButtonProps } from 'external-lib';\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "src/index.ts"));
    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/external-lib/index.d.ts"));
}

#[test]
fn scan_workspace_skips_user_external_imports_without_reexport_bridge() {
    // Contract restoration: the scan boundary in
    // the scanner README states a user file that only `import`s from a library
    // does not cause that library to be scanned. Formerly
    // `scan_workspace_includes_user_external_imports_for_reference_docs`, which
    // pinned the loosened behavior; the bridge test above
    // (`scan_workspace_follows_user_reexports_of_external_modules`) pins the
    // positive half of the same boundary.
    let root = TempDir::new("scanner-workspace-import-only");
    root.write(
        "src/index.ts",
        "import type { ButtonProps } from 'external-lib';\nexport interface Local {}\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    // No re-export bridge: the external library stays out of the scan graph.
    assert_eq!(workspace.files.len(), 1);
    let file_ids: Vec<&str> = workspace.files.iter().map(|f| f.file_id.as_str()).collect();
    assert!(file_ids.contains(&"src/index.ts"));
    assert!(!file_ids.contains(&"node_modules/external-lib/index.d.ts"));
}

#[test]
fn scan_workspace_follows_scoped_plain_imports_without_bridging() {
    // Resolution restoration: a user file that only
    // `import`s a scoped package pulls it into the scan graph so references
    // resolve, but the library stays out of the bridge set — its symbols
    // emit chunks without name entries (followed-without-indexing).
    let root = TempDir::new("scanner-workspace-scoped-plain-import");
    root.write(
        "src/index.ts",
        "import type { Widget } from '@scope/widgets';\nexport interface Local { widget?: Widget }\n",
    );
    root.write(
        "node_modules/@scope/widgets/package.json",
        r#"{ "name": "@scope/widgets", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@scope/widgets/index.d.ts",
        "export interface Widget { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/@scope/widgets/index.d.ts"));
    assert!(!workspace.bridged_libraries.contains("@scope/widgets"));
}

#[test]
fn scan_workspace_marks_reexported_scoped_libraries_as_bridged() {
    // The bridge half of the boundary: a user re-export from a scoped
    // package both follows it and marks it bridged, so its symbols enter
    // the manifest name index.
    let root = TempDir::new("scanner-workspace-scoped-reexport");
    root.write(
        "src/index.ts",
        "export type { Widget } from '@scope/widgets';\n",
    );
    root.write(
        "node_modules/@scope/widgets/package.json",
        r#"{ "name": "@scope/widgets", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@scope/widgets/index.d.ts",
        "export interface Widget { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/@scope/widgets/index.d.ts"));
    assert!(workspace.bridged_libraries.contains("@scope/widgets"));
}

#[test]
fn scan_workspace_fails_with_the_walk_error_when_the_root_is_missing() {
    let root = TempDir::new("scanner-workspace-missing-root");
    let missing = root.path().join("absent");
    let err = scan_workspace(&missing, &["**/*.ts".to_string()])
        .err()
        .expect("a missing scan root fails the scan");
    let io = std::fs::metadata(&missing).expect_err("the root is absent");
    assert_eq!(
        err,
        format!(
            "TST-E-SCAN-FAILED: failed to walk scan root: IO error for operation on {}: {io}",
            missing.display()
        )
    );
}

/// Restores a locked directory's mode on drop, so the temp dir can be removed even when an assertion fails first.
#[cfg(unix)]
struct RestoreMode<'a>(&'a std::path::Path);

#[cfg(unix)]
impl Drop for RestoreMode<'_> {
    fn drop(&mut self) {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(self.0, std::fs::Permissions::from_mode(0o755));
    }
}

#[cfg(unix)]
#[test]
fn scan_workspace_fails_with_the_walk_error_when_the_root_is_unreadable() {
    use std::os::unix::fs::PermissionsExt;
    let root = TempDir::new("scanner-workspace-unreadable-root");
    root.write("locked/src/a.ts", "export const a = 1;\n");
    let locked = root.path().join("locked");
    std::fs::set_permissions(&locked, std::fs::Permissions::from_mode(0o000)).expect("lock the root");
    let restore = RestoreMode(&locked);
    let io = match std::fs::read_dir(&locked) {
        Ok(_) => return,
        Err(io) => io,
    };
    let err = scan_workspace(&locked, &["**/*.ts".to_string()])
        .err()
        .expect("an unreadable scan root fails the scan");
    drop(restore);
    assert_eq!(
        err,
        format!(
            "TST-E-SCAN-FAILED: failed to walk scan root: IO error for operation on {}: {io}",
            locked.display()
        )
    );
}

#[test]
fn scan_workspace_fails_on_an_include_glob_with_an_unclosed_class() {
    let root = TempDir::new("scanner-workspace-unclosed-class");
    std::fs::create_dir_all(root.path().join("src")).expect("src dir");
    std::fs::write(root.path().join("src/ok.ts"), "export const ok = 1;\n").expect("source");
    let include = ["src/**/*.ts".to_string(), "src/[ab.ts".to_string()];
    let err = scan_workspace(root.path(), &include)
        .err()
        .expect("an unclosed class fails the scan");
    assert_eq!(
        err,
        "TST-E-SCAN-FAILED: invalid include glob 'src/[ab.ts': unclosed character class at offset 4; missing ']'"
    );
    let closed = ["src/**/*.ts".to_string(), "src/[]ab].ts".to_string(), "src/\\[x.ts".to_string()];
    assert!(scan_workspace(root.path(), &closed).is_ok());
}

#[test]
fn scan_workspace_fails_on_an_include_glob_past_the_brace_limits() {
    let root = TempDir::new("scanner-workspace-brace-limits");
    std::fs::create_dir_all(root.path().join("src")).expect("src dir");
    std::fs::write(root.path().join("src/ok.ts"), "export const ok = 1;\n").expect("source");
    let wide = format!("src/{}.ts", "{a,b}".repeat(11));
    let err = scan_workspace(root.path(), &[wide.clone()])
        .err()
        .expect("a pattern expanding past 1,024 globs fails the scan");
    assert_eq!(
        err,
        format!("TST-E-SCAN-FAILED: invalid include glob '{wide}': braces expand to more than 1,024 globs")
    );
    let deep = format!("!src/{}b{}.ts", "{a,".repeat(65), "}".repeat(65));
    let err = scan_workspace(root.path(), &[deep.clone()])
        .err()
        .expect("a pattern nesting past 64 levels fails the scan");
    assert_eq!(
        err,
        format!("TST-E-SCAN-FAILED: invalid include glob '{deep}': braces nest deeper than 64 levels")
    );
    let pairs = format!("src/{}.ts", "{x,y}".repeat(5000));
    assert!(scan_workspace(root.path(), &[pairs]).is_err());
    let edge = format!("src/**/*.ts{}", "{a,b}".repeat(10));
    assert!(scan_workspace(root.path(), &[edge]).is_ok());
}
