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

/// Links keep stat-everything verdicts on both walks: linked dirs
/// descend, linked files carry target bytes, dangling links drop, and
/// the union backfill completes a provided subset to the same set.
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
            format!("{root_str}/src/linkdir/a.ts"),
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
