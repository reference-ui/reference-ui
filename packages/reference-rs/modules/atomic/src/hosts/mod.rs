//! Explicit and traced JSX host resolution for StyleProps gating.
//! Unions caller-supplied `jsxHosts` with engine-traced component names so
//! configured hosts and discovered wrappers extract without a file-local
//! import. A name an extended upstream publishes (`upstreamHosts`) leaves
//! the configured roster: only this compile's trace or an own import admits
//! a tag that spells it. Tracing runs against the engine-owned surface over
//! the same include-scoped entries extraction compiles; per-file failures become
//! located warnings, never silent empty sets. Every path also unions the
//! base system's declared `jsxOwned` into the owned props, so a published
//! component with no source to trace still keeps its own prop names. Owned
//! props of components a module never exports stay keyed by that module's
//! path, so only its own call sites read them.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use oxc_ast::ast::Program;
use rustc_hash::{FxHashMap, FxHashSet};
use shared::parse::ScreenedSource;
use styletrace::{
    trace_style_bindings_with_modules, trace_style_bindings_with_surface, ModulesTraceInputs,
    StyleSurface, SurfaceTrace, TraceModule, TraceOutcome, TraceSources,
};

use crate::{
    diagnostics::{DiagnosticFact, DiagnosticSink, DiagnosticsSession, Policy},
    extract::{LocalOwned, OwnedProps},
    BaseSystem, CompileRequest, Diagnostic,
};

mod diagnostics;
mod entries;
mod surface;
#[cfg(test)]
mod lane_tests;
#[cfg(test)]
mod tests;
#[cfg(test)]
mod upstream_tests;

use diagnostics::convert_trace_diagnostic;
use entries::entry_paths;
pub(crate) use entries::{on_disk_source, trace_skip};
pub use surface::engine_surface;

/// Traced vs caller-configured host names for one compile.
#[derive(Clone)]
pub struct ResolvedHosts {
    pub traced: Vec<String>,
    pub configured: Vec<String>,
    /// Each export name that declares props to the prop names it keeps for itself (§14), traced or not.
    pub owned_props: BTreeMap<String, BTreeSet<String>>,
    /// Each traced module path to the owned props of the components it declares, by local name,
    /// exported or not. Only that file's call sites read them.
    pub local_owned: LocalOwned,
}

/// The inputs `resolve` reads beside the request: the compile's collected sources, the main-phase
/// parse failures by source index, and the programs the main phase already parsed, by path.
pub struct ResolveInputs<'a> {
    pub sources: &'a [crate::Source],
    pub failed: &'a [bool],
    pub programs: &'a FxHashMap<PathBuf, &'a Program<'a>>,
}

impl ResolvedHosts {
    /// The owned props the file at `path` reads: every export's plus its own components'.
    pub fn owned_for(&self, path: &str) -> OwnedProps<'_> {
        OwnedProps::for_file(&self.owned_props, &self.local_owned, path)
    }

    /// Sorted union gating extraction.
    pub fn hosts(&self) -> FxHashSet<String> {
        let mut hosts = FxHashSet::default();
        hosts.extend(self.traced.iter().cloned());
        hosts.extend(self.configured.iter().cloned());
        hosts
    }

    /// Configured names plus the system's declared owned props, nothing
    /// traced: the start for every path that never reaches a trace.
    pub(crate) fn declared(request: &CompileRequest) -> Self {
        let mut hosts = Self {
            traced: Vec::new(),
            configured: own_roster(request),
            owned_props: BTreeMap::new(),
            local_owned: LocalOwned::new(),
        };
        hosts.union_declared_owned(&request.base_system);
        hosts
    }

    /// Union the system's `jsxOwned` into the owned props as sets, so order
    /// and duplicates on the wire never matter and a host named by both the
    /// trace and the system owns both name lists.
    fn union_declared_owned(&mut self, system: &BaseSystem) {
        for (host, names) in &system.jsx_owned {
            if names.is_empty() {
                continue;
            }
            self.owned_props
                .entry(host.clone())
                .or_default()
                .extend(names.iter().cloned());
        }
    }
}

