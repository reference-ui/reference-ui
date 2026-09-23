//! Explicit and traced JSX host resolution for StyleProps gating.
//! Unions caller-supplied `jsxHosts` with engine-traced component names so
//! configured hosts and discovered wrappers extract without a file-local
//! import. Tracing runs against the engine-owned surface over the same
//! include-scoped entries extraction compiles; per-file failures become
//! located warnings, never silent empty sets.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use oxc_ast::ast::Program;
use rustc_hash::{FxHashMap, FxHashSet};
use styletrace::{
    trace_style_bindings_with_modules, trace_style_bindings_with_surface, ModulesTraceInputs,
    StyleSurface, TraceModule, TraceOutcome, TraceSources,
};

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
pub(crate) use entries::trace_skip;
pub use surface::engine_surface;

/// Traced vs caller-configured host names for one compile.
#[derive(Clone)]
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
    let programs = FxHashMap::default();
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
    programs: &FxHashMap<PathBuf, &Program<'_>>,
) -> (ResolvedHosts, Vec<Diagnostic>) {
    let configured = request.jsx_hosts.clone().unwrap_or_default();
    let Some(opened) = open_trace(request, sources, failed) else {
        return configured_only(configured);
    };
    let surface = engine_surface(&request.base_system);
    let inputs = TraceSources {
        staged: &opened.staged,
        programs,
    };
    let outcome = trace_style_bindings_with_surface(
        &opened.entries,
        Path::new(opened.root),
        Path::new(opened.package_root),
        &surface,
        &inputs,
    );
    hosts_from(configured, outcome, sink)
}

/// Trace from modules workers already folded off the programs they hold.
/// Missing entries still parse from staged bytes. The surface is the one
/// the workers folded against, so the walk and the fold agree.
pub(crate) fn resolve_prepared(
    prepared: PreparedTrace<'_>,
    sink: &mut DiagnosticsSession,
) -> (ResolvedHosts, Vec<Diagnostic>) {
    let configured = prepared.request.jsx_hosts.clone().unwrap_or_default();
    let Some(opened) = open_trace(prepared.request, prepared.sources, prepared.failed) else {
        return configured_only(configured);
    };
    let programs = FxHashMap::default();
    let inputs = TraceSources {
        staged: &opened.staged,
        programs: &programs,
    };
    let outcome = trace_style_bindings_with_modules(ModulesTraceInputs {
        entries: &opened.entries,
        source_root: Path::new(opened.root),
        package_root: Path::new(opened.package_root),
        surface: prepared.surface,
        modules: prepared.modules,
        sources: &inputs,
    });
    hosts_from(configured, outcome, sink)
}

/// Folded modules plus the surface they were folded against.
pub(crate) struct PreparedTrace<'a> {
    pub request: &'a CompileRequest,
    pub sources: &'a [(String, String)],
    pub failed: &'a [bool],
    pub surface: &'a StyleSurface,
    pub modules: BTreeMap<PathBuf, TraceModule>,
}

/// Root, entries, and staged bytes for one trace, when the compile has any.
struct TraceOpen<'a> {
    root: &'a str,
    package_root: &'a str,
    entries: Vec<PathBuf>,
    staged: FxHashMap<PathBuf, &'a str>,
}

/// Open the trace when a root and at least one entry exist.
fn open_trace<'a>(
    request: &'a CompileRequest,
    sources: &'a [(String, String)],
    failed: &[bool],
) -> Option<TraceOpen<'a>> {
    let root = request.root_dir.as_deref()?;
    let entries = entry_paths(sources, failed);
    if entries.is_empty() {
        return None;
    }
    let package_root = request.declaration_root.as_deref().unwrap_or(root);
    let staged = sources
        .iter()
        .map(|(path, content)| (PathBuf::from(path), content.as_str()))
        .collect();
    Some(TraceOpen {
        root,
        package_root,
        entries,
        staged,
    })
}

/// Declaration root when the compile has one, else the source root.
pub(crate) fn trace_root(request: &CompileRequest) -> Option<PathBuf> {
    let root = request.root_dir.as_deref()?;
    Some(PathBuf::from(
        request.declaration_root.as_deref().unwrap_or(root),
    ))
}

/// Configured names alone, when nothing is traced.
fn configured_only(configured: Vec<String>) -> (ResolvedHosts, Vec<Diagnostic>) {
    (
        ResolvedHosts {
            traced: Vec::new(),
            configured,
            owned_props: BTreeMap::new(),
        },
        Vec::new(),
    )
}

/// Turn one trace outcome into hosts plus rendered warnings.
fn hosts_from(
    configured: Vec<String>,
    outcome: TraceOutcome,
    sink: &mut DiagnosticsSession,
) -> (ResolvedHosts, Vec<Diagnostic>) {
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
