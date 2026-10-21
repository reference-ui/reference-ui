//! Recursive type resolver for concrete style-prop name collection.
//! Resolves TypeScript types across files to trace style properties from declaration roots.
//! It uses a recursive resolution strategy handling imports, builtins, and generics.
//! The resolved property names are emitted as a flat set of strings or explicit failure diagnostics.
//! Each trace also reports every guard limit whose cut hid a name from its result, so a loss of names is never silent.

mod builtins;
mod context;
mod guard;
mod reach;
mod resolve;

use std::collections::BTreeSet;
use std::ops::ControlFlow;
use std::path::{Path, PathBuf};

use crate::diagnostics::surface_cut;
use crate::resolver::error::StyleTraceError;
use crate::resolver::model::TypeEnv;

use context::{TraceContext, TraceSession};
pub use guard::{CutReason, GuardCut};

/// The names one trace reached, sorted and unique, plus the guard limits whose cut hid one of them.
/// `cuts` lists only the lossy cuts: a limit that refused an expansion whose reachable names the trace
/// already holds loses nothing, so it is not reported.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TracedNames {
    pub names: Vec<String>,
    pub cuts: Vec<GuardCut>,
}

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

/// Core exact-file entries as (relative path, export name). Core publishes no
/// `react/types/`; its full wired surface lives in `react.d.mts`, with the
/// narrow typegen surface and the `SystemProperties` alias as fallbacks.
const CORE_STYLE_PROPS_ENTRY_FILES: &[(&str, &str)] = &[
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
        return match collect_entry_names(declaration_root, declaration_root, "StyleProps") {
            EntryNames::Resolved(names) => Ok(names),
            EntryNames::Unresolved(error) | EntryNames::Incomplete(error) => Err(error),
        };
    }
    collect_first_resolving_entry(declaration_root)
}

/// One candidate entry's outcome. An unresolved entry lets the next candidate try; an incomplete one
/// (a guard limit hid a name the surface needs) refuses the surface outright, so no other entry stands in.
enum EntryNames {
    Resolved(Vec<String>),
    Unresolved(StyleTraceError),
    Incomplete(StyleTraceError),
}

impl EntryNames {
    /// Whether this candidate ends the search: resolved and incomplete candidates both do, while an
    /// unresolved one is kept as the error to report if no later candidate resolves.
    fn settle(
        self,
        first_error: &mut Option<StyleTraceError>,
    ) -> ControlFlow<Result<Vec<String>, StyleTraceError>> {
        match self {
            Self::Resolved(names) => ControlFlow::Break(Ok(names)),
            Self::Incomplete(error) => ControlFlow::Break(Err(error)),
            Self::Unresolved(error) => {
                first_error.get_or_insert(error);
                ControlFlow::Continue(())
            }
        }
    }
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
        let outcome = collect_entry_names(declaration_root, &entry_path, export_name);
        if let ControlFlow::Break(settled) = outcome.settle(&mut first_error) {
            return settled;
        }
    }
    Err(first_error.unwrap_or_else(no_resolving_entry_error))
}

fn no_resolving_entry_error() -> StyleTraceError {
    StyleTraceError::new(
        "malformed public type graph: no style properties resolved from StyleProps",
    )
}

fn collect_entry_names(
    declaration_root: &Path,
    entry_path: &Path,
    export_name: &str,
) -> EntryNames {
    let traced = match collect_style_prop_names(declaration_root, entry_path, export_name, None) {
        Ok(traced) => traced,
        Err(error) => return EntryNames::Unresolved(error),
    };
    if let Some(cut) = traced.cuts.first() {
        return EntryNames::Incomplete(StyleTraceError::new(surface_cut(
            entry_path,
            export_name,
            cut,
        )));
    }
    if traced.names.is_empty() {
        return EntryNames::Unresolved(StyleTraceError::new(format!(
            "malformed public type graph: no style properties resolved from {export_name}"
        )));
    }
    EntryNames::Resolved(traced.names)
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
    for (relative, export_name) in CORE_STYLE_PROPS_ENTRY_FILES {
        let candidate = declaration_root.join(relative);
        if candidate.is_file() {
            candidates.push((candidate, export_name));
        }
    }
    candidates
}

/// Engine-mode surface trust for wipe-state traces: when generated
/// declarations are missing (cold trees, wiped outputs), an unresolvable
/// surface-denoting import falls back to these style names instead of
/// resolving empty. `None` keeps disk resolution strict.
#[derive(Debug, Clone, Copy)]
pub struct SurfaceTrust<'a> {
    pub style_props: &'a BTreeSet<String>,
    pub primitives: &'a BTreeSet<String>,
}

pub fn collect_style_prop_names(
    sync_root: &Path,
    entry_path: &Path,
    export_name: &str,
    trust: Option<SurfaceTrust<'_>>,
) -> Result<TracedNames, StyleTraceError> {
    let mut session = TraceSession::new(sync_root);
    if let Some(trust) = trust {
        session.unresolved_style_props = Some(trust.style_props.clone());
        session.unresolved_primitive_names = Some(trust.primitives.clone());
    }
    let mut visited = BTreeSet::new();
    let env = TypeEnv::default();
    let mut ctx = TraceContext {
        session: &mut session,
        module_path: entry_path,
        env: &env,
        visited: &mut visited,
    };

    let names = resolve::resolve_reference_props(&mut ctx, entry_path, export_name)?;
    Ok(TracedNames {
        cuts: session.lossy_cuts(&names),
        names: names.into_iter().collect(),
    })
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
) -> Result<TracedNames, StyleTraceError> {
    let mut session = TraceSession::new(sync_root);
    session.prune_surface = true;
    let mut visited = BTreeSet::new();
    let env = TypeEnv::default();
    let mut ctx = TraceContext {
        session: &mut session,
        module_path: entry_path,
        env: &env,
        visited: &mut visited,
    };

    let names = resolve::resolve_reference_props(&mut ctx, entry_path, export_name)?;
    Ok(TracedNames {
        cuts: session.lossy_cuts(&names),
        names: names.into_iter().collect(),
    })
}
