//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Default, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "modules/atlas/js/generated/",
    rename_all = "camelCase"
)]
pub struct AtlasConfig {
    pub root_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub include: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub exclude: Option<Vec<String>>,
    // Elements to observe by import source; empty leaves the result without `observed`.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    #[ts(optional = nullable)]
    pub observe: Vec<ObserveSpec>,
}

/// One import source and the element names Atlas should count from it, such as
/// `{ source: "@reference-ui/react", names: ["Div", "Button"] }`.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "modules/atlas/js/generated/",
    rename_all = "camelCase"
)]
pub struct ObserveSpec {
    pub source: String,
    pub names: Vec<String>,
}
