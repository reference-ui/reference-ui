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
use oxc_parser::Parser;
use oxc_span::SourceType;
use std::path::{Path, PathBuf};

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

/// Parse one source: JSX follows the extension (`.tsx` on, `.ts` off),
/// so `.ts`-only `<T>` assertions parse only when JSX is off.
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
