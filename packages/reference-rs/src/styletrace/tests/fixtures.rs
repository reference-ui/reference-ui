//! Shared test fixtures for styletrace resolver and analysis tests.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub(super) struct ScratchDir {
    path: PathBuf,
}

impl ScratchDir {
    pub(super) fn new(name: &str) -> Self {
        Self::new_in(&std::env::temp_dir(), name, "reference-rs-styletrace")
    }

    pub(super) fn new_in(base_dir: &Path, name: &str, prefix: &str) -> Self {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("expected current time")
            .as_nanos();
        let path = base_dir.join(format!(
            "{prefix}-{name}-{}-{stamp}",
            std::process::id()
        ));
        fs::create_dir_all(&path).expect("expected scratch dir to be created");
        Self { path }
    }

    pub(super) fn write(&self, relative_path: &str, content: &str) {
        let file_path = self.path.join(relative_path);
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).expect("expected parent dir to be created");
        }
        fs::write(file_path, content).expect("expected fixture file to be written");
    }

    pub(super) fn root(&self) -> &Path {
        &self.path
    }
}

impl Drop for ScratchDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

pub(super) fn styletrace_case_input(case_name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("styletrace")
        .join("cases")
        .join(case_name)
        .join("input")
}

pub(super) fn workspace_fixture_dir(relative_path: &str) -> PathBuf {
    workspace_root()
        .join(relative_path)
}

pub(super) fn workspace_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(|path| path.parent())
        .expect("expected workspace root")
        .to_path_buf()
}

pub(super) fn workspace_scratch_dir(name: &str) -> ScratchDir {
    let base_dir = workspace_root().join("target").join("styletrace-tests");
    fs::create_dir_all(&base_dir).expect("expected workspace scratch base dir");
    ScratchDir::new_in(&base_dir, name, "reference-rs-styletrace-workspace")
}
