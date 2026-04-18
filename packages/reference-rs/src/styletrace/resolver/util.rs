//! Shared path and error helpers for resolver and analyzer modules.

use std::fmt::{Display, Formatter};
use std::path::{Path, PathBuf};

const REFERENCE_STYLE_PROPS_ENTRY: &str = "packages/reference-core/src/types/style-props.ts";

#[derive(Debug, Clone)]
pub struct StyleTraceError {
    message: String,
}

impl StyleTraceError {
    pub(crate) fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl Display for StyleTraceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for StyleTraceError {}

pub(crate) fn resolve_workspace_root(start_path: &Path) -> Result<PathBuf, StyleTraceError> {
    let mut current = if start_path.is_dir() {
        Some(start_path)
    } else {
        start_path.parent()
    };

    while let Some(path) = current {
        if path.join(REFERENCE_STYLE_PROPS_ENTRY).is_file() {
            return Ok(path.to_path_buf());
        }
        current = path.parent();
    }

    Err(StyleTraceError::new(format!(
        "could not resolve workspace root for {}",
        start_path.display()
    )))
}

pub(crate) fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        normalized.push(component);
    }
    normalized
}

pub(crate) fn resolve_local_module_path(candidate: &Path) -> Option<PathBuf> {
    let direct_exts = ["", ".ts", ".tsx", ".d.ts", ".mts", ".d.mts"];
    for suffix in direct_exts {
        let path = if suffix.is_empty() {
            candidate.to_path_buf()
        } else {
            PathBuf::from(format!("{}{suffix}", candidate.display()))
        };
        if path.is_file() {
            return Some(path);
        }
    }

    let index_files = [
        "index.ts",
        "index.tsx",
        "index.d.ts",
        "index.mts",
        "index.d.mts",
    ];
    for index_file in index_files {
        let path = candidate.join(index_file);
        if path.is_file() {
            return Some(path);
        }
    }

    None
}
