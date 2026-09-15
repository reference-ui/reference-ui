//! Recursive type resolver for concrete style-prop name collection.
//!
//! This module resolves TypeScript types across files to trace style properties.
//! It uses a recursive resolution strategy handling imports, builtins, and generics.
//! The resolved property names are emitted as a flat set of strings.

mod builtins;
mod context;
mod resolve;

use std::collections::{BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use crate::resolver::error::StyleTraceError;

use context::{TraceContext, TraceSession};

const REFERENCE_STYLE_PROPS_ENTRY_STEMS: &[&str] = &[
    ".reference-ui/react/types/public/style-props",
    ".reference-ui/react/types/style-props",
];
const REFERENCE_REACT_ENTRY: &str = ".reference-ui/react/react.d.mts";
const STYLED_TYPES_ROOT: &str = ".reference-ui/styled/types";

pub fn collect_reference_style_prop_names(
    sync_root: &Path,
) -> Result<Vec<String>, StyleTraceError> {
    let Some(style_props_path) = resolve_reference_style_props_path(sync_root)? else {
        return Ok(Vec::new());
    };
    collect_style_prop_names(sync_root, &style_props_path, "StyleProps")
}

fn resolve_reference_style_props_path(
    sync_root: &Path,
) -> Result<Option<PathBuf>, StyleTraceError> {
    for stem in REFERENCE_STYLE_PROPS_ENTRY_STEMS {
        if let Ok(path) = resolve_generated_declaration(sync_root, stem) {
            return Ok(Some(path));
        }
    }

    Ok(None)
}

fn resolve_generated_declaration(sync_root: &Path, stem: &str) -> Result<PathBuf, StyleTraceError> {
    for suffix in [".d.mts", ".d.ts"] {
        let candidate = sync_root.join(format!("{stem}{suffix}"));
        if candidate.is_file() {
            return Ok(candidate);
        }
    }

    Err(StyleTraceError::new(format!(
        "failed to read {}.d.mts or {}.d.ts",
        sync_root.join(stem).display(),
        sync_root.join(stem).display()
    )))
}

pub fn collect_style_prop_names(
    sync_root: &Path,
    entry_path: &Path,
    export_name: &str,
) -> Result<Vec<String>, StyleTraceError> {
    let mut session = TraceSession::new(sync_root);
    let mut visited = BTreeSet::new();
    let env = HashMap::new();
    let mut ctx = TraceContext {
        session: &mut session,
        module_path: entry_path,
        env: &env,
        visited: &mut visited,
    };

    let names = resolve::resolve_reference_props(&mut ctx, entry_path, export_name)?;
    Ok(names.into_iter().collect())
}
