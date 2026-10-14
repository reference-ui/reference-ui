//! The parse phase of one compile: indexes the request's sources, runs the serial
//! parse, analyze, extract and harvest walks into the compile sinks, and reports the
//! resolved hosts that assembly publishes. It also partitions the result's channels
//! once proof has read the facts, so the default and backchannel outputs split cleanly.
//! Takes the request, the in-memory sources and the sinks; emits the unpanicked source
//! index and the traced hosts.

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

fn run_parse_serial(
    request: &CompileRequest,
    sources: &[(String, String)],
    sinks: CompileSinks<'_>,
) -> (Vec<usize>, hosts::ResolvedHosts) {
    let CompileSinks {
        wants,
        recipes,
        diagnostics,
        authored,
        sinks,
        session,
        tentative,
        recipe_bindings,
        selections,
    } = sinks;
    // Retained parses live for this phase; streamed files parse transiently
    // in the constants pass and keep only errors, constants, and staged
    // records+bags. Programs are never co-resident for streamed files.
    #[cfg(feature = "alloc-trace")]
    let _parse = crate::alloc_trace::PhaseGuard::enter("parse");
    let mut slots: Vec<stream::SourceSlot> = sources
        .iter()
        .map(|(_, content)| stream::SourceSlot::new(streaming_candidate(content)))
        .collect();
    let retained: Vec<usize> = (0..sources.len()).filter(|&i| !slots[i].streamed).collect();
    let allocators: Vec<Allocator> = retained.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<_> = retained
        .iter()
        .zip(allocators.iter())
        .map(|(&i, allocator)| parse_source(&sources[i].0, &sources[i].1, allocator))
        .collect();
    for (position, &i) in retained.iter().enumerate() {
        slots[i].parsed = Some(position);
        slots[i].panicked = parsed[position].panicked;
    }
    #[cfg(feature = "alloc-trace")]
    drop(_parse);
    #[cfg(feature = "alloc-trace")]
    let _constants = crate::alloc_trace::PhaseGuard::enter("constants");
    let mut project_constants = extract::constants::LocalConstants::new();
    let transient = stream::merge_constants_ordered(sources, &parsed, &mut slots, &mut project_constants);
    #[cfg(feature = "alloc-trace")]
    drop(_constants);
    #[cfg(feature = "alloc-trace")]
    let _graphs = crate::alloc_trace::PhaseGuard::enter("graphs");
    let unpanicked = stream::unpanicked_index(&slots);
    let live = stream::live_retained_sources(sources, &parsed, &retained, &slots);
    let mut graph =
        extract::resolver::ValueGraph::new(sources, &live, transient.staged, &project_constants);
    let (identity_programs, trace_programs) = reuse_programs(
        sources,
        &parsed,
        &retained,
        &slots,
        &transient.errors,
    );
    let identity =
        extract::identity::IdentityGraph::with_programs(sources, &identity_programs);
    #[cfg(feature = "alloc-trace")]
    drop(_graphs);
    // Parse-failure keep-alive (C1): failed sources keep their trace
    // entry, so the re-parse fails identically and the located warning
    // survives. The bench load reports zero parse errors, so the gate
    // still skips every dead file. Per-source via slots+transient (C3
    // streams: `parsed` holds retained files only, so indexing it here
    // would misalign and blind the keep-alive to streamed failures).
    #[cfg(feature = "alloc-trace")]
    let _hosts = crate::alloc_trace::PhaseGuard::enter("hosts");
    let failed: Vec<bool> = (0..sources.len())
        .map(|i| slots[i].panicked || !transient.errors[i].is_empty())
        .collect();
    let (hosts, host_diagnostics) =
        hosts::resolve(request, sources, &failed, session, &trace_programs);
    let traced_jsx = hosts.hosts();
    diagnostics.extend(host_diagnostics);
    #[cfg(feature = "alloc-trace")]
    drop(_hosts);
    // Independent diagnostics analysis (S2): same slots for_compile builds,
    // with streamed programs shared from one empty parse the content gate
    // provably skips before reading.
    #[cfg(feature = "alloc-trace")]
    let _analysis = crate::alloc_trace::PhaseGuard::enter("analysis");
    let dummy_allocator = Allocator::default();
    let dummy = parse_source("streamed.ts", "", &dummy_allocator);
    let analyzed: Vec<diagnostics::analysis::AnalyzedSource<'_>> = sources
        .iter()
        .enumerate()
        .filter(|(i, _)| !slots[*i].panicked)
        .map(|(i, (path, content))| {
            let program = match slots[i].parsed {
                Some(position) if !slots[i].streamed => &parsed[position].program,
                _ => &dummy.program,
            };
            diagnostics::analysis::AnalyzedSource {
                path,
                content,
                program,
            }
        })
        .collect();
    // Qualifier plumbing (G0 §E/R1): the same helper `finish` calls, called
    // here too so analysis and assembly cannot diverge.
    let qualifiers =
        assembly::qualifiers_for(&request.base_system.name, &request.upstream_systems);
    let analysis = diagnostics::analysis::AnalysisInput {
        sources: analyzed,
        hosts: &hosts,
        constants: &project_constants,
        system: &request.base_system.name,
        qualifiers: &qualifiers,
    };
    report_analysis_expectations(&analysis, session);
    stream::report_parse_errors(sources, &transient.errors, diagnostics);
    #[cfg(feature = "alloc-trace")]
    drop(_analysis);
    let system = &request.base_system;

    #[cfg(feature = "alloc-trace")]
    let _extract = crate::alloc_trace::PhaseGuard::enter("extract");
    {
        let mut extract_session = ParseSession {
            constants: &project_constants,
            resolver: &mut graph,
            identity,
            breakpoints: system.breakpoints(),
            traced_jsx: &traced_jsx,
            owned_props: &hosts.owned_props,
            wants,
            recipes,
            diagnostics,
            authored,
            sinks,
            session,
            tentative,
            recipe_bindings,
            selections,
        };
        extract_parallel::extract_all(&mut extract_session, sources, &parsed, &slots);
        resolve_recipe_selections(&mut extract_session);
    }
    #[cfg(feature = "alloc-trace")]
    drop(_extract);

    // Harvest rides the retained parse: streamed files hold no string
    // delimiters, so their absence merges the identity element, exactly as
    // the mask does today. The mask stays aligned with the retained parse.
    #[cfg(feature = "alloc-trace")]
    let _harvest = crate::alloc_trace::PhaseGuard::enter("harvest");
    let skip_harvest: Vec<bool> = retained
        .iter()
        .map(|&i| string_skip(&sources[i].1))
        .collect();
    let pool = extract::harvest::collect_pool(&parsed, &skip_harvest);
    extract::harvest::mint(extract::harvest::MintCtx {
        pool: &pool,
        sinks,
        system,
        wants,
        authored,
        diagnostics,
        sink: session,
    });
    #[cfg(feature = "alloc-trace")]
    drop(_harvest);
    (unpanicked, hosts)
}

/// Slice 5 end-of-compile channel partition. Proof already borrowed the
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
