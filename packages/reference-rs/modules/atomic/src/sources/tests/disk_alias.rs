//! Alias-aware symlink walk tests over a temp tree.
//! A file reached only through a link that closes a loop is listed under that link, and a link-only directory that re-enters itself in a new include state lists its file under the loop alias that sorts first. Cliques, lattices, brace alternatives and negations each list every file once, under the first in-scope path in walk order. A real directory beneath a link is cut when its (directory, state) pair was already visited, as the link is. Each walk runs on its own thread with a budget, so a walk that never finishes fails its test by name instead of stalling the suite. Compiled only under `cfg(test)` as a child of `sources::tests`, and unix-only because links need symlink privileges.

#![cfg(unix)]

use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;

use super::temp_root;
use crate::sources::gather::gather;
use crate::CompileRequest;

/// How long one walk may run before its test fails by name.
const WALK_BUDGET: Duration = Duration::from_secs(10);

/// The temp roots a test made, removed when the test ends, including when an assertion panics.
struct TempRoots(Vec<PathBuf>);

impl Drop for TempRoots {
    fn drop(&mut self) {
        for root in &self.0 {
            let _ = std::fs::remove_dir_all(root);
        }
    }
}

/// Writes each `(relative path, content)` pair under `root`, creating the parent folders.
fn write_files(root: &Path, files: &[(&str, &str)]) {
    for (rel, content) in files {
        let path = root.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, content).unwrap();
    }
}

/// Gathers `root` under `include` on its own thread and returns the listed paths in walk order, real paths before
/// link aliases. A walk still running after `WALK_BUDGET` fails the test.
fn listed_in_walk_order(root: &Path, include: &[&str]) -> Vec<String> {
    let root_str = root.to_string_lossy().into_owned();
    let patterns: Vec<String> = include.iter().map(|pattern| pattern.to_string()).collect();
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let request = CompileRequest {
            root_dir: Some(root_str),
            include: (!patterns.is_empty()).then_some(patterns),
            ..Default::default()
        };
        let _ = tx.send(gather(&request));
    });
    match rx.recv_timeout(WALK_BUDGET) {
        Ok(sources) => sources.into_iter().map(|(path, _)| path).collect(),
        Err(_) => panic!("the walk did not finish within {WALK_BUDGET:?}"),
    }
}

/// `src/a/up` links back to `src`, a directory the walk entered under a different include state, so the link is walked
/// and `src/a/up/x.ts` is the only in-scope path to `x.ts`. It is listed under the link, after the real `src/a/y.ts`.
#[test]
fn a_file_reached_only_through_a_loop_link_is_listed_under_that_link() {
    let root = temp_root("loop-only");
    let _roots = TempRoots(vec![root.clone()]);
    write_files(
        &root,
        &[("src/x.ts", "export const x = 1;\n"), ("src/a/y.ts", "export const y = 1;\n")],
    );
    std::os::unix::fs::symlink("..", root.join("src/a/up")).unwrap();
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/a/**/*.ts"]),
        [format!("{root_str}/src/a/y.ts"), format!("{root_str}/src/a/up/x.ts")]
    );
}

/// Five directories that each link to the other four and hold one file: every file is listed once, under its real path.
#[test]
fn a_five_directory_link_clique_lists_each_file_once_under_its_real_path() {
    const DIRS: usize = 5;
    let root = temp_root("clique-5");
    let _roots = TempRoots(vec![root.clone()]);
    for dir in 0..DIRS {
        write_files(&root, &[(&format!("src/d{dir}/f{dir}.ts"), "export const f = 1;\n")]);
    }
    for from in 0..DIRS {
        for to in (0..DIRS).filter(|to| *to != from) {
            std::os::unix::fs::symlink(format!("../d{to}"), root.join(format!("src/d{from}/to_d{to}")))
                .unwrap();
        }
    }
    let root_str = root.to_string_lossy().into_owned();
    let mut listed = listed_in_walk_order(&root, &["src/**/*.ts"]);
    listed.sort();
    let expected: Vec<String> = (0..DIRS).map(|dir| format!("{root_str}/src/d{dir}/f{dir}.ts")).collect();
    assert_eq!(listed, expected);
}

/// Eight levels of two directories, each linked to both directories of the level above and the level below. The one
/// file sits at the bottom (`src/g7/a/x.ts`), so the walk lists it once, under its real path, and finishes.
#[test]
fn a_two_wide_lattice_of_eight_levels_lists_its_file_once() {
    const LEVELS: usize = 8;
    let root = temp_root("lattice-8");
    let _roots = TempRoots(vec![root.clone()]);
    write_files(&root, &[("src/g7/a/x.ts", "export const x = 1;\n")]);
    for level in 0..LEVELS {
        for side in ["a", "b"] {
            std::fs::create_dir_all(root.join(format!("src/g{level}/{side}"))).unwrap();
        }
    }
    for level in 0..LEVELS {
        let neighbours = [level.checked_sub(1), Some(level + 1).filter(|next| *next < LEVELS)];
        for side in ["a", "b"] {
            let dir = root.join(format!("src/g{level}/{side}"));
            for neighbour in neighbours.into_iter().flatten() {
                for target in ["a", "b"] {
                    std::os::unix::fs::symlink(
                        format!("../../g{neighbour}/{target}"),
                        dir.join(format!("g{neighbour}{target}")),
                    )
                    .unwrap();
                }
            }
        }
    }
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/**/*.ts"]),
        [format!("{root_str}/src/g7/a/x.ts")]
    );
}

