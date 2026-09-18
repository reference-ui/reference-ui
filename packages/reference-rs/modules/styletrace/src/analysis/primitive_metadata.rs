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

/// Neo primitive surfaces. Neo publishes no `react/system/`; its `react.d.mts`
/// declares every primitive, so it doubles as the primitive entrypoint.
const NEO_PRIMITIVE_ENTRY_FILES: &[&str] = &[
    ".reference-ui/react/react.d.mts",
    "react/react.d.mts",
];

pub(crate) fn collect_reference_primitive_jsx_names(
    declaration_root: &Path,
) -> Result<BTreeSet<String>, StyleTraceError> {
    if declaration_root.is_file() {
        let names = collect_primitive_names(declaration_root)?;
        if names.is_empty() {
            return Err(StyleTraceError::new(
                "failed to parse primitive declarations: no primitive components found",
            ));
        }
        return Ok(names);
    }

    let mut saw_entry = false;
    for candidate in primitive_declaration_candidates(declaration_root) {
        saw_entry = true;
        let names = collect_primitive_names(&candidate)?;
        if !names.is_empty() {
            return Ok(names);
        }
    }

    if saw_entry {
        return Err(StyleTraceError::new(
            "failed to parse primitive declarations: no primitive components found",
        ));
    }
    Err(StyleTraceError::new(format!(
        "missing primitive declaration entrypoint in {}",
        declaration_root.display()
    )))
}

fn collect_primitive_names(declaration_path: &Path) -> Result<BTreeSet<String>, StyleTraceError> {
    let source = fs::read_to_string(declaration_path).map_err(|error| {
        StyleTraceError::new(format!("failed to read primitive declarations: {error}"))
    })?;
    Ok(parse_declared_primitive_names(&source))
}

fn primitive_declaration_candidates(declaration_root: &Path) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    for stem in PRIMITIVE_DECLARATIONS_ENTRY_STEMS {
        for suffix in [".d.mts", ".d.ts"] {
            let candidate = declaration_root.join(format!("{stem}{suffix}"));
            if candidate.is_file() {
                candidates.push(candidate);
            }
        }
    }
    for relative in NEO_PRIMITIVE_ENTRY_FILES {
        let candidate = declaration_root.join(relative);
        if candidate.is_file() {
            candidates.push(candidate);
        }
    }
    candidates
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
