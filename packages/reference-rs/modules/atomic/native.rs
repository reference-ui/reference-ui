//! Node-API bindings for Reference UI atomic style system compilation.
//! Ingests serialized compilation requests carrying virtual sources and an EvaluatedSystemSpec.
//! Accepts the legacy `{ baseSystem, rootDir?, files? }` shape and the frozen
//! `{ schemaVersion: 1, spec, jsxHosts, sourceRoot, declarationRoot, include? }` shape for one wave.
//! Lowers the spec through base-system's public lowering path, mirroring typegen's seam.
//! Foreign or malformed specs are rejected with path-bearing error diagnostics, never silently emptied.
//! Emits the slim serialized result (sheets, runtime, diagnostics, hosts) by default; the
//! 'proof' logs channel restores the compile-internal rows stations and the differential read.

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
    logs: Option<Vec<String>>,
    #[serde(default)]
    base_system: Option<serde_json::Value>,
    #[serde(default)]
    spec: Option<serde_json::Value>,
}

#[napi]
pub fn compile_system(request_json: String) -> Result<String> {
    #[cfg(feature = "alloc-trace")]
    let mut _span = crate::alloc_trace::CompileSpan::enter(request_json.len());
    let req: NativeCompileRequest = serde_json::from_str(&request_json)
        .map_err(|err| napi::Error::from_reason(format!("Invalid compile request JSON: {err}")))?;
    let proof = wants_proof(&req);
    if let Some(rejected) = check_schema_version(&req) {
        return serialize(&rejection(&rejected), proof);
    }
    let Some(raw_system) = req.spec.or(req.base_system) else {
        return Err(napi::Error::from_reason(
            "Invalid compile request JSON: missing required `baseSystem` (EvaluatedSystemSpec) or frozen `spec`",
        ));
    };
    let system = match lower_base_system(&raw_system) {
        Ok(system) => system,
        Err(message) => return serialize(&rejection(&message), proof),
    };
    #[cfg(feature = "alloc-trace")]
    _span.note_files(req.files.as_ref());
    let compile_req = ::atomic::CompileRequest {
        root_dir: req.source_root.or(req.root_dir),
        files: req.files,
        base_system: system,
        jsx_hosts: req.jsx_hosts,
        declaration_root: req.declaration_root,
        include: req.include,
        logs: req.logs,
    };
    let result = ::atomic::compile(&compile_req).map_err(napi::Error::from_reason)?;
    serialize(&result, proof)
}

/// True when the caller requested the proof backchannel: `logs` containing
/// 'proof' restores the compile-internal rows the slim default omits. Unknown
/// channels are ignored so channels evolve additively (S5 precedent).
fn wants_proof(req: &NativeCompileRequest) -> bool {
    req.logs
        .as_ref()
        .is_some_and(|logs| logs.iter().any(|name| name == "proof"))
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
        style_plans: Vec::new(),
        css: Some(::atomic::CssRuntime::new()),
        diagnostics: vec![::atomic::Diagnostic::error(
            ::atomic::DiagnosticCode::InvalidBaseSystem,
            message,
        )],
        wants: Vec::new(),
        recipes: Vec::new(),
        atom_count: 0,
        traced_jsx_hosts: Vec::new(),
        compiler_diagnostics: None,
    }
}

/// Slim N-API view: the fields production `sync()` consumes (sheets, runtime,
/// diagnostics, traced hosts) plus the opt-in compiler backchannel when present.
/// Style plans, wants, the css map, top-level recipes, and the atom count ride
/// the proof channel only; they cost ~38% of the result string at enterprise.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct SlimCompileResult<'a> {
    stylesheet: &'a str,
    portable_stylesheet: &'a str,
    runtime: &'a ::atomic::NativeRuntimeArtifact,
    diagnostics: &'a Vec<::atomic::Diagnostic>,
    traced_jsx_hosts: &'a Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    compiler_diagnostics: &'a Option<Vec<::atomic::Diagnostic>>,
}

impl<'a> SlimCompileResult<'a> {
    fn of(result: &'a ::atomic::CompileResult) -> Self {
        Self {
            stylesheet: &result.stylesheet,
            portable_stylesheet: &result.portable_stylesheet,
            runtime: &result.runtime,
            diagnostics: &result.diagnostics,
            traced_jsx_hosts: &result.traced_jsx_hosts,
            compiler_diagnostics: &result.compiler_diagnostics,
        }
    }
}

fn serialize(result: &::atomic::CompileResult, proof: bool) -> Result<String> {
    let text = if proof {
        serde_json::to_string(result)
    } else {
        serde_json::to_string(&SlimCompileResult::of(result))
    };
    text.map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize compile result: {err}"))
    })
}
