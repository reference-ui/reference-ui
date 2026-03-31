use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Default, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/atlas/generated/", rename_all = "camelCase")]
pub struct AtlasConfig {
    pub root_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub include: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub exclude: Option<Vec<String>>,
}
