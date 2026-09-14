//! Root crate for the Reference UI native atomic CSS compiler.
//! Orchestrates AST extraction, condition resolution, atomic class naming, and stylesheet assembly across virtual and disk sources.
//! Exposes the primary compilation pipeline and public data structures consumed by build tooling and runtime environments.

pub mod atom;
pub mod config;
pub mod diagnostics;
pub mod extract;
pub mod resolve;
pub mod runtime;
pub mod stylesheet;

#[doc(hidden)]
pub use styletrace as __styletrace;

pub use atom::Want;
pub use diagnostics::{Diagnostic, DiagnosticSeverity};
pub use runtime::CssRuntime;
pub use stylesheet::StylesheetOutput;

use std::path::Path;
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use serde::{Deserialize, Serialize};

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
}

/// Compilation artifact bundle containing stylesheet, runtime metadata, and diagnostics.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    pub stylesheet: String,
    pub css: CssRuntime,
    pub diagnostics: Vec<Diagnostic>,
    #[serde(default)]
    pub wants: Vec<Want>,
}

struct ParseSession<'a> {
    constants: &'a extract::constants::LocalConstants,
    wants: &'a mut Vec<Want>,
    diagnostics: &'a mut Vec<Diagnostic>,
}

/// Compile authored StyleProps into an atomic stylesheet and runtime lookup map.
pub fn compile(request: &CompileRequest) -> Result<CompileResult, String> {
    let sources = collect_sources(request);
    let mut wants = Vec::new();
    let mut diagnostics = Vec::new();
    let project_constants = collect_project_constants(&sources);

    let mut session = ParseSession {
        constants: &project_constants,
        wants: &mut wants,
        diagnostics: &mut diagnostics,
    };

    for (path, content) in &sources {
        parse_and_extract(&mut session, path, content);
    }

    let atom_set = build_atom_set(&wants);
    let css = build_css_runtime(&atom_set);
    let stylesheet = build_stylesheet(&atom_set);

    Ok(CompileResult {
        stylesheet,
        css,
        diagnostics,
        wants,
    })
}

fn collect_sources(request: &CompileRequest) -> Vec<(String, String)> {
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return files
                .iter()
                .map(|f| (f.path.clone(), f.content.clone()))
                .collect();
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
    for entry in entries.flatten() {
        handle_dir_entry(&entry.path(), acc);
    }
}

fn handle_dir_entry(path: &Path, acc: &mut Vec<(String, String)>) {
    if path.is_dir() {
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if !matches!(
            name,
            "node_modules"
                | ".git"
                | "dist"
                | "build"
                | ".turbo"
                | "target"
                | ".reference-ui"
                | ".reference"
                | ".pipeline"
        ) {
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

fn parse_and_extract(
    session: &mut ParseSession<'_>,
    path: &str,
    content: &str,
) {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true)
        .with_jsx(true);
    let parser = Parser::new(&allocator, content, source_type);
    let ret = parser.parse();

    for err in ret.errors {
        session.diagnostics.push(Diagnostic::error(err.to_string()).with_location(path, None, None));
    }
    if !ret.panicked {
        let mut local_constants = extract::constants::collect_local_constants(&ret.program);
        local_constants.merge(session.constants);
        let mut ctx = extract::ExtractContext::new(
            path,
            &local_constants,
            session.wants,
            session.diagnostics,
        );
        extract::extract_with_context(&ret.program, &mut ctx);
    }
}

fn build_atom_set(wants: &[Want]) -> AtomSet {
    let mut atom_set = AtomSet::new();
    for want in wants {
        let atoms = resolve::resolve_want(want);
        for atom in atoms {
            atom_set.insert(atom);
        }
    }
    atom_set
}

fn build_css_runtime(atom_set: &AtomSet) -> CssRuntime {
    let mut runtime = CssRuntime::new();
    for atom in atom_set {
        let c_name = stylesheet::name::class_name(atom);
        let val_key = atom.value.class_name_str();
        let key = if atom.conditions.is_empty() {
            format!("{}:{}", atom.prop, val_key)
        } else {
            format!("{}:{}:{}", atom.conditions.join(":"), atom.prop, val_key)
        };
        runtime.insert(key, c_name);
    }
    runtime
}

fn build_stylesheet(atom_set: &AtomSet) -> String {
    stylesheet::build_stylesheet(atom_set)
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
        assert!(res.css.is_empty());
        assert!(res.diagnostics.is_empty());
    }
}
