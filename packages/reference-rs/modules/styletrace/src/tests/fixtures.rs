//! Provides shared test fixtures and temporary directory helpers for styletrace resolver and analysis tests.
//! Writes scratch trees, resolves workspace fixture paths, and materializes committed station
//! `input/` folders (remapping `packages/` to `node_modules/`) so Rust tracing tests share
//! the same files as the Vitest station suite. Cleans up scratch directories on drop.

use std::fs;
use std::path::{Path, PathBuf};

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

pub(super) fn materialize_station(name: &str) -> ScratchDir {
    let from = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("cases")
        .join(name)
        .join("input");
    assert!(
        from.is_dir(),
        "expected committed station input at {}",
        from.display()
    );
    let scratch = workspace_scratch_dir(name);
    copy_station_input(&from, scratch.root(), "");
    scratch
}

fn copy_station_input(from: &Path, to: &Path, rel: &str) {
    let entries = fs::read_dir(from)
        .unwrap_or_else(|err| panic!("failed to read station input {}: {err}", from.display()));
    for entry in entries {
        let entry = entry.unwrap_or_else(|err| panic!("failed to read station entry: {err}"));
        let name = entry.file_name();
        let name = name.to_string_lossy();
        let child_rel = join_rel(rel, &name);
        let src = entry.path();
        if src.is_dir() {
            copy_station_input(&src, to, &child_rel);
            continue;
        }
        let dest = to.join(remap_packages(&child_rel));
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).expect("expected station parent dir");
        }
        fs::copy(&src, &dest).unwrap_or_else(|err| {
            panic!(
                "failed to copy {} -> {}: {err}",
                src.display(),
                dest.display()
            )
        });
    }
}

fn join_rel(rel: &str, name: &str) -> String {
    if rel.is_empty() {
        name.to_string()
    } else {
        format!("{rel}/{name}")
    }
}

fn remap_packages(rel: &str) -> String {
    match rel.strip_prefix("packages/") {
        Some(rest) => format!("node_modules/{rest}"),
        None => rel.to_string(),
    }
}
