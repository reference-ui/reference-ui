//! Node-API bindings for Reference UI atomic style system compilation.
//! Ingests serialized compilation requests carrying virtual sources and an EvaluatedSystemSpec.
//! Accepts the legacy `{ baseSystem, rootDir?, files? }` shape and the frozen
//! `{ schemaVersion: 1, spec, jsxHosts, sourceRoot, declarationRoot, include? }` shape for one wave.
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
    #[serde(default, alias = "source_root")]
    source_root: Option<String>,
    #[serde(default, alias = "declaration_root")]
    declaration_root: Option<String>,
    #[serde(default, alias = "jsx_hosts")]
    jsx_hosts: Option<Vec<String>>,
    #[serde(default, alias = "schema_version")]
    schema_version: Option<u32>,
    #[serde(default)]
    files: Option<Vec<::atomic::VirtualSource>>,
    #[serde(default)]
    include: Option<Vec<String>>,
    #[serde(default)]
    base_system: Option<serde_json::Value>,
    #[serde(default)]
    spec: Option<serde_json::Value>,
}

#[napi]
pub fn compile_system(request_json: String) -> Result<String> {
    let req: NativeCompileRequest = serde_json::from_str(&request_json)
        .map_err(|err| napi::Error::from_reason(format!("Invalid compile request JSON: {err}")))?;
    if let Some(rejected) = check_schema_version(&req) {
        return serialize(&rejection(&rejected));
    }
    let Some(raw_system) = req.spec.or(req.base_system) else {
        return Err(napi::Error::from_reason(
            "Invalid compile request JSON: missing required `baseSystem` (EvaluatedSystemSpec) or frozen `spec`",
        ));
    };
    let system = match lower_base_system(&raw_system) {
        Ok(system) => system,
        Err(message) => return serialize(&rejection(&message)),
    };
    let compile_req = ::atomic::CompileRequest {
        root_dir: req.source_root.or(req.root_dir),
        files: req.files,
        base_system: system,
        jsx_hosts: req.jsx_hosts,
        declaration_root: req.declaration_root,
        include: req.include,
    };
    let result = ::atomic::compile(&compile_req).map_err(napi::Error::from_reason)?;
    serialize(&result)
}

/// Reject a frozen request whose version is not the one this bridge speaks.
fn check_schema_version(req: &NativeCompileRequest) -> Option<String> {
    match req.schema_version {
        Some(1) | None => None,
        Some(other) => Some(format!("unsupported schemaVersion {other}: expected 1")),
    }
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
        traced_jsx_hosts: Vec::new(),
    }
}

fn serialize(result: &::atomic::CompileResult) -> Result<String> {
    serde_json::to_string(result).map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize compile result: {err}"))
    })
}
