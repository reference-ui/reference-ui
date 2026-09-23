//! Root crate for the Reference UI native atomic CSS compiler.
//! Orchestrates AST extraction, condition resolution, atomic class naming, and stylesheet assembly across virtual and disk sources.
//! Exposes the primary compilation pipeline and public data structures consumed by build tooling and runtime environments.

#[cfg(feature = "alloc-trace")]
pub mod alloc_counters;
#[cfg(feature = "alloc-trace")]
pub mod alloc_trace;
mod assembly;
pub mod atom;
pub mod diagnostics;
pub mod extract;
mod extract_parallel;
#[cfg(test)]
mod goldens;
pub mod hosts;
pub mod includes;
mod lanes;
mod phase_commit;
mod phase_gate;
mod phase_lane;
mod phase_merge;
mod phase_parallel;
mod phase_walk;
pub mod recipes;
pub mod resolve;
mod resolve_pool;
pub mod runtime;
pub mod scan;
pub(crate) mod sources;
#[cfg(test)]
mod spec_recipe_tests;
mod static_css;
pub(crate) mod stream;
pub mod stylesheet;
#[cfg(test)]
mod tests;
mod types;
pub mod wire;

#[doc(hidden)]
pub use styletrace as __styletrace;

pub use atom::Want;
pub use base_system::{BaseSystem, BreakpointScale, FontDefinition, FontScale};
pub use diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity};
pub use recipes::{RecipeMatch, RecipeTable};
pub use runtime::{
    get_style_prop_names, CssRuntime, FontTable, NamerTables, NativeRuntimeArtifact,
    RecipeRuntimeTable, RuntimeDeclaration, RuntimeStylePlan, NAMER_RULES_VERSION,
};
pub use stylesheet::StylesheetOutput;
pub use types::{CompileRequest, CompileResult, VirtualSource};

use oxc_allocator::Allocator;
use oxc_ast::ast::Program;
use oxc_parser::Parser;
use oxc_span::SourceType;
use std::path::{Path, PathBuf};

use std::collections::{BTreeMap, BTreeSet};

use diagnostics::DiagnosticSink;
use lanes::{Lanes, WorkKind};
use rustc_hash::{FxHashMap, FxHashSet};

struct ParseSession<'a> {
    constants: &'a extract::constants::LocalConstants,
    resolver: &'a mut extract::resolver::ValueGraph<'a>,
    identity: extract::identity::IdentityGraph<'a>,
    breakpoints: &'a BreakpointScale,
    traced_jsx: &'a FxHashSet<String>,
    owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    wants: &'a mut Vec<Want>,
    recipes: &'a mut Vec<recipes::Recipe>,
    diagnostics: &'a mut Vec<Diagnostic>,
    authored: &'a mut Vec<runtime::AuthoredDeclaration>,
    sinks: &'a mut Vec<extract::harvest::Sink>,
    session: &'a mut diagnostics::DiagnosticsSession,
    tentative: &'a mut Vec<extract::recipes::selection::TentativeSelection>,
    recipe_bindings: &'a mut Vec<extract::recipes::selection::RecipeBinding>,
    selections: &'a mut Vec<extract::recipes::selection::RecipeSelection>,
}

/// Mutable sinks the parse phase fills; assembly consumes them after the
/// allocators, programs, constants, and graphs drop at phase end.
struct CompileSinks<'a> {
    wants: &'a mut Vec<Want>,
    recipes: &'a mut Vec<recipes::Recipe>,
    diagnostics: &'a mut Vec<Diagnostic>,
    authored: &'a mut Vec<runtime::AuthoredDeclaration>,
    sinks: &'a mut Vec<extract::harvest::Sink>,
    session: &'a mut diagnostics::DiagnosticsSession,
    tentative: &'a mut Vec<extract::recipes::selection::TentativeSelection>,
    recipe_bindings: &'a mut Vec<extract::recipes::selection::RecipeBinding>,
    selections: &'a mut Vec<extract::recipes::selection::RecipeSelection>,
}

/// Compile authored StyleProps into an atomic stylesheet and runtime lookup map.
pub fn compile(request: &CompileRequest) -> Result<CompileResult, String> {
    #[cfg(feature = "alloc-trace")]
    let _collect = crate::alloc_trace::PhaseGuard::enter("collect");
    let sources = match sources::collect_checked(request) {
        Ok(sources) => sources,
        Err((code, message)) => return Ok(token_rejection(code, message)),
    };
    #[cfg(feature = "alloc-trace")]
    drop(_collect);
    let system = &request.base_system;
    let mut wants = Vec::new();
    let mut extracted_recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let mut harvest_sinks = Vec::new();
    let mut tentative = Vec::new();
    let mut recipe_bindings = Vec::new();
    let mut selections = Vec::new();
    // One compile-long diagnostics session (S3): analysis reports first,
    // then producers; proof and the S5 partition render from it at the end.
    let mut diag_session = diagnostics::DiagnosticsSession::new();
    // Parse phase: allocators, programs, constants, graphs, and the
    // analysis input borrow the sources and die inside. Only the filled
    // sinks plus the resolved hosts and the catalog index cross into
    // assembly, so each peak holds one phase at a time.
    let sinks = CompileSinks {
        wants: &mut wants,
        recipes: &mut extracted_recipes,
        diagnostics: &mut diagnostics,
        authored: &mut authored,
        sinks: &mut harvest_sinks,
        session: &mut diag_session,
        tentative: &mut tentative,
        recipe_bindings: &mut recipe_bindings,
        selections: &mut selections,
    };
    let (unpanicked, resolved_hosts) = run_parse_phase(request, &sources, sinks)?;

    #[cfg(feature = "alloc-trace")]
    let _assembly = crate::alloc_trace::PhaseGuard::enter("assembly");
    let mut assembly = assembly::AssembleCtx {
        wants,
        extracted_recipes,
        diagnostics,
        authored,
        traced: resolved_hosts.traced,
        proof: request.wants_proof(),
        selections,
    };
    assembly.append_static(system);
    let mut result = assembly.finish(system, &mut diag_session);
    #[cfg(feature = "alloc-trace")]
    drop(_assembly);
    #[cfg(feature = "alloc-trace")]
    let _partition = crate::alloc_trace::PhaseGuard::enter("partition");
    // The partition catalog is the unpanicked sources in input order: exactly
    // the entries analysis held, rebuilt from the retained texts and index.
    let catalog: Vec<(&str, &str)> = unpanicked
        .iter()
        .map(|&i| (sources[i].0.as_str(), sources[i].1.as_str()))
        .collect();
    partition_channels(
        &mut result,
        diag_session.facts(),
        catalog,
        request.wants_compiler_logs(),
    );
    #[cfg(feature = "alloc-trace")]
    drop(_partition);
    Ok(result)
}

