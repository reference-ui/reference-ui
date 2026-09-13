use super::ast::{extract_ast, resolve_ast};
use super::generator::build_typescript_bundle;
use super::generator::emit_artifact_bundle;
use super::model::TypeScriptBundle;
use super::request::ScanRequest;
use super::scanner::scan_workspace;
use serde::Serialize;

#[derive(Debug, Serialize)]
struct EmittedModulesPayload {
    modules: std::collections::BTreeMap<String, String>,
    type_declarations: std::collections::BTreeMap<String, String>,
    diagnostics: Vec<super::model::ScannerDiagnostic>,
}

pub fn scan_typescript_bundle(request: &ScanRequest) -> Result<TypeScriptBundle, String> {
    let scanned_workspace = scan_workspace(&request.root_dir, &request.include)?;
    let parsed_ast = extract_ast(&scanned_workspace);
    let resolved_graph = resolve_ast(parsed_ast);
    Ok(build_typescript_bundle(request, resolved_graph))
}

/// Scan and emit all Tasty artifact modules as a JSON payload for filesystem writing.
pub fn scan_and_emit_modules(request: &ScanRequest) -> Result<String, String> {
    let bundle = scan_typescript_bundle(request)?;
    let artifact_bundle = emit_artifact_bundle(&bundle)?;
    let payload = EmittedModulesPayload {
        modules: artifact_bundle.modules,
        type_declarations: artifact_bundle.type_declarations,
        diagnostics: bundle.diagnostics,
    };
    serde_json::to_string(&payload)
        .map_err(|error| format!("failed to serialize artifact modules: {error}"))
}
