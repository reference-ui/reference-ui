//! Disk-walk and union tests: the disk scan keeps the live set, provided-everything plus a root equals
//! the bare scan, symlinks keep their stat verdicts on both walks, and roots compare by normalized
//! candidate. Each test runs `gather` directly over a temp tree and compares sorted pairs. Compiled
//! only under `cfg(test)` as a child of `sources::tests`.

use super::{sorted, temp_root, write_tricky_tree};
use crate::sources::gather::gather;
use crate::sources::request::same_root;
use crate::{CompileRequest, VirtualSource};

/// The disk scan keeps live sources, dotfiles, and d.ts files while
/// dropping IGNORE dirs and non-source extensions.
#[test]
fn disk_scan_pins_the_tricky_set() {
    let (root, root_str) = write_tricky_tree("scan");
    let request = CompileRequest {
        root_dir: Some(root_str.clone()),
        ..Default::default()
    };
    let paths: Vec<String> = sorted(gather(&request))
        .into_iter()
        .map(|(path, _)| path)
        .collect();
    assert_eq!(
        paths,
        [
            format!("{root_str}/src/.hidden.ts"),
            format!("{root_str}/src/a.ts"),
            format!("{root_str}/src/t.d.ts"),
        ]
    );
    std::fs::remove_dir_all(&root).unwrap();
}

/// Provided-everything plus a root equals the bare disk scan, and a
/// provided subset backfills the missing disk paths to the same set.
#[test]
fn provided_union_matches_the_disk_scan() {
    let (root, root_str) = write_tricky_tree("union");
    let scanned = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        ..Default::default()
    }));
    let all = scanned
        .iter()
        .map(|(path, content)| VirtualSource {
            path: path.clone(),
            content: content.clone(),
        })
        .collect::<Vec<_>>();
    let full = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        files: Some(all.clone()),
        ..Default::default()
    }));
    assert_eq!(full, scanned);
    let subset = sorted(gather(&CompileRequest {
        root_dir: Some(root_str.clone()),
        files: Some(all[..1].to_vec()),
        ..Default::default()
    }));
    assert_eq!(subset, scanned);
    std::fs::remove_dir_all(&root).unwrap();
}

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

/// Roots compare by the scope's candidate normalization: separators,
/// prefixes, and trailing slashes never split one directory in two.
#[test]
fn same_root_normalizes_before_comparing() {
    assert!(same_root("/tmp/x", "/tmp/x/"));
    assert!(same_root("C:\\r", "C:/r"));
    assert!(same_root("./r", "r"));
    assert!(!same_root("/tmp/x", "/tmp/y"));
}

/// Provided files without a root keep legacy filter semantics exactly:
/// no walk, no backfill, scope-filtered handoff only.
#[test]
fn files_without_root_keep_legacy_semantics() {
    let provided = vec![
        VirtualSource {
            path: "/elsewhere/a.ts".to_string(),
            content: "export const a = 1;\n".to_string(),
        },
        VirtualSource {
            path: "/elsewhere/b.ts".to_string(),
            content: "export const b = 2;\n".to_string(),
        },
    ];
    let request = CompileRequest {
        files: Some(provided.clone()),
        ..Default::default()
    };
    let gathered = sorted(gather(&request));
    let expected = sorted(
        provided
            .into_iter()
            .map(|file| (file.path, file.content))
            .collect(),
    );
    assert_eq!(gathered, expected);
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
