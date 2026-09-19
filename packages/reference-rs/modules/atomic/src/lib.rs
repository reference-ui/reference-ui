//! Root crate for the Reference UI native atomic CSS compiler.
//! Orchestrates AST extraction, condition resolution, atomic class naming, and stylesheet assembly across virtual and disk sources.
//! Exposes the primary compilation pipeline and public data structures consumed by build tooling and runtime environments.

pub mod atom;
mod assembly;
pub mod diagnostics;
pub mod extract;
pub mod hosts;
pub mod includes;
pub mod recipes;
pub mod resolve;
pub mod runtime;
pub(crate) mod sources;
#[cfg(test)]
mod spec_recipe_tests;
mod static_css;
pub mod stylesheet;
#[cfg(test)]
mod tests;

#[doc(hidden)]
pub use styletrace as __styletrace;

pub use atom::Want;
pub use base_system::{BaseSystem, BreakpointScale, FontDefinition, FontScale};
pub use diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity};
pub use recipes::{RecipeMatch, RecipeTable};
pub use runtime::{
    get_style_prop_names, CssRuntime, NativeRuntimeArtifact, RecipeRuntimeTable,
    RuntimeDeclaration, RuntimeStylePlan,
};
pub use stylesheet::StylesheetOutput;

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::{Deserialize, Serialize};
use std::path::Path;

use std::collections::{BTreeMap, BTreeSet, HashSet};

use crate::atom::AtomSet;

/// In-memory source file to compile.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualSource {
    pub path: String,
    pub content: String,
}

/// Request to compile project or virtual sources into atomic CSS.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileRequest {
    #[serde(default, alias = "root_dir")]
    pub root_dir: Option<String>,
    #[serde(default)]
    pub files: Option<Vec<VirtualSource>>,
    pub base_system: BaseSystem,
    #[serde(default)]
    pub jsx_hosts: Option<Vec<String>>,
    #[serde(default)]
    pub declaration_root: Option<String>,
    /// Glob scope (RS-10): only matching sources compile; absent or empty scans all.
    #[serde(default)]
    pub include: Option<Vec<String>>,
}

/// Compilation artifact bundle containing stylesheet, runtime metadata, and diagnostics.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    pub stylesheet: String,
    #[serde(default)]
    pub portable_stylesheet: String,
    pub runtime: NativeRuntimeArtifact,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub css: Option<CssRuntime>,
    pub diagnostics: Vec<Diagnostic>,
    #[serde(default)]
    pub wants: Vec<Want>,
    #[serde(default)]
    pub recipes: Vec<RecipeTable>,
    #[serde(default)]
    pub atom_count: usize,
    /// Component names StyleTrace discovered in this compile (sorted,
    /// unique). Neo publishes configured ∪ traced downstream.
    #[serde(default)]
    pub traced_jsx_hosts: Vec<String>,
}

struct ParseSession<'a> {
    constants: &'a extract::constants::LocalConstants,
    resolver: &'a mut extract::resolver::ValueGraph<'a>,
    identity: extract::identity::IdentityGraph<'a>,
    breakpoints: &'a BreakpointScale,
    traced_jsx: &'a HashSet<String>,
    owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    wants: &'a mut Vec<Want>,
    recipes: &'a mut Vec<recipes::Recipe>,
    diagnostics: &'a mut Vec<Diagnostic>,
    authored: &'a mut Vec<runtime::AuthoredDeclaration>,
    sinks: &'a mut Vec<extract::harvest::Sink>,
}

/// Compile authored StyleProps into an atomic stylesheet and runtime lookup map.
pub fn compile(request: &CompileRequest) -> Result<CompileResult, String> {
    let sources = sources::collect(request);
    // One parse per source: allocators and programs live for the whole
    // compile, so constants, the value graph, and extraction share them.
    let allocators: Vec<Allocator> = sources.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<_> = sources
        .iter()
        .zip(allocators.iter())
        .map(|((path, content), allocator)| parse_source(path, content, allocator))
        .collect();
    let mut wants = Vec::new();
    let mut extracted_recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let mut harvest_sinks = Vec::new();
    let project_constants = collect_project_constants(&sources, &parsed);
    let mut graph = extract::resolver::ValueGraph::new(&sources, &parsed, &project_constants);
    let identity = extract::identity::IdentityGraph::new(&sources);
    let (resolved_hosts, host_diagnostics) = hosts::resolve(request);
    let traced_jsx = resolved_hosts.hosts();
    diagnostics.extend(host_diagnostics);
    report_parse_errors(&sources, &parsed, &mut diagnostics);
    let system = &request.base_system;

    {
        let mut session = ParseSession {
            constants: &project_constants,
            resolver: &mut graph,
            identity,
            breakpoints: system.breakpoints(),
            traced_jsx: &traced_jsx,
            owned_props: &resolved_hosts.owned_props,
            wants: &mut wants,
            recipes: &mut extracted_recipes,
            diagnostics: &mut diagnostics,
            authored: &mut authored,
            sinks: &mut harvest_sinks,
        };
        extract_all_sources(&mut session, &sources, &parsed);
    }

    // Harvest rides the same parse: the pool crosses the refused sinks into
    // the wants and authored declarations the site walk filled.
    let pool = extract::harvest::collect_pool(&parsed);
    extract::harvest::mint(extract::harvest::MintCtx {
        pool: &pool,
        sinks: &harvest_sinks,
        system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
    });

    let mut assembly = assembly::AssembleCtx {
        wants,
        extracted_recipes,
        diagnostics,
        authored,
        traced: resolved_hosts.traced,
    };
    assembly.append_static(system);
    Ok(assembly.finish(system))
}

