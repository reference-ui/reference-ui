//! Node-API runtime host and entrypoint for the Reference UI native binary addon.
//! Links product-level native bindings and provides the base runtime capability handshake.
//! Exposes a minimal host ping while delegating product-specific ABI execution to modules.

#![deny(clippy::all)]

use napi::Result;
use napi_derive::napi;

#[path = "../../atlas/native.rs"]
mod atlas;
#[path = "../../styletrace/native.rs"]
mod styletrace;
#[path = "../../atomic/native.rs"]
mod atomic;
#[path = "../../tasty/native.rs"]
mod tasty;
#[path = "../../virtualrs/native.rs"]
mod virtualrs;

#[napi]
pub fn get_native_capabilities() -> Result<String> {
    Ok(serde_json::json!({ "schema": 1 }).to_string())
}

