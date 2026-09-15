//! Process-safe scratch filesystem workspace helper for Rust unit tests.
//! Provides an RAII-managed temporary directory under the system or workspace temp tree.
//! Automatically cleans up all written artifacts when dropped to prevent test pollution.
//! Used across domain crates to construct hermetic module and package fixtures.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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
        let path = base_dir.join(format!("{prefix}-{name}-{}-{stamp}", std::process::id()));
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
