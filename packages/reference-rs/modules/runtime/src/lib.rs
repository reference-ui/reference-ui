//! Node-API runtime host and entrypoint for the Reference UI native binary addon.
//! Links product-level native bindings and provides the base runtime capability handshake.
//! Exposes a minimal host ping while delegating product-specific ABI execution to modules.

#![deny(clippy::all)]

use napi::Result;
use napi_derive::napi;

// The N-API exports are called only by Node through the cdylib, so test builds leave these
// product ABI modules out rather than reporting every unreferenced export as dead code.
#[cfg(not(test))]
#[path = "../../atlas/native.rs"]
mod atlas;
#[cfg(not(test))]
#[path = "../../atomic/native.rs"]
mod atomic;
#[cfg(not(test))]
#[path = "../../styletrace/native.rs"]
mod styletrace;
#[cfg(not(test))]
#[path = "../../tasty/native.rs"]
mod tasty;
#[cfg(not(test))]
#[path = "../../typegen/native.rs"]
mod typegen;

#[cfg(feature = "counters-trace")]
mod counters_abi;
#[cfg(feature = "counters-trace")]
mod counters_trace;

#[cfg(feature = "alloc-trace")]
#[global_allocator]
static ALLOC: ::atomic::alloc_counters::TraceAlloc = ::atomic::alloc_counters::TraceAlloc;

#[napi]
pub fn get_native_capabilities() -> Result<String> {
    Ok(serde_json::json!({ "schema": 1 }).to_string())
}

/// Live allocation counters as JSON; present only in `alloc-trace` builds.
#[cfg(feature = "alloc-trace")]
#[napi]
pub fn get_alloc_trace() -> String {
    ::atomic::alloc_trace::snapshot_json()
}
