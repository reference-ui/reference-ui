//! Node-API boundary exposing high-performance Reference UI compiler capabilities to Node.js environments.
//! Bridges pure Rust domain modules with JavaScript via ergonomic exports for import rewriting, AST inspection, and system compilation.
//! Enforces memory safety and efficient JSON-serialized data exchange across the native runtime divide.

#![deny(clippy::all)]

use napi::Result;
use napi_derive::napi;

mod atlas;
mod styletrace;
mod system;
mod tasty;
mod virtualrs;

#[napi]
pub fn get_native_capabilities() -> Result<String> {
    Ok(serde_json::json!({
        "styletraceSyncRootHint": true,
        "replaceFunctionNameImportFrom": true
    })
    .to_string())
}
