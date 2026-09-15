//! Node-API bindings for Styletrace wrapper graph tracing and StyleProps extraction.
//! Accepts repository root paths and optional sync root hints from TypeScript callers.
//! Traces imported component wrappers and resolves custom JSX element identifiers.
//! Serializes discovered style-bearing JSX component names into JSON string arrays.

use napi::Result;
use napi_derive::napi;
use std::path::PathBuf;

#[napi]
pub fn analyze_styletrace(root_dir: String, sync_root_hint: Option<String>) -> Result<String> {
    let normalized_root = PathBuf::from(&root_dir);
    let sync_root_hint = sync_root_hint.as_deref().map(PathBuf::from);
    let result =
        styletrace::trace_style_jsx_names_with_hint(&normalized_root, sync_root_hint.as_deref())
            .map_err(|err| {
                napi::Error::from_reason(format!("Styletrace analysis failed: {err}"))
            })?;
    serde_json::to_string(&result).map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize styletrace result: {err}"))
    })
}
