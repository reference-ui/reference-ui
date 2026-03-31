use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

// Data model mirrored to js/atlas/generated via ts-rs.

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/atlas/generated/", rename_all = "camelCase")]
pub struct Component {
    pub name: String,
    pub interface: ComponentInterface,
    pub source: String,
    pub count: u32,
    pub props: Vec<ComponentProp>,
    pub usage: Usage,
    pub examples: Vec<String>,
    pub used_with: BTreeMap<String, Usage>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/atlas/generated/", rename_all = "camelCase")]
pub struct ComponentInterface {
    pub name: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/atlas/generated/", rename_all = "camelCase")]
pub struct ComponentProp {
    pub name: String,
    pub count: u32,
    pub usage: Usage,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub values: Option<BTreeMap<String, Usage>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export_to = "js/atlas/generated/")]
pub enum Usage {
    #[serde(rename = "very common")]
    #[ts(rename = "very common")]
    VeryCommon,
    #[serde(rename = "common")]
    #[ts(rename = "common")]
    Common,
    #[serde(rename = "occasional")]
    #[ts(rename = "occasional")]
    Occasional,
    #[serde(rename = "rare")]
    #[ts(rename = "rare")]
    Rare,
    #[serde(rename = "unused")]
    #[ts(rename = "unused")]
    Unused,
}

impl Usage {
    pub fn from_count(count: u32, total: u32) -> Self {
        if total == 0 {
            return Usage::Unused;
        }
        
        let ratio = count as f64 / total as f64;
        match ratio {
            r if r >= 0.5 => Usage::VeryCommon,
            r if r >= 0.2 => Usage::Common,
            r if r >= 0.1 => Usage::Occasional,
            r if r > 0.0 => Usage::Rare,
            _ => Usage::Unused,
        }
    }
}
