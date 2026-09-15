//! Provides shared test fixtures and temporary directory helpers for styletrace resolver and analysis tests.
//! It takes raw source code strings or mock module structures and writes them to a temporary file system.
//! Manages the lifecycle of these temporary environments to ensure tests run in isolation.
//! Emits path structures and environment contexts that tests can use for verification.

use std::fs;
use std::path::PathBuf;

pub(super) type ScratchDir = shared::testing::ScratchWorkspace;

pub(super) fn workspace_fixture_dir(relative_path: &str) -> PathBuf {
    workspace_root().join(relative_path)
}

pub(super) fn workspace_root() -> PathBuf {
    let mut dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    while !dir.join("pnpm-workspace.yaml").exists() {
        if !dir.pop() {
            panic!("expected workspace root containing pnpm-workspace.yaml");
        }
    }
    dir
}

pub(super) fn workspace_sync_root() -> PathBuf {
    workspace_root().join("packages").join("reference-lib")
}

pub(super) fn workspace_scratch_dir(name: &str) -> ScratchDir {
    let base_dir = workspace_root().join("target").join("styletrace-tests");
    fs::create_dir_all(&base_dir).expect("expected workspace scratch base dir");
    ScratchDir::new_in(&base_dir, name, "reference-rs-styletrace-workspace")
}
