mod esm;

use super::api::{ScanRequest, TypeScriptBundle};
use super::ast::ResolvedTypeScriptGraph;

pub(crate) fn generate_debug_bundle(
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
    }
}
