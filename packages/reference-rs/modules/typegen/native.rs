//! Node-API bindings for Reference UI type declaration generation.
//! Accepts serialized emit requests containing an EvaluatedSystemSpec and strict options.
//! Lowers the spec through base-system's public lowering path and calls emit_dts_with.
//! Emits pure TypeScript declaration text directly without performing filesystem operations.

use napi::Result;
use napi_derive::napi;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeEmitRequest {
    base_system: serde_json::Value,
    #[serde(default)]
    strict: Vec<String>,
}

#[napi]
pub fn emit_dts_sync(request_json: String) -> Result<String> {
    let req: NativeEmitRequest = serde_json::from_str(&request_json)
        .map_err(|err| napi::Error::from_reason(format!("Invalid typegen request JSON: {err}")))?;
    let spec_json = match &req.base_system {
        serde_json::Value::String(s) => s.clone(),
        other => serde_json::to_string(other).map_err(|err| {
            napi::Error::from_reason(format!("Failed to serialize baseSystem: {err}"))
        })?,
    };
    let system = ::base_system::BaseSystem::from_json(&spec_json)
        .map_err(|err| napi::Error::from_reason(err.to_string()))?;
    let options = ::typegen::EmitOptions { strict: req.strict };
    Ok(::typegen::emit_dts_with(&system, &options))
}
