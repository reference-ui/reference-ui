//! Shared filesystem fixtures for Rust tests (temp dirs under the system temp path).
//! Each fixture owns its root and removes it on drop. A root name carries the process id, a clock
//! stamp and a process-wide sequence number, so tests that share a prefix never share a directory.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

/// Counts the roots this process has made. Threads that start on the same clock tick read the
/// same stamp, so the stamp alone cannot keep two names apart.
static NEXT_ROOT: AtomicU64 = AtomicU64::new(0);

pub(crate) struct TempDir {
    path: PathBuf,
}

impl TempDir {
    pub(crate) fn new(prefix: &str) -> Self {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time should move forward")
            .as_nanos();
        let sequence = NEXT_ROOT.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "reference-ui-{prefix}-{}-{stamp}-{sequence}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("temp dir should be created");
        Self { path }
    }

    pub(crate) fn path(&self) -> &Path {
        &self.path
    }

    pub(crate) fn write(&self, relative_path: &str, contents: &str) {
        let path = self.path.join(relative_path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("parent dir should be created");
        }
        fs::write(path, contents).expect("fixture file should be written");
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

#[cfg(test)]
mod tests {
    use super::TempDir;
    use std::collections::HashSet;
    use std::sync::{Arc, Barrier};
    use std::thread;

    const ROUNDS: usize = 20;
    const THREADS: usize = 16;
    const CALLS_PER_THREAD: usize = 16;
    const PREFIX: &str = "same-prefix";

    /// Every thread waits on one barrier, then makes a tight burst of roots with one prefix. The
    /// roots come back alive, so a shared path shows up as a duplicate, not as a deleted tree.
    fn roots_from_threads() -> Vec<TempDir> {
        let start = Arc::new(Barrier::new(THREADS));
        let handles: Vec<_> = (0..THREADS)
            .map(|_| {
                let start = Arc::clone(&start);
                thread::spawn(move || {
                    start.wait();
                    (0..CALLS_PER_THREAD)
                        .map(|_| TempDir::new(PREFIX))
                        .collect::<Vec<_>>()
                })
            })
            .collect();
        handles
            .into_iter()
            .flat_map(|handle| handle.join().expect("temp root thread"))
            .collect()
    }

    #[test]
    fn same_prefix_roots_never_share_a_path() {
        for round in 0..ROUNDS {
            let mut roots: Vec<TempDir> = (0..CALLS_PER_THREAD)
                .map(|_| TempDir::new(PREFIX))
                .collect();
            roots.extend(roots_from_threads());
            let paths: HashSet<_> = roots.iter().map(|root| root.path().to_path_buf()).collect();
            assert_eq!(
                paths.len(),
                roots.len(),
                "round {round}: temp roots with one prefix shared a path"
            );
        }
    }
}
