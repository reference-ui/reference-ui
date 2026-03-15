#![deny(clippy::all)]

mod typescript;
mod virtual_postprocess;

use std::path::PathBuf;

use napi::Result;
use napi_derive::napi;

use typescript::{scan_and_emit_bundle as do_scan_and_emit_bundle, ScanRequest};

#[napi]
pub fn rewrite_css_imports(source_code: String, relative_path: String) -> Result<String> {
    Ok(virtual_postprocess::rewrite_css_imports(
        &source_code,
        &relative_path,
    ))
}

#[napi]
pub fn rewrite_cva_imports(source_code: String, relative_path: String) -> Result<String> {
    Ok(virtual_postprocess::rewrite_cva_imports(
        &source_code,
        &relative_path,
    ))
}

/// Scan TypeScript under `root_dir` with the given include globs, then emit the ESM bundle.
/// Returns the single emitted module source (entrypoint content) for the bundle.
#[napi]
pub fn scan_and_emit_bundle(root_dir: String, include: Vec<String>) -> Result<String> {
    let request = ScanRequest {
        root_dir: PathBuf::from(&root_dir),
        include,
    };
    do_scan_and_emit_bundle(&request).map_err(napi::Error::from_reason)
}