/// Preamble-only artifact carrying a scan/compile contract rejection (the
/// exactly-one-of and token-lifecycle failures); mirrors the napi rejection.
fn token_rejection(code: DiagnosticCode, message: String) -> CompileResult {
    let preamble = stylesheet::layers::LAYER_PREAMBLE.to_string();
    CompileResult {
        stylesheet: preamble.clone(),
        portable_stylesheet: preamble,
        runtime: NativeRuntimeArtifact::default(),
        style_plans: Vec::new(),
        css: Some(CssRuntime::new()),
        diagnostics: vec![Diagnostic::error(code, message)],
        wants: Vec::new(),
        recipes: Vec::new(),
        atom_count: 0,
        traced_jsx_hosts: Vec::new(),
        compiler_diagnostics: None,
    }
}

/// Parse, analyze, extract, and harvest one compile into the sinks.
/// Returns the unpanicked source index in input order (the partition
/// catalog) plus the resolved hosts assembly names as traced.
fn run_parse_phase(
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
    let analysis = diagnostics::analysis::AnalysisInput {
        sources: analyzed,
        hosts: &hosts,
        constants: &project_constants,
        system: &request.base_system.name,
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
fn partition_channels(
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

/// True when a file's bytes cannot feed the styling walks (scope, extract,
/// diagnostics analysis): live css/recipe bindings need an import or the
/// reserved alias, member forms need their prop bytes, and every JSX path
/// needs `<`. Conservative: any needle present runs the full walks.
pub(crate) fn styling_skip(content: &str) -> bool {
    !content.contains("import")
        && !content.contains("css")
        && !content.contains("recipe")
        && !content.contains('<')
}

/// True when a file's bytes hold no string literal for the harvest pool:
/// every StringLiteral needs a quote, every TemplateLiteral a backtick.
pub(crate) fn string_skip(content: &str) -> bool {
    !content.contains('\'') && !content.contains('"') && !content.contains('`')
}

/// True when a file streams: no styling signal (the extract, scope, and
/// analysis gates) and no string delimiter (the harvest mask). Retained
/// files parse co-resident exactly as today; streamed files parse
/// transiently and drop program+allocator after staging.
pub(crate) fn streaming_candidate(content: &str) -> bool {
    styling_skip(content) && string_skip(content)
}

/// Parse one source: JSX follows the extension (`.tsx` on, `.ts` off),
/// so `.ts`-only `<T>` assertions parse only when JSX is off (SPEC-V2-07).
/// Shared with the resolver's streamed refinement, which re-parses the same
/// bytes the staging pass already screened.
pub(crate) fn parse_source<'a>(
    path: &str,
    content: &'a str,
    allocator: &'a Allocator,
) -> oxc_parser::ParserReturn<'a> {
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    Parser::new(allocator, content, source_type).parse()
}

/// Retained-program reuse maps: position-keyed programs for the identity
/// walk, path-keyed programs for the styletrace re-parse. Panicked
/// positions stay out of both (each falls back to bytes, preserving the
/// failure); errored positions stay out of the trace map only, so the
/// entry re-parse reproduces its diagnostic identically.
fn reuse_programs<'a>(
    sources: &'a [(String, String)],
    parsed: &'a [oxc_parser::ParserReturn<'a>],
    retained: &[usize],
    slots: &[stream::SourceSlot],
    errors: &[Vec<(String, Option<u32>)>],
) -> (
    FxHashMap<usize, &'a Program<'a>>,
    FxHashMap<PathBuf, &'a Program<'a>>,
) {
    let mut identity = FxHashMap::default();
    let mut trace = FxHashMap::default();
    for (position, &i) in retained.iter().enumerate() {
        if slots[i].panicked {
            continue;
        }
        identity.insert(i, &parsed[position].program);
        if errors[i].is_empty() {
            trace.insert(PathBuf::from(&sources[i].0), &parsed[position].program);
        }
    }
    (identity, trace)
}

/// Report the independent diagnostics analysis expectations into the
/// compile session. Renders nothing; Slice 4 joins proof from these facts
/// after plans exist.
fn report_analysis_expectations(
    analysis: &diagnostics::analysis::AnalysisInput<'_>,
    session: &mut diagnostics::DiagnosticsSession,
) {
    for fact in diagnostics::analysis::analyze(analysis) {
        session.report(fact);
    }
}
