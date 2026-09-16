//! Node-API bindings for Reference UI atomic style system compilation.
//! Ingests serialized compilation requests carrying virtual sources and an EvaluatedSystemSpec.
//! Lowers the spec through base-system's public lowering path, mirroring typegen's seam.
//! Foreign or malformed specs are rejected with path-bearing error diagnostics, never silently emptied.
//! Emits serialized compilation results containing CSS output, runtime plans, and diagnostics.

use napi::Result;
use napi_derive::napi;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeCompileRequest {
    #[serde(default, alias = "root_dir")]
    root_dir: Option<String>,
    #[serde(default)]
    files: Option<Vec<::atomic::VirtualSource>>,
    #[serde(default)]
    base_system: Option<serde_json::Value>,
}

#[napi]
pub fn compile_system(request_json: String) -> Result<String> {
    let req: NativeCompileRequest = serde_json::from_str(&request_json)
        .map_err(|err| napi::Error::from_reason(format!("Invalid compile request JSON: {err}")))?;
    let Some(raw_system) = req.base_system else {
        return Err(napi::Error::from_reason(
            "Invalid compile request JSON: missing required `baseSystem` (EvaluatedSystemSpec)",
        ));
    };
    let system = match lower_base_system(&raw_system) {
        Ok(system) => system,
        Err(message) => return serialize(&rejection(&message)),
    };
    let compile_req = ::atomic::CompileRequest {
        root_dir: req.root_dir,
        files: req.files,
        base_system: system,
    };
    let result = ::atomic::compile(&compile_req).map_err(napi::Error::from_reason)?;
    serialize(&result)
}

/// Lower a caller-supplied spec value into an indexed system, naming the defect.
fn lower_base_system(raw: &serde_json::Value) -> std::result::Result<::atomic::BaseSystem, String> {
    let spec_json = spec_json_text(raw)?;
    let system = ::base_system::BaseSystem::from_json(&spec_json)
        .map_err(|err| format!("invalid baseSystem spec: {err}"))?;
    if system.name.is_empty() {
        return Err("invalid baseSystem spec: `name` must be a non-empty system name".to_string());
    }
    Ok(system)
}

/// Accept an inline spec object or a pre-serialized spec string, mirroring typegen.
fn spec_json_text(raw: &serde_json::Value) -> std::result::Result<String, String> {
    match raw {
        serde_json::Value::String(inline) => Ok(inline.clone()),
        other => serde_json::to_string(other)
            .map_err(|err| format!("invalid baseSystem spec: failed to serialize: {err}")),
    }
}

/// Preamble-only artifact carrying the rejection diagnostic (station ATM-TOKEN-10).
fn rejection(message: &str) -> ::atomic::CompileResult {
    let preamble = ::atomic::stylesheet::layers::LAYER_PREAMBLE.to_string();
    ::atomic::CompileResult {
        stylesheet: preamble.clone(),
        portable_stylesheet: preamble,
        runtime: ::atomic::NativeRuntimeArtifact::default(),
        css: Some(::atomic::CssRuntime::new()),
        diagnostics: vec![::atomic::Diagnostic::error(message)],
        wants: Vec::new(),
        recipes: Vec::new(),
        atom_count: 0,
    }
}

fn serialize(result: &::atomic::CompileResult) -> Result<String> {
    serde_json::to_string(result).map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize compile result: {err}"))
    })
}
