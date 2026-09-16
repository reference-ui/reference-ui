//! Recursive type resolver for concrete style-prop name collection.
//! Resolves TypeScript types across files to trace style properties from declaration roots.
//! It uses a recursive resolution strategy handling imports, builtins, and generics.
//! The resolved property names are emitted as a flat set of strings or explicit failure diagnostics.

mod builtins;
mod context;
mod resolve;

use std::collections::{BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use crate::resolver::error::StyleTraceError;

use context::{TraceContext, TraceSession};

const REFERENCE_STYLE_PROPS_ENTRY_STEMS: &[&str] = &[
    "react/types/public/style-props",
    "react/types/style-props",
    ".reference-ui/react/types/public/style-props",
    ".reference-ui/react/types/style-props",
    "types/public/style-props",
    "types/style-props",
    "style-props",
];
const REFERENCE_REACT_ENTRY: &str = ".reference-ui/react/react.d.mts";
const STYLED_TYPES_ROOT: &str = ".reference-ui/styled/types";

pub fn collect_reference_style_prop_names(
    declaration_root: &Path,
) -> Result<Vec<String>, StyleTraceError> {
    let Some(style_props_path) = resolve_reference_style_props_path(declaration_root)? else {
        return Err(StyleTraceError::new(format!(
            "missing StyleProps declaration entrypoint in {}",
            declaration_root.display()
        )));
    };
    let names = collect_style_prop_names(declaration_root, &style_props_path, "StyleProps")?;
    if names.is_empty() {
        return Err(StyleTraceError::new(
            "malformed public type graph: no style properties resolved from StyleProps",
        ));
    }
    Ok(names)
}

fn resolve_reference_style_props_path(
    declaration_root: &Path,
) -> Result<Option<PathBuf>, StyleTraceError> {
    if declaration_root.is_file() {
        return Ok(Some(declaration_root.to_path_buf()));
    }

    for stem in REFERENCE_STYLE_PROPS_ENTRY_STEMS {
        for suffix in [".d.mts", ".d.ts"] {
            let candidate = declaration_root.join(format!("{stem}{suffix}"));
            if candidate.is_file() {
                return Ok(Some(candidate));
            }
        }
    }

    Ok(None)
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
