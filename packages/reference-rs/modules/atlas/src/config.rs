//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Default, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "modules/atlas/js/generated/", rename_all = "camelCase")]
pub struct AtlasConfig {
    pub root_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub include: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub exclude: Option<Vec<String>>,
}
