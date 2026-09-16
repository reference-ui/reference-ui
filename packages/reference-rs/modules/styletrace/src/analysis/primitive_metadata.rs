//! Generated primitive metadata helpers for styletrace analysis.
//! Reads the synced primitive declaration surface from the declaration root
//! instead of inferring primitive identity from repo layout or handwritten registries.
//! Takes declaration directory paths and emits the set of discovered primitive JSX component names.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use crate::resolver::StyleTraceError;

const PRIMITIVE_DECLARATIONS_ENTRY_STEMS: &[&str] = &[
    "react/system/primitives/index",
    ".reference-ui/react/system/primitives/index",
    "system/primitives/index",
    "primitives/index",
    "index",
];

pub(crate) fn collect_reference_primitive_jsx_names(
    declaration_root: &Path,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let Some(declaration_path) = resolve_primitive_declaration_path(declaration_root)? else {
        return Err(StyleTraceError::new(format!(
            "missing primitive declaration entrypoint in {}",
            declaration_root.display()
        )));
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
    declaration_root: &Path,
) -> Result<Option<PathBuf>, StyleTraceError> {
    if declaration_root.is_file() {
        return Ok(Some(declaration_root.to_path_buf()));
    }

    for stem in PRIMITIVE_DECLARATIONS_ENTRY_STEMS {
        for suffix in [".d.mts", ".d.ts"] {
            let candidate = declaration_root.join(format!("{stem}{suffix}"));
            if candidate.is_file() {
                return Ok(Some(candidate));
            }
        }
    }

    Ok(None)
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
