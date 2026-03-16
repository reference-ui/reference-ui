use super::api::{ScanRequest, TypeScriptBundle};
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

/// Scan and emit the ESM bundle, returning the entrypoint module source.
pub fn scan_and_emit_bundle(request: &ScanRequest) -> Result<String, String> {
    let bundle = scan_typescript_bundle(request)?;
    let esm = emit_esm_bundle(&bundle)?;
    esm.modules
        .get(&esm.entrypoint)
        .cloned()
        .ok_or_else(|| "missing entrypoint module".to_string())
}