/// Extract every unpanicked source through the shared session.
fn extract_all_sources(
    session: &mut ParseSession<'_>,
    sources: &[(String, String)],
    parsed: &[oxc_parser::ParserReturn<'_>],
) {
    for ((path, content), ret) in sources.iter().zip(parsed.iter()) {
        if !ret.panicked {
            extract_parsed_program(session, path, content, &ret.program);
        }
    }
}

/// Parse one source: JSX follows the extension (`.tsx` on, `.ts` off),
/// so `.ts`-only `<T>` assertions parse only when JSX is off (SPEC-V2-07).
fn parse_source<'a>(
    path: &str,
    content: &'a str,
    allocator: &'a Allocator,
) -> oxc_parser::ParserReturn<'a> {
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    Parser::new(allocator, content, source_type).parse()
}

/// Report every source's parse errors, in source order.
fn report_parse_errors(
    sources: &[(String, String)],
    parsed: &[oxc_parser::ParserReturn<'_>],
    diagnostics: &mut Vec<Diagnostic>,
) {
    for ((path, content), ret) in sources.iter().zip(parsed.iter()) {
        for err in &ret.errors {
            let offset = err
                .labels
                .as_ref()
                .and_then(|labels| labels.first())
                .map(|label| label.offset() as u32);
            let (line, column) = offset
                .and_then(|start| crate::diagnostics::line_col(content, start))
                .unzip();
            diagnostics.push(
                Diagnostic::error(DiagnosticCode::ParseError, err.to_string())
                    .with_location(path, line, column),
            );
        }
    }
}

fn collect_project_constants(
    sources: &[(String, String)],
    parsed: &[oxc_parser::ParserReturn<'_>],
) -> extract::constants::LocalConstants {
    let mut project_constants = extract::constants::LocalConstants::new();
    for ((path, content), ret) in sources.iter().zip(parsed.iter()) {
        if !ret.panicked {
            let file_constants = extract::constants::collect_local_constants(
                &ret.program,
                path,
                Some(content.as_str()),
            );
            project_constants.merge(&file_constants);
        }
    }
    project_constants
}

fn extract_parsed_program(
    session: &mut ParseSession<'_>,
    path: &str,
    content: &str,
    program: &oxc_ast::ast::Program<'_>,
) {
    // Locals resolve through this file's scope table; imports answer from
    // the resolver map only, with the bag behind for unbound names. Baked
    // entries strip against the name-wide mutation set.
    let table = extract::scope::collect(program, session.constants);
    let imports = table.import_refs();
    let values = session.resolver.resolve_file_imports(path, &imports);
    let lookup = extract::scope::ImportLookup::Binding {
        values: &values,
        fallback: session.constants,
    };
    let chain = extract::scope::ScopeChain::new(&table, lookup);
    let bindings = extract::collect_bindings_with_identity(program, path, &session.identity);
    let mut jsx_hosts = bindings.jsx_hosts();
    jsx_hosts.extend(session.traced_jsx.iter().cloned());
    let config = extract::ExtractConfig {
        chain,
        breakpoints: session.breakpoints,
        bindings: &bindings,
        jsx_hosts: &jsx_hosts,
        owned_props: session.owned_props,
        shadowed: &[],
    };
    let sinks = extract::ExtractSinks {
        wants: session.wants,
        recipes: session.recipes,
        diagnostics: session.diagnostics,
        authored: session.authored,
        sinks: session.sinks,
    };
    let mut ctx = extract::ExtractContext::new(path, Some(content), config, sinks);
    extract::extract_with_context(program, &mut ctx);
}

fn build_atom_set(
    wants: &[Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
) -> AtomSet {
    let mut atom_set = AtomSet::new();
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
    };
    for want in wants {
        for atom in resolve::resolve_want_with(want, &mut session) {
            atom_set.insert(atom);
        }
    }
    atom_set
}

fn compile_recipes(
    extracted: &[recipes::Recipe],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<recipes::CompiledRecipe> {
    let spec_recipes = recipes::from_spec(&system.recipes, diagnostics);
    let mut seen = std::collections::HashSet::new();
    let mut valid = Vec::new();
    for recipe in spec_recipes.iter().chain(extracted.iter()) {
        if !seen.insert(&recipe.class_name) {
            diagnostics.push(recipe.location.error(
                DiagnosticCode::DuplicateRecipe,
                format!(
                    "Duplicate recipe className '{}' within system '{}'",
                    recipe.class_name, system.name
                ),
            ));
        } else {
            valid.push(recipe.clone());
        }
    }
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
    };
    recipes::compile(&valid, &system.name, &mut session)
}

fn build_css_runtime(atom_set: &AtomSet, system: &str) -> CssRuntime {
    let mut runtime = CssRuntime::new();
    for atom in atom_set {
        let c_name = stylesheet::name::class_name_with_system(atom, system);
        let val_key = atom.value.class_name_str();
        let key = if atom.conditions.is_empty() {
            format!("{}:{}", atom.prop, val_key)
        } else {
            let conds: Vec<&str> = atom.conditions.iter().map(atom::When::authored).collect();
            format!("{}:{}:{}", conds.join(":"), atom.prop, val_key)
        };
        runtime.insert(key, c_name);
    }
    runtime
}
