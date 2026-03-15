#![deny(clippy::all)]

mod virtual_postprocess;

use napi::Result;
use napi_derive::napi;

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
