//! Source-file discovery for Styletrace analysis.
//!
//! This stays separate from JSX tracing so directory walking and file filtering
//! rules can evolve without adding more branching to the analyzer itself.

use std::fs;
use std::path::{Path, PathBuf};

use crate::styletrace::resolver::StyleTraceError;

pub(super) fn discover_source_files(root_dir: &Path) -> Result<Vec<PathBuf>, StyleTraceError> {
    let mut files = Vec::new();
    collect_source_files(root_dir, &mut files)?;
    files.sort();
    Ok(files)
}

fn collect_source_files(current_dir: &Path, files: &mut Vec<PathBuf>) -> Result<(), StyleTraceError> {
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
    matches!(path.extension().and_then(|ext| ext.to_str()), Some("ts" | "tsx" | "js" | "jsx" | "mts"))
        && !file_name.ends_with(".d.ts")
        && !file_name.ends_with(".d.mts")
}
