//! Generated primitive metadata helpers for styletrace analysis.
//!
//! Styletrace intentionally reads the synced primitive declaration surface
//! instead of inferring primitive identity from repo layout or handwritten
//! registries.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use crate::styletrace::resolver::StyleTraceError;

const PRIMITIVE_DECLARATIONS_ENTRY_STEM: &str = ".reference-ui/react/system/primitives/index";
const WORKSPACE_ROOT_MARKERS: &[&str] = &["pnpm-workspace.yaml", "nx.json"];
const WORKSPACE_PRIMITIVES_SOURCE: &str = "packages/reference-core/src/system/primitives/index.tsx";

pub(super) fn collect_reference_primitive_jsx_names(
    sync_root: &Path,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let Some(declaration_path) = resolve_primitive_declaration_path(sync_root)? else {
        return Ok(BTreeSet::new());
    };
    let source = fs::read_to_string(declaration_path).map_err(|error| {
        StyleTraceError::new(format!("failed to read primitive declarations: {error}"))
    })?;

    let names = parse_declared_primitive_names(&source);
    if names.is_empty() {
        return Err(StyleTraceError::new(
            "failed to parse primitive declarations: no primitive components found",
        ));
    }

    Ok(names)
}

fn resolve_primitive_declaration_path(
    sync_root: &Path,
) -> Result<Option<PathBuf>, StyleTraceError> {
    for suffix in [".d.mts", ".d.ts"] {
        let candidate = sync_root.join(format!("{PRIMITIVE_DECLARATIONS_ENTRY_STEM}{suffix}"));
        if candidate.is_file() {
            return Ok(Some(candidate));
        }
    }

    if let Some(workspace_root) = find_workspace_root(sync_root) {
        let candidate = workspace_root.join(WORKSPACE_PRIMITIVES_SOURCE);
        if candidate.is_file() {
            return Ok(Some(candidate));
        }
    }

    Ok(None)
}

fn find_workspace_root(start_path: &Path) -> Option<PathBuf> {
    let mut current = if start_path.is_dir() {
        Some(start_path)
    } else {
        start_path.parent()
    };

    while let Some(path) = current {
        if WORKSPACE_ROOT_MARKERS
            .iter()
            .any(|marker| path.join(marker).is_file())
        {
            return Some(path.to_path_buf());
        }
        current = path.parent();
    }

    None
}

fn parse_declared_primitive_names(source: &str) -> BTreeSet<String> {
    source
        .lines()
        .filter_map(parse_declared_primitive_name)
        .collect()
}

fn parse_declared_primitive_name(line: &str) -> Option<String> {
    let trimmed = line.trim();
    let declaration = trimmed
        .strip_prefix("declare const ")
        .or_else(|| trimmed.strip_prefix("export declare const "))
        .or_else(|| trimmed.strip_prefix("export const "))?;
    let (name, _) = declaration
        .split_once(':')
        .or_else(|| declaration.split_once('='))?;
    let name = name.trim();

    let starts_with_component_name = name
        .chars()
        .next()
        .map(|character| character.is_ascii_uppercase())
        .unwrap_or(false);
    if !starts_with_component_name {
        return None;
    }

    Some(name.to_string())
}
