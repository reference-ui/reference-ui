#![deny(clippy::all)]

mod tasty;
mod virtualrs;
mod atlas;

pub use tasty::{scan_typescript_bundle, ScanRequest};
pub use atlas::{AtlasAnalyzer, AtlasConfig};

#[cfg(feature = "napi")]
use std::path::PathBuf;

#[cfg(feature = "napi")]
use napi::Result;
#[cfg(feature = "napi")]
use napi_derive::napi;

#[cfg(feature = "napi")]
use tasty::scan_and_emit_modules as do_scan_and_emit_modules;

#[cfg(feature = "napi")]
#[napi]
pub fn rewrite_css_imports(source_code: String, relative_path: String) -> Result<String> {
    Ok(virtualrs::rewrite_css_imports(&source_code, &relative_path))
}

#[cfg(feature = "napi")]
#[napi]
pub fn rewrite_cva_imports(source_code: String, relative_path: String) -> Result<String> {
    Ok(virtualrs::rewrite_cva_imports(&source_code, &relative_path))
}

/// Scan TypeScript under `root_dir` with the given include globs, then emit all Tasty ESM modules.
/// Returns a JSON payload containing the generated module sources keyed by relative path.
#[cfg(feature = "napi")]
#[napi]
pub fn scan_and_emit_modules(root_dir: String, include: Vec<String>) -> Result<String> {
    let request = ScanRequest {
        root_dir: PathBuf::from(&root_dir),
        include,
    };
    do_scan_and_emit_modules(&request).map_err(napi::Error::from_reason)
}
