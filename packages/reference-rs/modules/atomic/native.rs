//! Node-API bindings for Reference UI atomic style system compilation.
//! Ingests serialized compilation requests specifying virtual files, configuration, and options.
//! Lowers JSX style attributes, resolves CSS shorthands, and constructs atomic stylesheets.
//! Emits serialized compilation results containing CSS output, runtime class mappings, and diagnostics.

use napi::Result;
use napi_derive::napi;

#[napi]
pub fn compile_system(request_json: String) -> Result<String> {
    let req: ::atomic::CompileRequest = serde_json::from_str(&request_json)
        .map_err(|err| napi::Error::from_reason(format!("Invalid compile request JSON: {err}")))?;
    let result = ::atomic::compile(&req).map_err(napi::Error::from_reason)?;
    serde_json::to_string(&result)
        .map_err(|err| napi::Error::from_reason(format!("Failed to serialize compile result: {err}")))
}
