//! Filesystem and primitive discovery helpers for styletrace analysis.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use crate::styletrace::resolver::{normalize_path, resolve_local_module_path, StyleTraceError};

const PRIMITIVE_TAGS_ENTRY: &str = "packages/reference-core/src/system/primitives/tags.ts";

pub(super) fn discover_source_files(root_dir: &Path) -> Result<Vec<PathBuf>, StyleTraceError> {
    let mut files = Vec::new();
    discover_source_files_inner(root_dir, &mut files)?;
    files.sort();
    Ok(files)
}

fn discover_source_files_inner(
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
            if matches!(
                file_name.as_ref(),
                "node_modules" | "dist" | "target" | ".git"
            ) {
                continue;
            }
            discover_source_files_inner(&path, files)?;
            continue;
        }

        if matches!(
            path.extension().and_then(|ext| ext.to_str()),
            Some("ts" | "tsx" | "js" | "jsx" | "mts")
        ) && !file_name.ends_with(".d.ts")
            && !file_name.ends_with(".d.mts")
        {
            files.push(path);
        }
    }

    Ok(())
}

pub(super) fn collect_reference_primitive_jsx_names(
    workspace_root: &Path,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let source = fs::read_to_string(workspace_root.join(PRIMITIVE_TAGS_ENTRY))
        .map_err(|error| StyleTraceError::new(format!("failed to read primitive tags: {error}")))?;

    let mut tags = Vec::new();
    let mut in_tags = false;
    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("export const TAGS = [") {
            in_tags = true;
            continue;
        }
        if in_tags && trimmed.starts_with("] as const") {
            break;
        }
        if in_tags && trimmed.starts_with('\'') {
            tags.push(trimmed.trim_end_matches(',').trim_matches('\'').to_string());
        }
    }

    Ok(tags.into_iter().map(|tag| to_jsx_name(&tag)).collect())
}

fn to_jsx_name(tag: &str) -> String {
    if tag == "object" {
        return "Obj".to_string();
    }
    if tag == "var" {
        return "Var".to_string();
    }
    if tag.len() <= 1 {
        return tag.to_ascii_uppercase();
    }

    format!("{}{}", tag[..1].to_ascii_uppercase(), &tag[1..])
}

pub(super) fn resolve_relative_module(
    current_module: &Path,
    source: &str,
) -> Result<PathBuf, StyleTraceError> {
    let base = current_module.parent().unwrap_or(current_module);
    let candidate = normalize_path(&base.join(source));
    resolve_local_module_path(&candidate).ok_or_else(|| {
        StyleTraceError::new(format!(
            "failed to resolve local module {source} from {}",
            current_module.display()
        ))
    })
}
