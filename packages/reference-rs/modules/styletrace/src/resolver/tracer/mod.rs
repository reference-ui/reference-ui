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

/// Neo exact-file entries as (relative path, export name). Neo publishes no
/// `react/types/`; its full wired surface lives in `react.d.mts`, with the
/// narrow typegen surface and the `SystemProperties` alias as fallbacks.
const NEO_STYLE_PROPS_ENTRY_FILES: &[(&str, &str)] = &[
    (".reference-ui/react/react.d.mts", "StyleProps"),
    ("react/react.d.mts", "StyleProps"),
    (".reference-ui/styled/types/index.d.ts", "StyleProps"),
    ("styled/types/index.d.ts", "StyleProps"),
    (".reference-ui/styled/index.d.ts", "StyleProps"),
    ("styled/index.d.ts", "StyleProps"),
    (
        ".reference-ui/styled/types/style-props.d.ts",
        "SystemProperties",
    ),
    ("styled/types/style-props.d.ts", "SystemProperties"),
];

pub fn collect_reference_style_prop_names(
    declaration_root: &Path,
) -> Result<Vec<String>, StyleTraceError> {
    if declaration_root.is_file() {
        return collect_entry_names(declaration_root, declaration_root, "StyleProps");
    }
    collect_first_resolving_entry(declaration_root)
}

fn collect_first_resolving_entry(declaration_root: &Path) -> Result<Vec<String>, StyleTraceError> {
    let candidates = style_props_entry_candidates(declaration_root);
    if candidates.is_empty() {
        return Err(StyleTraceError::new(format!(
            "missing StyleProps declaration entrypoint in {}",
            declaration_root.display()
        )));
    }

    let mut first_error: Option<StyleTraceError> = None;
    for (entry_path, export_name) in candidates {
        match collect_entry_names(declaration_root, &entry_path, export_name) {
            Ok(names) => return Ok(names),
            Err(error) => {
                first_error.get_or_insert(error);
            }
        }
    }
    Err(first_error.unwrap_or_else(|| {
        StyleTraceError::new(
            "malformed public type graph: no style properties resolved from StyleProps",
        )
    }))
}

fn collect_entry_names(
    declaration_root: &Path,
    entry_path: &Path,
    export_name: &str,
) -> Result<Vec<String>, StyleTraceError> {
    let names = collect_style_prop_names(declaration_root, entry_path, export_name, None)?;
    if names.is_empty() {
        return Err(StyleTraceError::new(format!(
            "malformed public type graph: no style properties resolved from {export_name}"
        )));
    }
    Ok(names)
}

fn style_props_entry_candidates(declaration_root: &Path) -> Vec<(PathBuf, &'static str)> {
    let mut candidates = Vec::new();
    for stem in REFERENCE_STYLE_PROPS_ENTRY_STEMS {
        for suffix in [".d.mts", ".d.ts"] {
            let candidate = declaration_root.join(format!("{stem}{suffix}"));
            if candidate.is_file() {
                candidates.push((candidate, "StyleProps"));
            }
        }
    }
    for (relative, export_name) in NEO_STYLE_PROPS_ENTRY_FILES {
        let candidate = declaration_root.join(relative);
        if candidate.is_file() {
            candidates.push((candidate, export_name));
        }
    }
    candidates
}

pub fn collect_style_prop_names(
    sync_root: &Path,
    entry_path: &Path,
    export_name: &str,
    unresolved_style_props: Option<&BTreeSet<String>>,
) -> Result<Vec<String>, StyleTraceError> {
    let mut session = TraceSession::new(sync_root);
    session.unresolved_style_props = unresolved_style_props.cloned();
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

/// Declared prop names of one exported props type with the surface pruned:
/// references to `StyleProps` / `PrimitiveProps` contribute nothing, so the
/// expansion is the host's own declaration (geometry, variants, collisions
/// like `size` included). Unresolvable names contribute nothing; there is
/// no engine fallback because the surface is never owned.
pub fn collect_declared_prop_names(
    sync_root: &Path,
    entry_path: &Path,
    export_name: &str,
) -> Result<Vec<String>, StyleTraceError> {
    let mut session = TraceSession::new(sync_root);
    session.prune_surface = true;
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
