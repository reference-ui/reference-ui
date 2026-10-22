//! Dangling and looping symlinks under the scan include.
//! The walk skips a link whose target is gone and cuts a link that closes a loop, so one such link cannot fail the types build.
//! Each test builds a temp tree and drives `scan_workspace`, the same path the types build takes.

use std::os::unix::fs::symlink;

use super::super::scan_workspace;
use crate::tests::fixtures::TempDir;

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
