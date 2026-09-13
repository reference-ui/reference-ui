//! Sync-root resolution for Styletrace.
//!
//! Styletrace resolves metadata from the nearest synced app root that contains
//! the generated `.reference-ui` packages needed for analysis.

use std::fs;
use std::path::{Path, PathBuf};

use super::{normalize_path, StyleTraceError};

const SYNC_REACT_PACKAGE_ENTRY: &str = ".reference-ui/react/package.json";
const SYNC_STYLED_PACKAGE_ENTRY: &str = ".reference-ui/styled/package.json";
const STYLETRACE_SYNC_ROOT_ENV: &str = "REFERENCE_STYLETRACE_SYNC_ROOT";
const STYLETRACE_WORKSPACE_ROOT_ENV: &str = "REFERENCE_STYLETRACE_WORKSPACE_ROOT";
const STYLETRACE_PROJECT_ROOT_MARKERS: &[&str] = &[
    "ui.config.ts",
    "ui.config.mts",
    "ui.config.js",
    "package.json",
];

pub(crate) fn resolve_sync_root(
    start_path: &Path,
    sync_root_hint: Option<&Path>,
) -> Result<PathBuf, StyleTraceError> {
    for candidate in sync_root_candidates(start_path, sync_root_hint) {
        if let Some(sync_root) = find_sync_root(&candidate) {
            return Ok(sync_root);
        }
    }

    Err(StyleTraceError::new(format!(
        "could not resolve sync root for {}",
        start_path.display()
    )))
}

fn sync_root_candidates(start_path: &Path, sync_root_hint: Option<&Path>) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    for env_var in [STYLETRACE_SYNC_ROOT_ENV, STYLETRACE_WORKSPACE_ROOT_ENV] {
        if let Ok(env_root) = std::env::var(env_var) {
            if !env_root.trim().is_empty() {
                candidates.push(PathBuf::from(env_root));
            }
        }
    }

    if let Some(sync_root_hint) = sync_root_hint {
        candidates.push(normalize_path(sync_root_hint));
    }

    candidates.push(normalize_path(start_path));
    candidates
}

fn find_sync_root(start_path: &Path) -> Option<PathBuf> {
    let mut current = if start_path.is_dir() {
        Some(start_path)
    } else {
        start_path.parent()
    };

    while let Some(path) = current {
        if is_styletrace_sync_root(path) {
            return Some(canonicalize_existing_path(path));
        }
        if is_styletrace_project_root(path) {
            return Some(canonicalize_existing_path(path));
        }
        current = path.parent();
    }

    None
}

fn is_styletrace_sync_root(path: &Path) -> bool {
    path.join(SYNC_REACT_PACKAGE_ENTRY).is_file() && path.join(SYNC_STYLED_PACKAGE_ENTRY).is_file()
}

fn is_styletrace_project_root(path: &Path) -> bool {
    STYLETRACE_PROJECT_ROOT_MARKERS
        .iter()
        .any(|marker| path.join(marker).is_file())
}

fn canonicalize_existing_path(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| normalize_path(path))
}

#[cfg(test)]
mod tests {
    use super::{canonicalize_existing_path, resolve_sync_root};
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn resolves_sync_root_from_sync_root_hint() {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("expected current time")
            .as_nanos();
        let scratch = std::env::temp_dir().join(format!(
            "reference-rs-sync-root-hint-{}-{stamp}",
            std::process::id()
        ));

        write_file(
            &scratch,
            "consumer-app/.reference-ui/react/package.json",
            "{\n  \"name\": \"@reference-ui/react\"\n}\n",
        );
        write_file(
            &scratch,
            "consumer-app/.reference-ui/styled/package.json",
            "{\n  \"name\": \"@reference-ui/styled\"\n}\n",
        );

        let resolved = resolve_sync_root(
            &scratch.join("consumer-app/src"),
            Some(&scratch.join("consumer-app")),
        )
        .expect("expected sync root to resolve from hint");

        assert_eq!(resolved, canonicalize_existing_path(&scratch.join("consumer-app")));

        let _ = fs::remove_dir_all(&scratch);
    }

    #[test]
    fn resolves_project_root_without_generated_sync_output() {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("expected current time")
            .as_nanos();
        let scratch = std::env::temp_dir().join(format!(
            "reference-rs-sync-root-project-{}-{stamp}",
            std::process::id()
        ));

        write_file(
            &scratch,
            "sandbox/package.json",
            "{\n  \"name\": \"sandbox-app\"\n}\n",
        );

        let resolved = resolve_sync_root(&scratch.join("sandbox/src"), Some(&scratch.join("sandbox")))
            .expect("expected project root to resolve without .reference-ui");

        assert_eq!(resolved, canonicalize_existing_path(&scratch.join("sandbox")));

        let _ = fs::remove_dir_all(&scratch);
    }

    fn write_file(root: &PathBuf, relative_path: &str, content: &str) {
        let file_path = root.join(relative_path);
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).expect("expected parent dir to be created");
        }
        fs::write(file_path, content).expect("expected fixture file to be written");
    }
}
