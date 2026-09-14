//! Node-API bindings for Tasty type inspection and ESM module emission.
//! Accepts project root directory paths and glob patterns from JavaScript callers.
//! Lowers AST type signatures and emits standalone declaration chunks and runtime artifacts.
//! Serializes generated TypeScript module sources into structured JSON responses.

use std::path::PathBuf;
use napi::Result;
use napi_derive::napi;

/// Scan TypeScript under `root_dir` with the given include globs, then emit all Tasty ESM modules.
/// Returns a JSON payload containing the generated module sources keyed by relative path.
#[napi]
pub fn scan_and_emit_modules(root_dir: String, include: Vec<String>) -> Result<String> {
    let request = tasty::ScanRequest {
        root_dir: PathBuf::from(&root_dir),
        include,
    };
    tasty::scan_and_emit_modules(&request).map_err(napi::Error::from_reason)
}
