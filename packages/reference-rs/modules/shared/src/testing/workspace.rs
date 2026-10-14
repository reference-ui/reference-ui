//! Process-safe scratch filesystem workspace helper for Rust unit tests.
//! Provides an RAII-managed temporary directory under the system or workspace temp tree.
//! Automatically cleans up all written artifacts when dropped to prevent test pollution.
//! Each path carries the process id, a clock stamp and a process-wide sequence number, so tests
//! that share a name and start on the same clock tick still get directories of their own.
//! Used across domain crates to construct hermetic module and package fixtures.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

/// Counts the workspaces this process has made. Threads that start on the same clock tick read
/// the same stamp, so the stamp alone cannot keep two names apart.
static NEXT_WORKSPACE: AtomicU64 = AtomicU64::new(0);

/// RAII wrapper around a scratch directory that cleans up upon drop.
pub struct ScratchWorkspace {
    path: PathBuf,
}

impl ScratchWorkspace {
    /// Creates a new scratch workspace with the given name prefix.
    pub fn new(name: &str) -> Self {
        Self::new_in(&std::env::temp_dir(), name, "reference-rs")
    }

    /// Creates a new scratch workspace inside a specific base directory.
    pub fn new_in(base_dir: &Path, name: &str, prefix: &str) -> Self {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        let sequence = NEXT_WORKSPACE.fetch_add(1, Ordering::Relaxed);
        let path = base_dir.join(format!(
            "{prefix}-{name}-{}-{stamp}-{sequence}",
            std::process::id()
        ));
        let _ = fs::create_dir_all(&path);
        Self { path }
    }

    /// Writes a file at the given relative path within the scratch workspace.
    pub fn write(&self, relative_path: &str, content: &str) {
        let file_path = self.path.join(relative_path);
        if let Some(parent) = file_path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::write(file_path, content);
    }

    /// Returns the absolute path to the root of the scratch workspace.
    pub fn root(&self) -> &Path {
        &self.path
    }
}

impl Drop for ScratchWorkspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

#[cfg(test)]
mod tests {
    use super::ScratchWorkspace;
    use std::collections::HashSet;
    use std::sync::{Arc, Barrier};
    use std::thread;

    const ROUNDS: usize = 20;
    const THREADS: usize = 16;

    /// One round releases every thread at once, so they read the clock on the same tick.
    fn workspaces_started_together(name: &str) -> Vec<ScratchWorkspace> {
        let start = Arc::new(Barrier::new(THREADS));
        let handles: Vec<_> = (0..THREADS)
            .map(|_| {
                let start = Arc::clone(&start);
                let name = name.to_string();
                thread::spawn(move || {
                    start.wait();
                    ScratchWorkspace::new(&name)
                })
            })
            .collect();
        handles
            .into_iter()
            .map(|handle| handle.join().expect("workspace thread"))
            .collect()
    }

    #[test]
    fn same_name_workspaces_started_together_never_share_a_path() {
        for round in 0..ROUNDS {
            let workspaces = workspaces_started_together("same-name");
            let paths: HashSet<_> = workspaces.iter().map(|w| w.root().to_path_buf()).collect();
            assert_eq!(
                paths.len(),
                THREADS,
                "round {round}: workspaces shared a path"
            );
        }
    }
}
