//! Node-API runtime host and entrypoint for the Reference UI native binary addon.
//! Links product-level native bindings and provides the base runtime capability handshake.
//! Exposes a minimal host ping while delegating product-specific ABI execution to modules.

#![deny(clippy::all)]

use napi::Result;
use napi_derive::napi;

#[path = "../../atlas/native.rs"]
mod atlas;
#[path = "../../atomic/native.rs"]
mod atomic;
#[path = "../../styletrace/native.rs"]
mod styletrace;
#[path = "../../tasty/native.rs"]
mod tasty;
#[path = "../../typegen/native.rs"]
mod typegen;
#[path = "../../virtualrs/native.rs"]
mod virtualrs;

#[cfg(feature = "alloc-trace")]
mod alloc_trace;

#[cfg(feature = "counters-trace")]
mod counters_abi;
#[cfg(feature = "counters-trace")]
mod counters_trace;

#[cfg(feature = "alloc-trace")]
#[global_allocator]
static ALLOC: alloc_trace::TraceAlloc = alloc_trace::TraceAlloc;

#[napi]
pub fn get_native_capabilities() -> Result<String> {
    Ok(serde_json::json!({ "schema": 1 }).to_string())
}

/// Live allocation counters as JSON; present only in `alloc-trace` builds.
#[cfg(feature = "alloc-trace")]
#[napi]
pub fn get_alloc_trace() -> String {
    alloc_trace::snapshot_json()
}
