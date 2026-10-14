//! Dangling symlinks under the scan include: the walk skips a link whose target is gone and keeps the rest of
//! the scope, so one dead link cannot fail the types build. A symlink loop is not dangling and still fails the
//! walk. Each test builds a temp tree and drives `scan_workspace`, the same path the types build takes.

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
fn scan_workspace_still_fails_a_symlink_loop_under_include() {
    let root = TempDir::new("scanner-workspace-link-loop");
    root.write("theme/a.ts", "export interface Alpha { a: number }\n");
    symlink("..", root.path().join("theme/loop")).expect("loop symlink");

    let err = scan_workspace(root.path(), &["theme/**/*.ts".to_string()])
        .err()
        .expect("a symlink loop is not dangling and still fails the walk");
    assert!(err.contains("failed to walk scan root"), "{err}");
}
