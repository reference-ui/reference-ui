//! Symlink walk tests over a temp tree.
//! Loops end at the link that closes them, links into and out of the include scope list their files once, shared targets are claimed once, and links under engine-ignored directories are never walked. Each test builds real links, gathers through `gather`, and compares the listed paths. Compiled only under `cfg(test)` as a child of `sources::tests`; every test here is unix-only because links need symlink privileges.

use super::{sorted, temp_root};
use crate::sources::gather::gather;
use crate::{CompileRequest, VirtualSource};

/// Symlink tree: a real dir plus a linked dir, a linked file carrying
/// the target's bytes, and a dangling link. Unix-only: links need
/// symlink privileges the portable suite cannot assume.
#[cfg(unix)]
fn write_symlink_tree(name: &str) -> (std::path::PathBuf, String) {
    let root = temp_root(name);
    std::fs::create_dir_all(root.join("src/real")).unwrap();
    std::fs::write(root.join("src/real/a.ts"), "export const a = 1;\n").unwrap();
    std::os::unix::fs::symlink(root.join("src/real"), root.join("src/linkdir")).unwrap();
    std::os::unix::fs::symlink(root.join("src/real/a.ts"), root.join("src/linkfile.ts"))
        .unwrap();
    std::os::unix::fs::symlink(root.join("src/missing.ts"), root.join("src/dangling.ts"))
        .unwrap();
    let root_str = root.to_string_lossy().to_string();
    (root, root_str)
}

/// Links keep stat-everything verdicts on both walks: a linked file carries
/// target bytes, dangling links drop, and the union backfill completes a
/// provided subset to the same set. A linked directory whose target is also
/// a real directory in the tree lists the shared file once, under the real
/// path, so `src/linkdir/a.ts` is not listed beside `src/real/a.ts`.
#[cfg(unix)]
#[test]
fn symlinks_keep_stat_verdicts_on_both_walks() {
    let (root, root_str) = write_symlink_tree("symlinks");
    let scanned = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        ..Default::default()
    }));
    let paths: Vec<String> = scanned
        .iter()
        .map(|(path, _)| path.clone())
        .collect();
    assert_eq!(
        paths,
        [
            format!("{root_str}/src/linkfile.ts"),
            format!("{root_str}/src/real/a.ts"),
        ]
    );
    let linked = scanned
        .iter()
        .find(|(path, _)| path.ends_with("linkfile.ts"))
        .unwrap();
    assert_eq!(linked.1, "export const a = 1;\n");
    let all = scanned
        .iter()
        .map(|(path, content)| VirtualSource {
            path: path.clone(),
            content: content.clone(),
        })
        .collect::<Vec<_>>();
    let subset = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        files: Some(all[..1].to_vec()),
        ..Default::default()
    }));
    assert_eq!(subset, scanned);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Writes each `(relative path, content)` pair under `root`, creating the parent folders.
#[cfg(unix)]
fn write_files(root: &std::path::Path, files: &[(&str, &str)]) {
    for (rel, content) in files {
        let path = root.join(rel);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, content).unwrap();
    }
}

/// The listed paths in walk-independent order, for comparisons that name each file once.
#[cfg(unix)]
fn listed_paths(sources: &[(String, String)]) -> Vec<String> {
    sorted(sources.to_vec()).into_iter().map(|(path, _)| path).collect()
}

