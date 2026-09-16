//! Root crate for the Reference UI native atomic CSS compiler.
//! Orchestrates AST extraction, condition resolution, atomic class naming, and stylesheet assembly across virtual and disk sources.
//! Exposes the primary compilation pipeline and public data structures consumed by build tooling and runtime environments.

pub mod atom;
pub mod diagnostics;
pub mod extract;
pub mod recipes;
#[cfg(test)]
mod spec_recipe_tests;
pub mod resolve;
pub mod runtime;
mod static_css;
pub mod stylesheet;

#[doc(hidden)]
pub use styletrace as __styletrace;

pub use atom::Want;
pub use base_system::{BaseSystem, BreakpointScale, FontDefinition, FontScale};
pub use diagnostics::{Diagnostic, DiagnosticSeverity};
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

use std::collections::HashSet;

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
}

struct ParseSession<'a> {
    constants: &'a extract::constants::LocalConstants,
    breakpoints: &'a BreakpointScale,
    traced_jsx: &'a HashSet<String>,
    wants: &'a mut Vec<Want>,
    recipes: &'a mut Vec<recipes::Recipe>,
    diagnostics: &'a mut Vec<Diagnostic>,
    authored: &'a mut Vec<runtime::AuthoredDeclaration>,
}

/// Compile authored StyleProps into an atomic stylesheet and runtime lookup map.
pub fn compile(request: &CompileRequest) -> Result<CompileResult, String> {
    let sources = collect_sources(request);
    let mut wants = Vec::new();
    let mut extracted_recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let project_constants = collect_project_constants(&sources);
    let traced_jsx = collect_traced_jsx_names(request);
    let system = &request.base_system;

    {
        let mut session = ParseSession {
            constants: &project_constants,
            breakpoints: system.breakpoints(),
            traced_jsx: &traced_jsx,
            wants: &mut wants,
            recipes: &mut extracted_recipes,
            diagnostics: &mut diagnostics,
            authored: &mut authored,
        };
        for (path, content) in &sources {
            parse_and_extract(&mut session, path, content);
        }
    }

    let mut static_ctx = static_css::StaticCssContext {
        system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
    };
    static_css::append_static_css(&mut static_ctx);

    let mut atom_set = build_atom_set(&wants, system, &mut diagnostics);
    resolve::conditions::check_container_root(system, &atom_set, &mut diagnostics);
    let compiled_recipes = compile_recipes(&extracted_recipes, system, &mut diagnostics);
    let mut plan_builder = runtime::PlanBuilder::new(
        &system.name,
        system,
        &mut atom_set,
        &mut diagnostics,
    );
    let style_plans = plan_builder.build(&authored);
    let runtime_recipes = runtime::build_recipe_runtime_tables(&compiled_recipes);
    let runtime = NativeRuntimeArtifact {
        schema_version: 1,
        style_plans,
        recipes: runtime_recipes,
        style_prop_names: runtime::get_style_prop_names(),
    };

    let atom_count = atom_set.len();
    let css = build_css_runtime(&atom_set, &system.name);
    let stylesheet = stylesheet::build_stylesheet_with(&atom_set, system, &compiled_recipes);
    let portable_stylesheet =
        stylesheet::build_portable_stylesheet_with(&atom_set, system, &compiled_recipes);
    let recipe_tables = compiled_recipes
        .into_iter()
        .map(|recipe| recipe.table)
        .collect();

    Ok(CompileResult {
        stylesheet,
        portable_stylesheet,
        runtime,
        css: Some(css),
        diagnostics,
        wants,
        recipes: recipe_tables,
        atom_count,
    })
}

fn collect_sources(request: &CompileRequest) -> Vec<(String, String)> {
    let mut sources = gather_sources(request);
    sources.sort_unstable_by(|a, b| a.0.cmp(&b.0));
    sources
}

fn gather_sources(request: &CompileRequest) -> Vec<(String, String)> {
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return files.iter().map(|f| (f.path.clone(), f.content.clone())).collect();
        }
    }

    let mut sources = Vec::new();
    if let Some(root_dir) = &request.root_dir {
        scan_dir(Path::new(root_dir), &mut sources);
    }
    sources
}

