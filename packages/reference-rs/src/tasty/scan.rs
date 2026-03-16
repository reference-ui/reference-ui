use super::model::TypeScriptBundle;
use super::request::ScanRequest;
use super::ast::{extract_ast, resolve_ast};
use super::generator::emit_esm_bundle;
use super::generator::generate_debug_bundle;
use super::scanner::scan_workspace;

pub fn scan_typescript_bundle(request: &ScanRequest) -> Result<TypeScriptBundle, String> {
    let scanned_workspace = scan_workspace(&request.root_dir, &request.include)?;
    let parsed_ast = extract_ast(&scanned_workspace);
    let resolved_graph = resolve_ast(parsed_ast);
    Ok(generate_debug_bundle(request, resolved_graph))
}

/// Scan and emit all Tasty ESM modules as a JSON payload for filesystem writing.
pub fn scan_and_emit_modules(request: &ScanRequest) -> Result<String, String> {
    let bundle = scan_typescript_bundle(request)?;
    let esm = emit_esm_bundle(&bundle)?;
    serde_json::to_string(&esm).map_err(|error| format!("failed to serialize ESM modules: {error}"))
}