/// The caller's host roster minus every name an upstream publishes. An
/// upstream's component renders through that package's runtime and mints
/// that system's classes, so its name alone never proves a tag own, even
/// when it also spells a primitive or a configured name: the tag is own
/// only through an own import or this compile's trace, else external.
fn own_roster(request: &CompileRequest) -> Vec<String> {
    let roster = request.jsx_hosts.as_deref().unwrap_or_default();
    if request.upstream_hosts.is_empty() {
        return roster.to_vec();
    }
    let upstream: FxHashSet<&str> = request
        .upstream_hosts
        .values()
        .flatten()
        .map(String::as_str)
        .collect();
    roster
        .iter()
        .filter(|name| !upstream.contains(name.as_str()))
        .cloned()
        .collect()
}

/// Owned props as the sorted, unique arrays `CompileResult` ships; a host
/// that owns nothing drops out.
pub(crate) fn owned_wire(
    owned: BTreeMap<String, BTreeSet<String>>,
) -> BTreeMap<String, Vec<String>> {
    owned
        .into_iter()
        .filter(|(_, names)| !names.is_empty())
        .map(|(host, names)| (host, names.into_iter().collect()))
        .collect()
}

/// Trace the include-scoped entry set against the engine surface.
/// Returns traced and configured names plus trace warnings for the
/// compile diagnostics, reporting one host fact per skip into the
/// session. Empty entry sets trace nothing, silently. The caller
/// collects the compile's sources once and passes them in `inputs`;
/// its `failed` marks main-phase parse failures by source index so their
/// entries survive the trace gate and keep their located warnings (C1).
/// Its `programs` reuse the main-phase parse by path; absent paths parse
/// from staged bytes exactly as before.
pub fn resolve(
    request: &CompileRequest,
    inputs: ResolveInputs<'_>,
    sink: &mut DiagnosticsSession,
) -> (ResolvedHosts, Vec<Diagnostic>) {
    let ResolveInputs {
        sources,
        failed,
        programs,
    } = inputs;
    let Some(opened) = open_trace(request, sources, failed) else {
        return configured_only(request);
    };
    let surface = engine_surface();
    let inputs = TraceSources {
        staged: &opened.staged,
        programs,
    };
    let outcome = trace_style_bindings_with_surface(SurfaceTrace {
        entries: &opened.entries,
        source_root: Path::new(opened.root),
        package_root: Path::new(opened.package_root),
        surface: &surface,
        sources: &inputs,
    });
    hosts_from(request, outcome, sink)
}

/// Trace from modules workers already folded off the programs they hold.
/// Missing entries still parse from staged bytes. The surface is the one
/// the workers folded against, so the walk and the fold agree.
pub(crate) fn resolve_prepared(
    prepared: PreparedTrace<'_>,
    sink: &mut DiagnosticsSession,
) -> (ResolvedHosts, Vec<Diagnostic>) {
    let request = prepared.request;
    let Some(opened) = open_trace(request, prepared.sources, prepared.failed) else {
        return configured_only(request);
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
    hosts_from(request, outcome, sink)
}

/// Folded modules plus the surface they were folded against.
pub(crate) struct PreparedTrace<'a> {
    pub request: &'a CompileRequest,
    pub sources: &'a [crate::Source],
    pub failed: &'a [bool],
    pub surface: &'a StyleSurface,
    pub modules: BTreeMap<PathBuf, TraceModule>,
}

/// Root, entries, and staged bytes for one trace, when the compile has any.
struct TraceOpen<'a> {
    root: &'a str,
    package_root: &'a str,
    entries: Vec<PathBuf>,
    staged: FxHashMap<PathBuf, &'a ScreenedSource>,
}

/// Open the trace when a root and at least one entry exist.
fn open_trace<'a>(
    request: &'a CompileRequest,
    sources: &'a [crate::Source],
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
        .map(|(path, source)| (PathBuf::from(path), source))
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

/// Configured names and declared owned props alone, when nothing is traced.
fn configured_only(request: &CompileRequest) -> (ResolvedHosts, Vec<Diagnostic>) {
    (ResolvedHosts::declared(request), Vec::new())
}

/// Turn one trace outcome into hosts plus rendered warnings, with the
/// system's declared owned props unioned over what the trace found.
fn hosts_from(
    request: &CompileRequest,
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
    let mut hosts = ResolvedHosts {
        traced,
        configured: own_roster(request),
        owned_props: outcome.owned_props,
        local_owned: outcome.local_owned,
    };
    hosts.union_declared_owned(&request.base_system);
    (hosts, diagnostics)
}