fn scan_dir(dir: &Path, acc: &mut Vec<(String, String)>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<_> = entries.flatten().map(|entry| entry.path()).collect();
    paths.sort();
    for path in paths {
        handle_dir_entry(&path, acc);
    }
}

fn handle_dir_entry(path: &Path, acc: &mut Vec<(String, String)>) {
    if path.is_dir() {
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        const IGNORE: &[&str] = &[
            "node_modules", ".git", "dist", "build", ".turbo", "target", ".reference-ui", ".reference", ".pipeline",
        ];
        if !IGNORE.contains(&name) {
            scan_dir(path, acc);
        }
    } else if is_supported_extension(path) {
        if let Ok(content) = std::fs::read_to_string(path) {
            acc.push((path.to_string_lossy().to_string(), content));
        }
    }
}

fn is_supported_extension(path: &Path) -> bool {
    let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
        return false;
    };
    matches!(ext, "tsx" | "ts" | "jsx" | "js")
}

fn collect_project_constants(sources: &[(String, String)]) -> extract::constants::LocalConstants {
    let mut project_constants = extract::constants::LocalConstants::new();
    for (path, content) in sources {
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(Path::new(path))
            .unwrap_or_default()
            .with_typescript(true)
            .with_jsx(true);
        let parser = Parser::new(&allocator, content, source_type);
        let ret = parser.parse();
        if !ret.panicked {
            let file_constants = extract::constants::collect_local_constants(&ret.program);
            project_constants.merge(&file_constants);
        }
    }
    project_constants
}

fn parse_and_extract(session: &mut ParseSession<'_>, path: &str, content: &str) {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true)
        .with_jsx(true);
    let parser = Parser::new(&allocator, content, source_type);
    let ret = parser.parse();

    for err in ret.errors {
        session
            .diagnostics
            .push(Diagnostic::error(err.to_string()).with_location(path, None, None));
    }
    if !ret.panicked {
        extract_parsed_program(session, path, &ret.program);
    }
}

fn extract_parsed_program(
    session: &mut ParseSession<'_>,
    path: &str,
    program: &oxc_ast::ast::Program<'_>,
) {
    let mut local_constants = extract::constants::collect_local_constants(program);
    local_constants.merge(session.constants);
    let bindings = extract::collect_bindings(program);
    let mut jsx_hosts = bindings.jsx_hosts();
    jsx_hosts.extend(session.traced_jsx.iter().cloned());
    let config = extract::ExtractConfig {
        constants: &local_constants,
        breakpoints: session.breakpoints,
        bindings: &bindings,
        jsx_hosts: &jsx_hosts,
        shadowed: &[],
    };
    let sinks = extract::ExtractSinks {
        wants: session.wants,
        recipes: session.recipes,
        diagnostics: session.diagnostics,
        authored: session.authored,
    };
    let mut ctx = extract::ExtractContext::new(path, config, sinks);
    extract::extract_with_context(program, &mut ctx);
}

fn collect_traced_jsx_names(request: &CompileRequest) -> HashSet<String> {
    let Some(root) = request.root_dir.as_ref() else {
        return HashSet::new();
    };
    match styletrace::trace_style_jsx_names(Path::new(root)) {
        Ok(names) => names.into_iter().collect(),
        Err(_) => HashSet::new(),
    }
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
            diagnostics.push(Diagnostic::error(format!(
                "Duplicate recipe className '{}' within system '{}'",
                recipe.class_name, system.name
            )));
        } else {
            valid.push(recipe.clone());
        }
    }
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compile_seed_contract() {
        let req = CompileRequest::default();
        let res = compile(&req).expect("compile seed contract");
        assert!(res
            .stylesheet
            .starts_with("@layer reset, global, base, tokens, recipes, utilities;"));
        assert!(res.css.as_ref().is_some_and(|c| c.is_empty()));
        assert!(res.runtime.style_plans.is_empty());
        assert!(res.diagnostics.is_empty());
        assert!(!res.stylesheet.contains("--colors-"));
    }
}