/// A linked sibling outside the include scope: `lib/` is a real directory the scope rejects, so its
/// colour reaches the list only through `src/palette`, once.
#[cfg(unix)]
#[test]
fn linked_sibling_outside_scope_is_listed_once_through_its_link() {
    let root = temp_root("sibling-out");
    write_files(&root, &[("src/app.ts", "export const a = 1;\n"), ("lib/colors.ts", "export const c = 2;\n")]);
    std::os::unix::fs::symlink(root.join("lib"), root.join("src/palette")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/**/*.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(
        listed_paths(&scanned),
        [format!("{root_str}/src/app.ts"), format!("{root_str}/src/palette/colors.ts")]
    );
    std::fs::remove_dir_all(&root).unwrap();
}

/// A linked sibling inside the scope: the real path lists the file, and the link to it lists nothing.
#[cfg(unix)]
#[test]
fn linked_sibling_in_scope_is_listed_once_under_its_real_path() {
    let root = temp_root("sibling-in");
    write_files(&root, &[("src/a/x.ts", "export const x = 1;\n")]);
    std::os::unix::fs::symlink(root.join("src/a"), root.join("src/b")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/**/*.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(listed_paths(&scanned), [format!("{root_str}/src/a/x.ts")]);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Two directories that link back to the root: the walk ends at each link that closes a loop, and the
/// real sources are listed once.
#[cfg(unix)]
#[test]
fn self_linked_directories_end_the_walk_at_the_link_that_closes_them() {
    let root = temp_root("loops");
    write_files(&root, &[("src/app.ts", "export const a = 1;\n")]);
    std::os::unix::fs::symlink(".", root.join("src/loopA")).unwrap();
    std::os::unix::fs::symlink(".", root.join("src/loopB")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/**/*.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(listed_paths(&scanned), [format!("{root_str}/src/app.ts")]);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Two links to one directory outside the project: the first link in walk order enters it, the second
/// is skipped, so the shared file is listed once under the first link.
#[cfg(unix)]
#[test]
fn two_links_to_one_target_list_its_files_once() {
    let root = temp_root("two-links");
    let outside = temp_root("two-links-outside");
    write_files(&outside, &[("x.ts", "export const x = 1;\n")]);
    write_files(&root, &[("src/keep.ts", "export const k = 1;\n")]);
    std::os::unix::fs::symlink(&outside, root.join("src/one")).unwrap();
    std::os::unix::fs::symlink(&outside, root.join("src/two")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/**/*.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(
        listed_paths(&scanned),
        [format!("{root_str}/src/keep.ts"), format!("{root_str}/src/one/x.ts")]
    );
    std::fs::remove_dir_all(&root).unwrap();
    std::fs::remove_dir_all(&outside).unwrap();
}

/// The union backfill claims a provided file's identity before the walk, so a second path to the same
/// file on disk is not appended beside the provided one.
#[cfg(unix)]
#[test]
fn union_backfill_does_not_relist_a_provided_file_under_a_link() {
    let root = temp_root("union-alias");
    write_files(&root, &[("src/a/x.ts", "export const x = 1;\n")]);
    std::os::unix::fs::symlink(root.join("src/a"), root.join("src/b")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let provided = vec![VirtualSource {
        path: format!("{root_str}/src/a/x.ts"),
        content: "export const x = 1;\n".to_string(),
    }];
    let merged = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        files: Some(provided),
        ..Default::default()
    });
    assert_eq!(listed_paths(&merged), [format!("{root_str}/src/a/x.ts")]);
    std::fs::remove_dir_all(&root).unwrap();
}

/// Two links to one external target: the link the include rejects (`lib/shared`, walked first) must not own the
/// target, or the in-scope link (`src/shared`) would list nothing. A target's file is listed under the first link
/// that admits it, so `x.ts` lists once, under `src/shared`.
#[cfg(unix)]
#[test]
fn an_out_of_scope_link_does_not_shadow_an_in_scope_link_to_the_same_target() {
    let root = temp_root("shadow");
    let outside = temp_root("shadow-outside");
    write_files(&outside, &[("x.ts", "export const x = 1;\n")]);
    write_files(
        &root,
        &[("src/app.ts", "export const a = 1;\n"), ("lib/keep.ts", "export const k = 1;\n")],
    );
    std::os::unix::fs::symlink(&outside, root.join("lib/shared")).unwrap();
    std::os::unix::fs::symlink(&outside, root.join("src/shared")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/**/*.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(
        listed_paths(&scanned),
        [format!("{root_str}/src/app.ts"), format!("{root_str}/src/shared/x.ts")]
    );
    std::fs::remove_dir_all(&root).unwrap();
    std::fs::remove_dir_all(&outside).unwrap();
}

/// Two in-scope links to one external target admit different files of it: each link lists the file its own pattern
/// admits, so `x.ts` lists under `src/a/shared` and `y.ts` under `src/b/shared`.
#[cfg(unix)]
#[test]
fn two_in_scope_links_each_list_the_files_they_admit() {
    let root = temp_root("partial");
    let outside = temp_root("partial-outside");
    write_files(&outside, &[("x.ts", "export const x = 1;\n"), ("y.ts", "export const y = 2;\n")]);
    write_files(&root, &[("src/a/keep.ts", "export const k = 1;\n")]);
    std::fs::create_dir_all(root.join("src/b")).unwrap();
    std::os::unix::fs::symlink(&outside, root.join("src/a/shared")).unwrap();
    std::os::unix::fs::symlink(&outside, root.join("src/b/shared")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/a/**/x.ts".to_string(), "src/b/**/y.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(
        listed_paths(&scanned),
        [format!("{root_str}/src/a/shared/x.ts"), format!("{root_str}/src/b/shared/y.ts")]
    );
    std::fs::remove_dir_all(&root).unwrap();
    std::fs::remove_dir_all(&outside).unwrap();
}

/// A link under an engine-ignored directory is never walked: `dist/alias` reaches the same outside target as
/// `src/alias`, but only the in-scope link lists its file.
#[cfg(unix)]
#[test]
fn a_link_under_an_engine_ignored_directory_is_never_walked() {
    let root = temp_root("engine-link");
    let outside = temp_root("engine-link-outside");
    write_files(&outside, &[("x.ts", "export const x = 1;\n")]);
    write_files(&root, &[("src/app.ts", "export const a = 1;\n"), ("dist/keep.ts", "export const k = 1;\n")]);
    std::os::unix::fs::symlink(&outside, root.join("dist/alias")).unwrap();
    std::os::unix::fs::symlink(&outside, root.join("src/alias")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["**/*.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(
        listed_paths(&scanned),
        [format!("{root_str}/src/alias/x.ts"), format!("{root_str}/src/app.ts")]
    );
    std::fs::remove_dir_all(&root).unwrap();
    std::fs::remove_dir_all(&outside).unwrap();
}

/// A file reached only through a link nested in a link target, under an alias that admits none of the target's direct
/// files: `outside/t` holds `d.ts` and a link `n` to `outside/u`, which holds `x.ts` and `y.ts`. Each alias of `t` admits
/// one nested file, so both must list: `x.ts` under `src/a/t`, `y.ts` under `src/b/t`.
#[cfg(unix)]
#[test]
fn a_file_reached_only_through_a_nested_link_is_listed_once() {
    let root = temp_root("nested-residual");
    let outside = temp_root("nested-residual-outside");
    write_files(&outside.join("u"), &[("x.ts", "export const x = 1;\n"), ("y.ts", "export const y = 2;\n")]);
    write_files(&outside.join("t"), &[("d.ts", "export const d = 1;\n")]);
    std::os::unix::fs::symlink(outside.join("u"), outside.join("t/n")).unwrap();
    std::fs::create_dir_all(root.join("src/a")).unwrap();
    std::fs::create_dir_all(root.join("src/b")).unwrap();
    std::os::unix::fs::symlink(outside.join("t"), root.join("src/a/t")).unwrap();
    std::os::unix::fs::symlink(outside.join("t"), root.join("src/b/t")).unwrap();
    let root_str = root.to_string_lossy().to_string();
    let scanned = gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        include: Some(vec!["src/a/t/n/x.ts".to_string(), "src/b/t/n/y.ts".to_string()]),
        ..Default::default()
    });
    assert_eq!(
        listed_paths(&scanned),
        [format!("{root_str}/src/a/t/n/x.ts"), format!("{root_str}/src/b/t/n/y.ts")]
    );
    std::fs::remove_dir_all(&root).unwrap();
    std::fs::remove_dir_all(&outside).unwrap();
}
