//! The parse phase of one compile: indexes the request's sources, runs the serial
//! parse, analyze, extract and harvest walks into the compile sinks, and reports the
//! resolved hosts that assembly publishes. It also partitions the result's channels
//! once proof has read the facts, so the default and backchannel outputs split cleanly.
//! Takes the request, the in-memory sources and the sinks; emits the unpanicked source
//! index and the traced hosts.

use oxc_parser::ParserReturn;

use super::*;

/// Parse, analyze, extract, and harvest one compile into the sinks.
/// Returns the unpanicked source index in input order (the partition
/// catalog) plus the resolved hosts assembly names as traced.
pub(super) fn run_parse_phase(
    request: &CompileRequest,
    sources: &[(String, String)],
    sinks: CompileSinks<'_>,
) -> Result<(Vec<usize>, hosts::ResolvedHosts), String> {
    let styling = sources
        .iter()
        .filter(|(_, content)| !styling_skip(content))
        .count();
    if let Some(guard) = Lanes::Auto.guard(WorkKind::FrontFiles, styling) {
        return phase_parallel::run(request, sources, sinks, &guard);
    }
    Ok(run_parse_serial(request, sources, sinks))
}

/// Read-only view of one serial parse once its parses and constants have settled.
/// The walks after the parse borrow it, so none of them repeat the same slices in
/// its own signature.
struct ParseView<'a> {
    request: &'a CompileRequest,
    sources: &'a [(String, String)],
    parsed: &'a [ParserReturn<'a>],
    slots: &'a [stream::SourceSlot],
    retained: &'a [usize],
    constants: &'a extract::constants::LocalConstants,
    errors: &'a [Vec<(String, Option<u32>)>],
    /// What the compile composes: analysis and extraction read the same facts.
    composed: &'a extract::Composed<'a>,
}

/// Serial parse path: retains one parse per source the streaming gate keeps, streams the
/// rest through the constants pass, then runs graphs, hosts, analysis, extraction and
/// harvest over the shared parses. Returns the unpanicked source index and the hosts.
fn run_parse_serial(
    request: &CompileRequest,
    sources: &[(String, String)],
    sinks: CompileSinks<'_>,
) -> (Vec<usize>, hosts::ResolvedHosts) {
    // Retained parses live for this phase; streamed files parse transiently in the
    // constants pass and keep only errors, constants, and staged records+bags.
    #[cfg(feature = "alloc-trace")]
    let _parse = crate::alloc_trace::PhaseGuard::enter("parse");
    let mut slots = initial_slots(sources);
    let retained = retained_indices(&slots);
    let allocators = retained_allocators(&retained);
    let parsed = parse_retained(sources, &retained, &allocators);
    link_parsed(&mut slots, &retained, &parsed);
    #[cfg(feature = "alloc-trace")]
    drop(_parse);
    let (constants, transient) = merge_constants(sources, &parsed, &mut slots);
    let stream::TransientOut { staged, errors } = transient;
    // Qualifier plumbing (G0 §E/R1): the same helper `finish` calls, so analysis,
    // extraction and assembly cannot diverge on what is composed.
    let qualifiers = assembly::qualifiers_for(&request.base_system.name, &request.upstream_systems);
    let composed = extract::Composed::new(&qualifiers, &request.upstream_hosts);
    let view = ParseView {
        request,
        sources,
        parsed: &parsed,
        slots: &slots,
        retained: &retained,
        constants: &constants,
        errors: &errors,
        composed: &composed,
    };
    #[cfg(feature = "alloc-trace")]
    let _graphs = crate::alloc_trace::PhaseGuard::enter("graphs");
    let unpanicked = stream::unpanicked_index(&slots);
    let live = stream::live_retained_sources(sources, &parsed, &retained, &slots);
    let mut graph = extract::resolver::ValueGraph::new(sources, &live, staged, &constants);
    let (identity_programs, trace_programs) = reuse_programs(&view);
    let root = crate::hosts::trace_root(request);
    let identity = extract::identity::IdentityGraph::with_programs(sources, &identity_programs)
        .with_root(root.as_deref().and_then(std::path::Path::to_str));
    #[cfg(feature = "alloc-trace")]
    drop(_graphs);
    let (hosts, traced_jsx) =
        resolve_hosts(&view, &trace_programs, sinks.session, sinks.diagnostics);
    // One set of bindings per styling file: analysis and extraction both read it.
    let files = extract_parallel::styling_files(sources, &parsed, &slots, &identity);
    analyze_parse(&view, &files, &hosts, sinks.session);
    stream::report_parse_errors(sources, &errors, sinks.diagnostics);
    let extract_session = ParseSession {
        constants: &constants,
        resolver: &mut graph,
        identity,
        breakpoints: request.base_system.breakpoints(),
        traced_jsx: &traced_jsx,
        hosts: &hosts,
        composed: &composed,
        wants: sinks.wants,
        recipes: sinks.recipes,
        diagnostics: sinks.diagnostics,
        authored: sinks.authored,
        sinks: sinks.sinks,
        session: sinks.session,
        tentative: sinks.tentative,
        recipe_bindings: sinks.recipe_bindings,
        selections: sinks.selections,
    };
    extract_walk(extract_session, &view, &files);
    // The pool is kept to the end of the compile, as the sequential walk held it.
    let _pool = harvest_walk(&view, sinks);
    (unpanicked, hosts)
}