/// The include `src/**/*.ts` with `!src/a/**` keeps `src/a/f.ts` out, but `src/b -> a` admits the same file under
/// `src/b/`, which the negation does not name, so `src/b/f.ts` is listed.
#[test]
fn a_link_into_a_negated_directory_lists_the_file_the_negation_does_not_name() {
    let root = temp_root("negation-key");
    let _roots = TempRoots(vec![root.clone()]);
    write_files(&root, &[("src/a/f.ts", "export const f = 1;\n")]);
    std::os::unix::fs::symlink("a", root.join("src/b")).unwrap();
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/**/*.ts", "!src/a/**"]),
        [format!("{root_str}/src/b/f.ts")]
    );
}

/// `src/{a,b}/**/x.ts` expands to two alternatives. `src/a/up` and `src/b/up` both loop back to `src`, and each
/// alternative reaches `src/x.ts` through its own alias: `x.ts` is listed once, under the first alias in walk order.
#[test]
fn a_loop_under_each_brace_alternative_lists_the_shared_file_once() {
    let root = temp_root("brace-loop");
    let _roots = TempRoots(vec![root.clone()]);
    write_files(&root, &[("src/x.ts", "export const x = 1;\n")]);
    std::fs::create_dir_all(root.join("src/a")).unwrap();
    std::fs::create_dir_all(root.join("src/b")).unwrap();
    std::os::unix::fs::symlink("..", root.join("src/a/up")).unwrap();
    std::os::unix::fs::symlink("..", root.join("src/b/up")).unwrap();
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/{a,b}/**/x.ts"]),
        [format!("{root_str}/src/a/up/x.ts")]
    );
}

/// `src/d` is link-only: `a -> .` re-enters `src/d` in a new state under `src/d/a/**/y.ts`, and `f` links to a directory
/// holding `y.ts`. The file is reached as `src/d/a/f/y.ts` and as `src/d/f/y.ts`; the loop alias sorts first, so it is listed.
#[test]
fn a_self_link_that_changes_state_lists_its_file_under_the_loop_alias_that_sorts_first() {
    let root = temp_root("self-link");
    let outside = temp_root("self-link-outside");
    let _roots = TempRoots(vec![root.clone(), outside.clone()]);
    write_files(&outside, &[("y.ts", "export const y = 1;\n")]);
    std::fs::create_dir_all(root.join("src/d")).unwrap();
    std::os::unix::fs::symlink(".", root.join("src/d/a")).unwrap();
    std::os::unix::fs::symlink(&outside, root.join("src/d/f")).unwrap();
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/d/**/y.ts", "src/d/a/**/y.ts"]),
        [format!("{root_str}/src/d/a/f/y.ts")]
    );
}

/// `src/c/l2` links back to `src`, which the `!src/zz/**` negation keeps in a state the real `src/c` does not share, so the
/// link is walked. The real `src/c` beneath it then repeats a (directory, state) pair already visited, so the walk cuts
/// there and `a.ts` is listed once, under `src/c/l5`, not under `src/c/l2/c/l5`.
#[test]
fn a_real_directory_beneath_a_link_is_cut_when_its_pair_was_visited() {
    let root = temp_root("beneath-link");
    let _roots = TempRoots(vec![root.clone()]);
    write_files(&root, &[("lib/a.ts", "export const a = 1;\n")]);
    std::fs::create_dir_all(root.join("src/c")).unwrap();
    std::os::unix::fs::symlink("..", root.join("src/c/l2")).unwrap();
    std::os::unix::fs::symlink("../../lib", root.join("src/c/l5")).unwrap();
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/**/*.ts", "!src/zz/**"]),
        [format!("{root_str}/src/c/l5/a.ts")]
    );
}

/// `!src/b` and `!src/l0` name a directory and a directory link, not anything beneath them, so the walk descends into both.
/// `src/b/y.ts` is listed under its real path and `lib/x.ts` under the link alias `src/l0/x.ts`.
#[test]
fn a_bare_negation_drops_only_its_own_path() {
    let root = temp_root("bare-negation");
    let _roots = TempRoots(vec![root.clone()]);
    write_files(
        &root,
        &[("src/b/y.ts", "export const y = 1;\n"), ("lib/x.ts", "export const x = 1;\n")],
    );
    std::os::unix::fs::symlink("../lib", root.join("src/l0")).unwrap();
    let root_str = root.to_string_lossy().into_owned();
    assert_eq!(
        listed_in_walk_order(&root, &["src/**/*.ts", "!src/b", "!src/l0"]),
        [format!("{root_str}/src/b/y.ts"), format!("{root_str}/src/l0/x.ts")]
    );
}
