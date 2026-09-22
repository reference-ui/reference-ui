//! Explicit and traced JSX host resolution for StyleProps gating.
//! Unions caller-supplied `jsxHosts` with engine-traced component names so
//! configured hosts and discovered wrappers extract without a file-local
//! import. Tracing runs against the engine-owned surface over the same
//! include-scoped entries extraction compiles; per-file failures become
//! located warnings, never silent empty sets.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use oxc_ast::ast::Program;
use rustc_hash::{FxHashMap, FxHashSet};
use styletrace::{trace_style_bindings_with_surface, TraceSources};

use crate::{
    diagnostics::{DiagnosticFact, DiagnosticSink, DiagnosticsSession, Policy},
    CompileRequest, Diagnostic,
};

mod diagnostics;
mod entries;
mod surface;
#[cfg(test)]
mod tests;

use diagnostics::convert_trace_diagnostic;
use entries::entry_paths;
pub use surface::engine_surface;

/// Traced vs caller-configured host names for one compile.
pub struct ResolvedHosts {
    pub traced: Vec<String>,
    pub configured: Vec<String>,
    /// Each traced export name to its owned declared prop names (§14).
    pub owned_props: BTreeMap<String, BTreeSet<String>>,
}

impl ResolvedHosts {
    /// Sorted union gating extraction.
    pub fn hosts(&self) -> FxHashSet<String> {
        let mut hosts = FxHashSet::default();
        hosts.extend(self.traced.iter().cloned());
        hosts.extend(self.configured.iter().cloned());
        hosts
    }
}

/// Caller hosts plus traced names for one compile.
pub fn collect_hosts(request: &CompileRequest) -> FxHashSet<String> {
    let mut session = DiagnosticsSession::new();
    let sources = crate::sources::collect(request);
    // No parse runs on this path, so no failure signal exists: every
    // source counts as parsed-clean and the trace gate applies fully.
    let failed = vec![false; sources.len()];
    let programs = HashMap::new();
    resolve(request, &sources, &failed, &mut session, &programs)
        .0
        .hosts()
}

/// Trace the include-scoped entry set against the engine surface.
/// Returns traced and configured names plus trace warnings for the
/// compile diagnostics, reporting one host fact per skip into the
/// session. Empty entry sets trace nothing, silently. Takes the
/// compile's collected sources; the caller collects once. `failed`
/// marks main-phase parse failures by source index so their entries
/// survive the trace gate and keep their located warnings (C1).
/// `programs` reuses the main-phase parse by path; absent paths parse
/// from staged bytes exactly as before.
pub fn resolve(
    request: &CompileRequest,
    sources: &[(String, String)],
    failed: &[bool],
    sink: &mut DiagnosticsSession,
    programs: &HashMap<PathBuf, &Program<'_>>,
) -> (ResolvedHosts, Vec<Diagnostic>) {
    let configured = request.jsx_hosts.clone().unwrap_or_default();
    let vacant = || {
        (
            ResolvedHosts {
                traced: Vec::new(),
                configured: configured.clone(),
                owned_props: BTreeMap::new(),
            },
            Vec::new(),
        )
    };
    let Some(root_dir) = request.root_dir.as_ref() else {
        return vacant();
    };
    let entries = entry_paths(sources, failed);
    if entries.is_empty() {
        return vacant();
    }
    let package_root = request.declaration_root.as_deref().unwrap_or(root_dir);
    let surface = engine_surface(&request.base_system);
    // Staged bytes keyed exactly as the entries: the trace parses what
    // extraction parsed, with disk fallback for paths outside the compile.
    let staged: FxHashMap<PathBuf, &str> = sources
        .iter()
        .map(|(path, content)| (PathBuf::from(path), content.as_str()))
        .collect();
    let inputs = TraceSources {
        staged: &staged,
        programs,
    };
    let outcome = trace_style_bindings_with_surface(
        &entries,
        Path::new(root_dir),
        Path::new(package_root),
        &surface,
        &inputs,
    );
    let traced = outcome
        .bindings
        .into_iter()
        .map(|binding| binding.name)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let diagnostics = outcome
        .diagnostics
        .into_iter()
        .map(|diagnostic| {
            let report = convert_trace_diagnostic(diagnostic);
            let rendered = Policy::render_host(&report);
            sink.report(DiagnosticFact::from(report));
            rendered
        })
        .collect();
    (
        ResolvedHosts {
            traced,
            configured,
            owned_props: outcome.owned_props,
        },
        diagnostics,
    )
}
