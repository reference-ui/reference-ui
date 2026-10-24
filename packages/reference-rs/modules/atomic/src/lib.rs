//! Root crate for the Reference UI native atomic CSS compiler.
//! Orchestrates AST extraction, condition resolution, atomic class naming, and stylesheet assembly across virtual and disk sources.
//! Exposes the primary compilation pipeline and public data structures consumed by build tooling and runtime environments.
//! When a pooled lane panics, `compile` returns the panic as its `Err` string rather than unwinding into the caller.

#[cfg(feature = "alloc-trace")]
pub mod alloc_counters;
#[cfg(feature = "alloc-trace")]
pub mod alloc_trace;
mod assembly;
pub mod atom;
mod depth;
pub mod diagnostics;
pub mod extract;
mod extract_parallel;
#[cfg(test)]
mod goldens;
pub mod hosts;
pub mod includes;
mod lanes;
mod parse_phase;
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
use oxc_diagnostics::OxcDiagnostic;
use oxc_parser::ParserReturn;
use oxc_span::{SourceType, Span};
use shared::parse::{NestingRefusal, ScreenedSource};
use std::path::PathBuf;

use std::collections::BTreeMap;

use diagnostics::DiagnosticSink;
use lanes::{Lanes, WorkKind};
use rustc_hash::{FxHashMap, FxHashSet};
use parse_phase::{partition_channels, run_parse_phase};

struct ParseSession<'a> {
    constants: &'a extract::constants::LocalConstants,
    resolver: &'a mut extract::resolver::ValueGraph<'a>,
    identity: extract::identity::IdentityGraph<'a>,
    breakpoints: &'a BreakpointScale,
    traced_jsx: &'a FxHashSet<String>,
    hosts: &'a hosts::ResolvedHosts,
    composed: &'a extract::Composed<'a>,
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
    let (sources, _backfill_outcome) = match sources::collect_checked(request) {
        Ok(collected) => collected,
        Err((code, message)) => return Ok(token_rejection(code, message)),
    };
    let sources = screen_sources(sources);
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
    // One compile-long diagnostics session: analysis reports first,
    // then producers; proof and the partition render from it at the end.
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
        owned: resolved_hosts.owned_props,
        proof: request.wants_proof(),
        selections,
        upstream_container_root: request.upstream_container_root,
        upstream_systems: request.upstream_systems.clone(),
        extended_systems: request.extended_systems.clone(),
    };
    assembly.append_static(system);
    let mut result = assembly.finish(system, &mut diag_session)?;
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
/// exactly-one-of and token-lifecycle failures, and an include pattern past
/// the brace limits); mirrors the napi rejection.
fn token_rejection(code: DiagnosticCode, message: String) -> CompileResult {
    let preamble = stylesheet::layers::LAYER_PREAMBLE.to_string();
    CompileResult {
        stylesheet: preamble.clone(),
        portable_stylesheet: preamble,
        streams: stylesheet::StylesheetStreams::preamble_only(),
        runtime: NativeRuntimeArtifact::default(),
        style_plans: Vec::new(),
        css: Some(CssRuntime::new()),
        diagnostics: vec![Diagnostic::error(code, message)],
        wants: Vec::new(),
        recipes: Vec::new(),
        atom_count: 0,
        traced_jsx_hosts: Vec::new(),
        traced_jsx_owned: BTreeMap::new(),
        compiler_diagnostics: None,
    }
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

/// One collected source: its path, and its text with the nesting gate's verdict.
/// The gate ran once when the compile screened the source, and every atomic parse reads that verdict.
pub type Source = (String, ScreenedSource);

/// The type every parse of `path` uses: the extension's type, with TypeScript on.
/// Screening and parsing both call this, so a carried verdict matches the parse that reads it.
pub(crate) fn source_type_of(path: &str) -> SourceType {
    SourceType::from_path(path)
        .unwrap_or_default()
        .with_typescript(true)
}

/// Screens each collected source once: the gate runs here, and the verdict travels with the text.
/// Each path and text moves into its element, so no source text is copied.
pub(crate) fn screen_sources(pairs: Vec<(String, String)>) -> Vec<Source> {
    pairs
        .into_iter()
        .map(|(path, content)| {
            let screened = ScreenedSource::screen(content, source_type_of(&path));
            (path, screened)
        })
        .collect()
}

/// Parse one screened source: JSX follows the extension (`.tsx` on, `.ts` off),
/// so `.ts`-only `<T>` assertions parse only when JSX is off.
/// The verdict travels with the text, so this never scans. A source the gate
/// refused is never handed to Oxc, and a program whose AST nests past the
/// depth gate is dropped before any walker sees it; both come back as a failed parse.
pub(crate) fn parse_source<'a>(
    source: &'a ScreenedSource,
    allocator: &'a Allocator,
) -> ParserReturn<'a> {
    match shared::parse::parse_screened(allocator, source) {
        Ok(parsed) => match depth::check(&parsed.program) {
            Ok(()) => parsed,
            Err(refusal) => refused_deep(allocator, source, refusal),
        },
        Err(refusal) => {
            refused_at_line(allocator, source, refusal.line, refusal.message())
        }
    }
}

/// The failed parse for a program the depth gate refused, located at the start of the line of the node
/// that crossed the limit.
fn refused_deep<'a>(
    allocator: &'a Allocator,
    source: &ScreenedSource,
    refusal: depth::DepthRefusal,
) -> ParserReturn<'a> {
    let line = diagnostics::line_col(source.as_str(), refusal.offset).map_or(1, |(line, _)| line);
    refused_at_line(allocator, source, line, depth::DepthRefusal::message(line))
}

/// The failed parse for a refused source: Oxc's empty program with `panicked` set, and `message` as its one error,
/// located at the start of `line`. The parse-error path reports it as ATM-E-PARSE.
fn refused_at_line<'a>(
    allocator: &'a Allocator,
    source: &ScreenedSource,
    line: u32,
    message: String,
) -> ParserReturn<'a> {
    let mut parsed = shared::parse::refused_parser_return(allocator, source.source_type());
    let start = shared::parse::line_start(source.as_str(), line);
    parsed
        .errors
        .push(OxcDiagnostic::error(message).with_label(Span::new(start, start)));
    parsed
}

/// Report the independent diagnostics analysis expectations into the
/// compile session. Renders nothing; proof joins from these facts
/// after plans exist.
fn report_analysis_expectations(
    analysis: &diagnostics::analysis::AnalysisInput<'_>,
    session: &mut diagnostics::DiagnosticsSession,
) {
    for fact in diagnostics::analysis::analyze(analysis) {
        session.report(fact);
    }
}
