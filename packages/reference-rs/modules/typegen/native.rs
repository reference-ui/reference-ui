//! Node-API bindings for Reference UI type declaration generation.
//! Accepts serialized emit requests containing an EvaluatedSystemSpec and strict options.
//! Lowers the spec through base-system's public lowering path and calls emit_dts_with.
//! Emits pure TypeScript declaration text directly without performing filesystem operations.
//! The detailed twin returns the same text plus the `TGN-W-*` skip warnings as JSON.
//! Also exposes the system-independent StyleProps vocabulary as JSON for codegen, and runs each export on a contained thread.

use crate::contained;
use napi::Result;
use napi_derive::napi;

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct NativeEmitRequest {
    base_system: serde_json::Value,
    #[serde(default)]
    strict: Vec<String>,
}

#[napi(catch_unwind)]
pub fn emit_dts_sync(request_json: String) -> Result<String> {
    contained::run("emit_dts_sync", contained::NATIVE_STACK, move || {
        emit_dts(request_json)
    })
}

fn emit_dts(request_json: String) -> Result<String> {
    let (system, options) = lower_request(&request_json)?;
    Ok(::typegen::emit_dts_with(&system, &options))
}

/// Emit the `.d.ts` plus skip warnings as a JSON `{ dts, diagnostics }` payload.
/// The `dts` string is byte-identical to `emit_dts_sync`; `diagnostics` carries
/// the `TGN-W-*` rows the printers skipped, sorted and deduped.
#[napi(catch_unwind)]
pub fn emit_dts_detailed(request_json: String) -> Result<String> {
    contained::run("emit_dts_detailed", contained::NATIVE_STACK, move || {
        emit_dts_detailed_body(request_json)
    })
}

fn emit_dts_detailed_body(request_json: String) -> Result<String> {
    let (system, options) = lower_request(&request_json)?;
    let detailed = ::typegen::emit_dts_with_diagnostics(&system, &options);
    serde_json::to_string(&detailed).map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize typegen result: {err}"))
    })
}

/// Return typegen's system-independent StyleProps vocabulary as a JSON string.
/// Same `PropDefs` the `.d.ts` style printer prints from: prop names, value
/// domains, condition keys, aliases, and dialect keys. No system input; the
/// vocabulary is constant per binary.
#[napi(catch_unwind)]
pub fn primitives_vocabulary() -> Result<String> {
    contained::run(
        "primitives_vocabulary",
        contained::NATIVE_STACK,
        vocabulary_body,
    )
}

fn vocabulary_body() -> Result<String> {
    ::typegen::primitives_vocabulary_json().map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize typegen vocabulary: {err}"))
    })
}

fn lower_request(
    request_json: &str,
) -> Result<(::base_system::BaseSystem, ::typegen::EmitOptions)> {
    let req: NativeEmitRequest = serde_json::from_str(request_json)
        .map_err(|err| napi::Error::from_reason(format!("Invalid typegen request JSON: {err}")))?;
    let spec_json = match &req.base_system {
        serde_json::Value::String(s) => s.clone(),
        other => serde_json::to_string(other).map_err(|err| {
            napi::Error::from_reason(format!("Failed to serialize baseSystem: {err}"))
        })?,
    };
    let system = ::base_system::BaseSystem::from_json(&spec_json).map_err(|err| {
        napi::Error::from_reason(::typegen::diagnostics::invalid_base_system(err.to_string()))
    })?;
    Ok((
        system,
        ::typegen::EmitOptions { strict: req.strict },
    ))
}
