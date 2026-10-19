//! Generator surface: resolved graph to runtime artifacts.
//! Builds the TypeScriptBundle from the resolved graph and re-exports artifact-bundle emission for the scan pipeline.

mod bundle;
mod symbols;
mod types;
mod util;

use super::ast::ResolvedTypeScriptGraph;
use super::model::TypeScriptBundle;
use super::request::ScanRequest;
pub(crate) use bundle::emit_artifact_bundle;

pub(crate) fn build_typescript_bundle(
    request: &ScanRequest,
    resolved_graph: ResolvedTypeScriptGraph,
) -> TypeScriptBundle {
    TypeScriptBundle {
        version: 1,
        root_dir: ".".to_string(),
        entry_globs: request.include.clone(),
        files: resolved_graph.files,
        symbols: resolved_graph.symbols,
        exports: resolved_graph.exports,
        diagnostics: resolved_graph.diagnostics,
        bridged_libraries: resolved_graph.bridged_libraries,
    }
}
