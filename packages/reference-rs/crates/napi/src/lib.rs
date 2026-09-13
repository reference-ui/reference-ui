#![deny(clippy::all)]

use std::path::PathBuf;

use napi::Result;
use napi_derive::napi;

#[napi]
pub fn get_native_capabilities() -> Result<String> {
    Ok(serde_json::json!({
        "styletraceSyncRootHint": true,
        "replaceFunctionNameImportFrom": true
    })
    .to_string())
}

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
        Some(raw) if !raw.is_empty() => serde_json::from_str::<std::collections::HashMap<String, String>>(&raw)
            .map_err(|err| napi::Error::from_reason(format!("Invalid breakpoints JSON: {err}")))?,
        _ => std::collections::HashMap::new(),
    };

    Ok(virtualrs::apply_responsive_styles(
        &source_code,
        &relative_path,
        &breakpoints,
    ))
}

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

#[napi]
pub fn analyze_atlas(root_dir: String, config_json: Option<String>) -> Result<String> {
    let mut config = match config_json {
        Some(raw) => serde_json::from_str::<atlas::AtlasConfig>(&raw)
            .map_err(|err| napi::Error::from_reason(format!("Invalid Atlas config JSON: {err}")))?,
        None => atlas::AtlasConfig::default(),
    };
    config.root_dir = root_dir.clone();

    let mut analyzer = atlas::AtlasAnalyzer::new(config);
    let result: atlas::AtlasAnalysisResult = analyzer.analyze_detailed(&root_dir);
    serde_json::to_string(&result)
        .map_err(|err| napi::Error::from_reason(format!("Failed to serialize Atlas result: {err}")))
}

#[napi]
pub fn analyze_styletrace(root_dir: String, sync_root_hint: Option<String>) -> Result<String> {
    let normalized_root = PathBuf::from(&root_dir);
    let sync_root_hint = sync_root_hint.as_deref().map(PathBuf::from);
    let result = system::trace_style_jsx_names_with_hint(&normalized_root, sync_root_hint.as_deref())
        .map_err(|err| napi::Error::from_reason(format!("Styletrace analysis failed: {err}")))?;
    serde_json::to_string(&result).map_err(|err| {
        napi::Error::from_reason(format!("Failed to serialize styletrace result: {err}"))
    })
}