/// Slot per source, with the streaming gate decided from the bytes alone.
fn initial_slots(sources: &[(String, String)]) -> Vec<stream::SourceSlot> {
    sources
        .iter()
        .map(|(_, content)| stream::SourceSlot::new(streaming_candidate(content)))
        .collect()
}

/// Indexes of the sources that keep a shared parse: every source the streaming gate
/// did not claim, in input order.
fn retained_indices(slots: &[stream::SourceSlot]) -> Vec<usize> {
    (0..slots.len()).filter(|&i| !slots[i].streamed).collect()
}

/// One allocator per retained source, so each parse owns its arena for the phase.
fn retained_allocators(retained: &[usize]) -> Vec<Allocator> {
    retained.iter().map(|_| Allocator::default()).collect()
}

/// Parses every retained source into its own arena, in retained order.
fn parse_retained<'a>(
    sources: &'a [(String, String)],
    retained: &[usize],
    allocators: &'a [Allocator],
) -> Vec<ParserReturn<'a>> {
    retained
        .iter()
        .zip(allocators.iter())
        .map(|(&i, allocator)| parse_source(&sources[i].0, &sources[i].1, allocator))
        .collect()
}

/// Records each retained source's position in the shared parse and its panic flag.
fn link_parsed(
    slots: &mut [stream::SourceSlot],
    retained: &[usize],
    parsed: &[ParserReturn<'_>],
) {
    for (position, &i) in retained.iter().enumerate() {
        slots[i].parsed = Some(position);
        slots[i].panicked = parsed[position].panicked;
    }
}

/// Ordered constants pass over the parses: merges project constants and stages the
/// streamed files, which parse transiently inside the pass.
fn merge_constants(
    sources: &[(String, String)],
    parsed: &[ParserReturn<'_>],
    slots: &mut [stream::SourceSlot],
) -> (extract::constants::LocalConstants, stream::TransientOut) {
    #[cfg(feature = "alloc-trace")]
    let _constants = crate::alloc_trace::PhaseGuard::enter("constants");
    let mut project_constants = extract::constants::LocalConstants::new();
    let transient = stream::merge_constants_ordered(sources, parsed, slots, &mut project_constants);
    (project_constants, transient)
}

/// Resolves the hosts the trace names and folds the diagnostics it raises into the compile.
/// A source that panicked or carried parse errors counts as failed for the trace.
fn resolve_hosts(
    view: &ParseView<'_>,
    trace_programs: &FxHashMap<PathBuf, &Program<'_>>,
    session: &mut diagnostics::DiagnosticsSession,
    diagnostics: &mut Vec<Diagnostic>,
) -> (hosts::ResolvedHosts, FxHashSet<String>) {
    #[cfg(feature = "alloc-trace")]
    let _hosts = crate::alloc_trace::PhaseGuard::enter("hosts");
    let failed: Vec<bool> = (0..view.sources.len())
        .map(|i| view.slots[i].panicked || !view.errors[i].is_empty())
        .collect();
    let inputs = hosts::ResolveInputs {
        sources: view.sources,
        failed: &failed,
        programs: trace_programs,
    };
    let (hosts, host_diagnostics) = hosts::resolve(view.request, inputs, session);
    let traced_jsx = hosts.hosts();
    diagnostics.extend(host_diagnostics);
    (hosts, traced_jsx)
}

/// Independent diagnostics analysis over the unpanicked sources, reporting its facts into
/// the compile session. Each styling file brings the bindings extraction will walk with.
fn analyze_parse(
    view: &ParseView<'_>,
    files: &[Option<extract_parallel::StylingFile<'_>>],
    hosts: &hosts::ResolvedHosts,
    session: &mut diagnostics::DiagnosticsSession,
) {
    #[cfg(feature = "alloc-trace")]
    let _analysis = crate::alloc_trace::PhaseGuard::enter("analysis");
    // Streamed programs are shared from one empty parse the content gate provably skips;
    // so are empty bindings, for every source that is no styling file.
    let dummy_allocator = Allocator::default();
    let dummy = parse_source("streamed.ts", "", &dummy_allocator);
    let no_bindings = extract::ExtractBindings::default();
    let analyzed: Vec<diagnostics::analysis::AnalyzedSource<'_>> = view
        .sources
        .iter()
        .enumerate()
        .filter(|(i, _)| !view.slots[*i].panicked)
        .map(|(i, (path, content))| {
            let program = match view.slots[i].parsed {
                Some(position) if !view.slots[i].streamed => &view.parsed[position].program,
                _ => &dummy.program,
            };
            let bindings = files[i]
                .as_ref()
                .map_or(&no_bindings, |file| &file.bindings);
            diagnostics::analysis::AnalyzedSource {
                path,
                content,
                program,
                bindings,
            }
        })
        .collect();
    let analysis = diagnostics::analysis::AnalysisInput {
        sources: analyzed,
        hosts,
        constants: view.constants,
        system: &view.request.base_system.name,
        composed: view.composed,
    };
    report_analysis_expectations(&analysis, session);
}

/// Extraction over every styling file, then recipe selection over the bindings it
/// collected. The session is dropped inside the phase, so the identity graph is released
/// where the sequential walk released it.
fn extract_walk(
    mut session: ParseSession<'_>,
    view: &ParseView<'_>,
    files: &[Option<extract_parallel::StylingFile<'_>>],
) {
    #[cfg(feature = "alloc-trace")]
    let _extract = crate::alloc_trace::PhaseGuard::enter("extract");
    extract_parallel::extract_all(&mut session, view.sources, files);
    resolve_recipe_selections(&mut session);
    drop(session);
}

/// Harvest over the retained parses: the literal pool, then the mint onto the closed sink
/// list. The pool is returned so the caller keeps it alive to the end of the compile.
fn harvest_walk(view: &ParseView<'_>, sinks: CompileSinks<'_>) -> extract::harvest::HarvestPool {
    #[cfg(feature = "alloc-trace")]
    let _harvest = crate::alloc_trace::PhaseGuard::enter("harvest");
    let skip_harvest: Vec<bool> = view
        .retained
        .iter()
        .map(|&i| string_skip(&view.sources[i].1))
        .collect();
    let pool = extract::harvest::collect_pool(view.parsed, &skip_harvest);
    extract::harvest::mint(extract::harvest::MintCtx {
        pool: &pool,
        sinks: sinks.sinks,
        system: &view.request.base_system,
        wants: sinks.wants,
        authored: sinks.authored,
        diagnostics: sinks.diagnostics,
        sink: sinks.session,
    });
    pool
}

/// Retained-program reuse maps: position-keyed programs for the identity walk, path-keyed
/// programs for the styletrace re-parse. Panicked positions stay out of both (each falls
/// back to bytes, preserving the failure); errored positions stay out of the trace map
/// only, so the entry re-parse reproduces its diagnostic identically.
fn reuse_programs<'a>(
    view: &ParseView<'a>,
) -> (
    FxHashMap<usize, &'a Program<'a>>,
    FxHashMap<PathBuf, &'a Program<'a>>,
) {
    let mut identity = FxHashMap::default();
    let mut trace = FxHashMap::default();
    for (position, &i) in view.retained.iter().enumerate() {
        if view.slots[i].panicked {
            continue;
        }
        identity.insert(i, &view.parsed[position].program);
        if view.errors[i].is_empty() {
            trace.insert(PathBuf::from(&view.sources[i].0), &view.parsed[position].program);
        }
    }
    (identity, trace)
}

/// End-of-compile channel partition. Proof already borrowed the
/// facts and rendered its verdicts; facts are intact, so partition strips
/// every compiler-classified line from default and renders the backchannel
/// only when requested.
pub(super) fn partition_channels(
    result: &mut CompileResult,
    facts: &[diagnostics::DiagnosticFact],
    catalog_sources: Vec<(&str, &str)>,
    render_compiler: bool,
) {
    let catalog = diagnostics::SourceCatalog::new(catalog_sources);
    let channels = diagnostics::DiagnosticChannels::partition(
        facts,
        std::mem::take(&mut result.diagnostics),
        &catalog,
        render_compiler,
    );
    result.diagnostics = channels.userspace;
    result.compiler_diagnostics = if render_compiler {
        Some(channels.compiler)
    } else {
        None
    };
}

/// Resolve tentative recipe selections against every file's bindings.
/// Runs inside the extract block so the identity graph is still alive;
/// the resolved selections cross into assembly with the other sinks.
fn resolve_recipe_selections(session: &mut ParseSession<'_>) {
    let resolved = extract::recipes::selection::resolve_all(
        session.tentative,
        session.recipe_bindings,
        &session.identity,
    );
    session.selections.extend(resolved);
}
