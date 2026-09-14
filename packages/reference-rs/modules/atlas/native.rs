//! Node-API bindings for Atlas codebase analysis and component indexing.
//! Accepts project root directories and optional configuration JSON payloads from JavaScript.
//! Analyzes JSX component usage patterns, property structures, and diagnostic warnings.
//! Serializes detailed Atlas analysis results into JSON strings for Node.js callers.

use napi::Result;
use napi_derive::napi;

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
