//! FIFO tests for the disk walk and the native scan.
//! A FIFO named like a source must never be opened, since opening one blocks until a writer appears. Each test makes
//! the FIFO at runtime with `mkfifo`, because git cannot hold one, and runs the read in a thread bounded by a 5 s
//! `recv_timeout`, so a walk that opens it fails by name instead of hanging the suite. Compiled only under `cfg(test)`
//! as a child of `sources::tests`, and unix-only because FIFOs are.

#![cfg(unix)]

use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;

use super::{scan_request, temp_root};
use super::gathered as gather;
use crate::CompileRequest;

/// How long a read may run before the test calls it blocked.
const BLOCK_LIMIT: Duration = Duration::from_secs(5);

/// A temp tree holding `src/a.ts` and a FIFO at `src/pipe.ts`; returns the root and the FIFO path.
fn write_fifo_tree(name: &str) -> (PathBuf, PathBuf) {
    let root = temp_root(name);
    std::fs::create_dir_all(root.join("src")).unwrap();
    std::fs::write(root.join("src/a.ts"), "export const a = 1;\n").unwrap();
    let pipe = root.join("src/pipe.ts");
    make_fifo(&pipe);
    (root, pipe)
}

/// Makes a FIFO at `path` with the system `mkfifo`.
fn make_fifo(path: &Path) {
    let status = std::process::Command::new("mkfifo").arg(path).status().unwrap();
    assert!(status.success(), "mkfifo failed for {}", path.display());
}

/// Runs `work` in a thread and returns its result, failing when it has not finished inside the limit.
fn bounded<T: Send + 'static>(work: impl FnOnce() -> T + Send + 'static) -> T {
    let (send, recv) = mpsc::channel();
    std::thread::spawn(move || {
        let _ = send.send(work());
    });
    recv.recv_timeout(BLOCK_LIMIT).expect("the read blocked on a FIFO")
}

/// The disk walk lists `a.ts` and skips the FIFO named `pipe.ts` without opening it.
#[test]
fn gather_skips_a_fifo_named_like_a_source() {
    let (root, _pipe) = write_fifo_tree("fifo-gather");
    let root_str = root.to_string_lossy().to_string();
    let request = CompileRequest { root_dir: Some(root_str.clone()), ..Default::default() };
    let paths: Vec<String> = bounded(move || gather(&request)).into_iter().map(|(path, _)| path).collect();
    assert_eq!(paths, [format!("{root_str}/src/a.ts")]);
    std::fs::remove_dir_all(&root).unwrap();
}

/// The native scan handed a FIFO path returns without opening it, and retains nothing for it.
#[test]
fn scan_returns_on_a_fifo_path() {
    let (root, pipe) = write_fifo_tree("fifo-scan");
    let root_str = root.to_string_lossy().to_string();
    let request = scan_request(vec![pipe.to_string_lossy().to_string()], &root_str, Vec::new(), false);
    let response = bounded(move || crate::scan::scan(&request));
    assert_eq!(response.retained_count, 0);
    std::fs::remove_dir_all(&root).unwrap();
}
