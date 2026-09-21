//! Source-file discovery for Styletrace analysis.
//!
//! This stays separate from JSX tracing so directory walking and file filtering
//! rules can evolve without adding more branching to the analyzer itself.

use std::fs;
use std::path::{Path, PathBuf};

use crate::resolver::StyleTraceError;

pub(super) fn discover_source_files(root_dir: &Path) -> Result<Vec<PathBuf>, StyleTraceError> {
    if root_dir.is_file() {
        let file_name = root_dir.file_name().unwrap_or_default().to_string_lossy();
        if is_traceable_source_file(root_dir, &file_name) {
            return Ok(vec![root_dir.to_path_buf()]);
        }
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    collect_source_files(root_dir, &mut files)?;
    files.sort();
    Ok(files)
}

fn collect_source_files(
    current_dir: &Path,
    files: &mut Vec<PathBuf>,
) -> Result<(), StyleTraceError> {
    for entry in fs::read_dir(current_dir).map_err(|error| {
        StyleTraceError::new(format!("failed to read {}: {error}", current_dir.display()))
    })? {
        let entry = entry.map_err(|error| {
            StyleTraceError::new(format!(
                "failed to read dir entry in {}: {error}",
                current_dir.display()
            ))
        })?;
        let path = entry.path();
        let file_name = entry.file_name();
        let file_name = file_name.to_string_lossy();

        if path.is_dir() {
            if should_skip_directory(file_name.as_ref()) {
                continue;
            }
            collect_source_files(&path, files)?;
            continue;
        }

        if is_traceable_source_file(&path, file_name.as_ref()) {
            files.push(path);
        }
    }

    Ok(())
}

fn should_skip_directory(file_name: &str) -> bool {
    matches!(file_name, "node_modules" | "dist" | "target" | ".git")
}

fn is_traceable_source_file(path: &Path, file_name: &str) -> bool {
    matches!(
        path.extension().and_then(|ext| ext.to_str()),
        Some("ts" | "tsx" | "js" | "jsx" | "mts")
    ) && !file_name.ends_with(".d.ts")
        && !file_name.ends_with(".d.mts")
}

pub(super) fn format_relative_module(
    module_path: &Path,
    source_root: &Path,
    source_root_is_file: bool,
) -> String {
    let base = if source_root_is_file {
        source_root.parent().unwrap_or(source_root)
    } else {
        source_root
    };
    module_path
        .strip_prefix(base)
        .unwrap_or(module_path)
        .to_string_lossy()
        .replace('\\', "/")
        .trim_start_matches('/')
        .to_string()
}
