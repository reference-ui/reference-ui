//! Filesystem behavior: MemoryFs trees with links, plus DiskFs smoke and FIFO tests.
//!
//! Pins reads, implicit dirs, sorted listings, and symlink resolution —
//! relative links, links through parent dirs, dangling links reading as
//! missing, and loops failing closed. DiskFs gets one real-tempdir pass
//! proving it is the same trait against real files, and a unix-only pass
//! proving a FIFO named tsconfig.json or package.json reads as missing.

mod common;

use module_graph::{DiskFs, FileSystem, MemoryFs};

#[test]
fn files_round_trip_and_missing_reads_as_none() {
    let fs = common::fs(&[("/p/src/a.ts", "export const x = 1;")]);
    assert_eq!(
        fs.read_to_string("/p/src/a.ts").as_deref(),
        Some("export const x = 1;")
    );
    assert_eq!(fs.read_to_string("/p/src/missing.ts"), None);
    assert!(fs.is_file("/p/src/a.ts"));
    assert!(!fs.is_file("/p/src/missing.ts"));
}

#[test]
fn dirs_are_implicit_and_nested() {
    let fs = common::fs(&[("/p/src/ui/a.ts", "x")]);
    assert!(fs.is_dir("/p/src"));
    assert!(fs.is_dir("/p/src/ui"));
    assert!(!fs.is_dir("/p/src/ui/a.ts"));
    assert!(!fs.is_dir("/p/elsewhere"));
    assert!(!fs.is_file("/p/src"));
}

#[test]
fn read_dir_lists_sorted_children() {
    let fs = common::fs(&[
        ("/p/src/b.ts", "b"),
        ("/p/src/a.ts", "a"),
        ("/p/src/ui/c.ts", "c"),
    ]);
    assert_eq!(
        fs.read_dir("/p/src"),
        vec![
            "/p/src/a.ts".to_string(),
            "/p/src/b.ts".to_string(),
            "/p/src/ui".to_string(),
        ]
    );
    assert!(fs.read_dir("/p/missing").is_empty());
    assert!(fs.read_dir("/p/src/a.ts").is_empty());
}

#[test]
fn symlinks_to_files_and_dirs_resolve() {
    let mut fs = common::fs(&[("/real/tokens.ts", "t"), ("/real/nested/deep.ts", "d")]);
    fs.symlink("/p/link.ts", "/real/tokens.ts");
    fs.symlink("/p/dir", "/real/nested");
    assert_eq!(fs.read_to_string("/p/link.ts").as_deref(), Some("t"));
    assert!(fs.is_file("/p/link.ts"));
    assert!(fs.is_dir("/p/dir"));
    assert_eq!(fs.read_to_string("/p/dir/deep.ts").as_deref(), Some("d"));
    assert_eq!(fs.read_dir("/p/dir"), vec!["/p/dir/deep.ts".to_string()]);
    assert_eq!(
        fs.canonicalize("/p/link.ts").as_deref(),
        Some("/real/tokens.ts")
    );
}

#[test]
fn relative_links_resolve_against_the_link_dir() {
    let mut fs = common::fs(&[("/p/src/tokens.ts", "t")]);
    fs.symlink("/p/src/link.ts", "./tokens.ts");
    assert_eq!(fs.read_to_string("/p/src/link.ts").as_deref(), Some("t"));
    assert_eq!(
        fs.canonicalize("/p/src/link.ts").as_deref(),
        Some("/p/src/tokens.ts")
    );
}

#[test]
fn dangling_links_and_loops_fail_closed() {
    let mut fs = common::fs(&[("/p/src/a.ts", "a")]);
    fs.symlink("/p/src/dangle.ts", "/nowhere/gone.ts");
    fs.symlink("/p/src/loop-a", "/p/src/loop-b");
    fs.symlink("/p/src/loop-b", "/p/src/loop-a");
    assert_eq!(fs.read_to_string("/p/src/dangle.ts"), None);
    assert!(!fs.is_file("/p/src/dangle.ts"));
    assert!(!fs.is_dir("/p/src/dangle.ts"));
    assert_eq!(fs.canonicalize("/p/src/dangle.ts"), None);
    assert_eq!(fs.canonicalize("/p/src/loop-a"), None);
    assert!(fs.read_dir("/p/src/dangle.ts").is_empty());
}

#[test]
fn disk_fs_matches_memory_semantics_on_real_files() {
    let root = std::env::temp_dir().join(format!("module-graph-fs-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(root.join("src")).expect("fixture dir");
    std::fs::write(root.join("src/a.ts"), "a").expect("fixture file");
    let fs = DiskFs;
    let file = root.join("src/a.ts").to_string_lossy().replace('\\', "/");
    let dir = root.join("src").to_string_lossy().replace('\\', "/");
    assert_eq!(fs.read_to_string(&file).as_deref(), Some("a"));
    assert!(fs.is_file(&file));
    assert!(fs.is_dir(&dir));
    assert_eq!(fs.read_dir(&dir), vec![file.clone()]);
    assert!(fs.canonicalize(&file).is_some());
    assert_eq!(fs.read_to_string(&format!("{dir}/missing.ts")), None);
    let _ = std::fs::remove_dir_all(&root);
}

#[test]
fn empty_tree_has_no_filesystem() {
    let fs = MemoryFs::new();
    assert!(!fs.is_file("/p/a.ts"));
    assert!(!fs.is_dir("/p"));
    assert!(fs.read_dir("/p").is_empty());
}

/// DiskFs reads a FIFO named tsconfig.json or package.json as missing without opening it,
/// since opening one blocks until a writer appears. The read runs in a thread bounded by
/// a 5 s `recv_timeout`, so a read that opens the FIFO fails by name instead of hanging.
#[cfg(unix)]
#[test]
fn disk_fs_reads_a_fifo_manifest_as_missing() {
    let root = std::env::temp_dir().join(format!("module-graph-fifo-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    std::fs::create_dir_all(&root).expect("fixture dir");
    for name in ["tsconfig.json", "package.json"] {
        let pipe = root.join(name);
        let status = std::process::Command::new("mkfifo").arg(&pipe).status().expect("mkfifo");
        assert!(status.success(), "mkfifo failed for {}", pipe.display());
        let path = pipe.to_string_lossy().replace('\\', "/");
        let (send, recv) = std::sync::mpsc::channel();
        std::thread::spawn(move || {
            let _ = send.send(DiskFs.read_to_string(&path));
        });
        let read = recv
            .recv_timeout(std::time::Duration::from_secs(5))
            .expect("the read blocked on a FIFO");
        assert_eq!(read, None, "{name}");
    }
    let _ = std::fs::remove_dir_all(&root);
}
