//! Node-API bindings for VirtualRS AST transforms and import rewriting.
//! Bridges JavaScript callers with pure Rust oxc AST rewriting passes.
//! Handles CSS and CVA import remapping, function identifier substitutions, and responsive lowering.
//! Returns modified source code strings with byte-accurate transforms applied.

use napi::Result;
use napi_derive::napi;

#[napi]
pub fn rewrite_css_imports(source_code: String, relative_path: String) -> Result<String> {
    Ok(virtualrs::rewrite_css_imports(&source_code, &relative_path))
}

#[napi]
pub fn rewrite_cva_imports(source_code: String, relative_path: String) -> Result<String> {
    Ok(virtualrs::rewrite_cva_imports(&source_code, &relative_path))
}

#[napi]
pub fn replace_function_name(
    source_code: String,
    relative_path: String,
    from_name: String,
    to_name: String,
    import_from: Option<String>,
) -> Result<String> {
    Ok(virtualrs::replace_function_name(
        &source_code,
        &relative_path,
        &from_name,
        &to_name,
        import_from.as_deref(),
    ))
}

#[napi]
pub fn apply_responsive_styles(
    source_code: String,
    relative_path: String,
    breakpoints_json: Option<String>,
) -> Result<String> {
    let breakpoints = match breakpoints_json {
        Some(raw) if !raw.is_empty() => serde_json::from_str::<
            std::collections::HashMap<String, String>,
        >(&raw)
        .map_err(|err| napi::Error::from_reason(format!("Invalid breakpoints JSON: {err}")))?,
        _ => std::collections::HashMap::new(),
    };

    Ok(virtualrs::apply_responsive_styles(
        &source_code,
        &relative_path,
        &breakpoints,
    ))
}
