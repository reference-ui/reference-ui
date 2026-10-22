//! Dangling, looping and linked-sibling symlinks under the scan include.
//! The walk skips a link whose target is gone and cuts a link that closes a loop, so one such link cannot fail the types
//! build. A linked sibling is listed once under its representative path: its real path when one is in scope, else its
//! first alias in walk order. Each test builds a temp tree and drives `scan_workspace` or `scan_typescript_bundle`.

use std::os::unix::fs::symlink;

use super::super::scan_workspace;
use crate::tests::fixtures::TempDir;
use crate::{scan_typescript_bundle, ScanRequest};

#[test]
fn scan_workspace_skips_a_dangling_symlink_under_include() {
    let root = TempDir::new("scanner-workspace-dangling-link");
    root.write("theme/a.ts", "export interface Alpha { a: number }\n");
    symlink("../nowhere.ts", root.path().join("theme/dangling.ts")).expect("dangling symlink");

    let workspace = scan_workspace(root.path(), &["theme/**/*.ts".to_string()])
        .expect("a dangling link under include is skipped, not a scan failure");

    let ids: Vec<&str> = workspace
        .files
        .iter()
        .map(|file| file.file_id.as_str())
        .collect();
    assert_eq!(ids, ["theme/a.ts"]);
}

#[test]
fn scan_workspace_cuts_a_symlink_loop_and_lists_each_real_file_once() {
    let root = TempDir::new("scanner-workspace-link-loop");
    root.write("src/app.ts", "export interface App { a: number }\n");
    root.write("src/card/card.ts", "export interface Card { c: number }\n");
    symlink(".", root.path().join("src/loopA")).expect("loop symlink A");
    symlink(".", root.path().join("src/loopB")).expect("loop symlink B");

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("a symlink loop is cut by the walk, so the types still build");

    let ids: Vec<&str> = workspace
        .files
        .iter()
        .map(|file| file.file_id.as_str())
        .collect();
    assert_eq!(ids, ["src/app.ts", "src/card/card.ts"]);
}

#[test]
fn scan_workspace_lists_a_linked_sibling_once_under_its_real_path() {
    let root = TempDir::new("scanner-workspace-linked-sibling");
    root.write("lib/colors.ts", "export interface Color { c: number }\n");
    root.write("src/app.ts", "export interface App { a: number }\n");
    symlink("../lib", root.path().join("src/palette")).expect("linked sibling");

    let workspace = scan_workspace(root.path(), &["**/*.ts".to_string()])
        .expect("a linked sibling under the include scans");

    let ids: Vec<&str> = workspace
        .files
        .iter()
        .map(|file| file.file_id.as_str())
        .collect();
    assert_eq!(ids, ["lib/colors.ts", "src/app.ts"]);
}

#[test]
fn scan_workspace_lists_a_linked_sibling_under_its_alias_when_the_real_path_is_out_of_scope() {
    let root = TempDir::new("scanner-workspace-linked-sibling-alias");
    root.write("lib/colors.ts", "export interface Color { c: number }\n");
    root.write("src/app.ts", "export interface App { a: number }\n");
    symlink("../lib", root.path().join("src/palette")).expect("linked sibling");

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("a linked sibling whose real path is out of scope scans");

    let ids: Vec<&str> = workspace
        .files
        .iter()
        .map(|file| file.file_id.as_str())
        .collect();
    assert_eq!(ids, ["src/app.ts", "src/palette/colors.ts"]);
}

#[test]
fn scan_workspace_lists_two_linked_siblings_once_under_the_first_alias() {
    let root = TempDir::new("scanner-workspace-linked-siblings");
    root.write("vendor/x.ts", "export interface X { x: number }\n");
    root.write("src/a/keep.txt", "");
    root.write("src/b/keep.txt", "");
    symlink("../../vendor", root.path().join("src/a/shared")).expect("first linked sibling");
    symlink("../../vendor", root.path().join("src/b/shared")).expect("second linked sibling");

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("two linked siblings to one target scan");

    let ids: Vec<&str> = workspace
        .files
        .iter()
        .map(|file| file.file_id.as_str())
        .collect();
    assert_eq!(ids, ["src/a/shared/x.ts"]);
}

#[test]
fn a_linked_sibling_symbol_carries_the_real_path_as_its_file_id() {
    let root = TempDir::new("scanner-bundle-linked-sibling");
    root.write("lib/colors.ts", "export interface Color { c: number }\n");
    root.write("src/app.ts", "export interface App { a: number }\n");
    symlink("../lib", root.path().join("src/palette")).expect("linked sibling");

    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: root.path().to_path_buf(),
        include: vec!["**/*.ts".to_string()],
    })
    .expect("scan should complete");

    let color_files: Vec<&str> = bundle
        .symbols
        .values()
        .filter(|symbol| symbol.name == "Color")
        .map(|symbol| symbol.file_id.as_str())
        .collect();
    assert_eq!(color_files, ["lib/colors.ts"]);
}
