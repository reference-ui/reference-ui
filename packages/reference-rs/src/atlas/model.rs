use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct UsageThresholds {
    pub very_common_min_ratio: f64,
    pub common_min_ratio: f64,
    pub occasional_min_ratio: f64,
}

pub const DEFAULT_USAGE_THRESHOLDS: UsageThresholds = UsageThresholds {
    very_common_min_ratio: 0.5,
    common_min_ratio: 0.2,
    occasional_min_ratio: 0.1,
};

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
        Self::from_count_with_thresholds(count, total, &DEFAULT_USAGE_THRESHOLDS)
    }

    pub fn from_count_with_thresholds(
        count: u32,
        total: u32,
        thresholds: &UsageThresholds,
    ) -> Self {
        if total == 0 {
            return Usage::Unused;
        }

        let ratio = count as f64 / total as f64;
        match ratio {
            r if r >= thresholds.very_common_min_ratio => Usage::VeryCommon,
            r if r >= thresholds.common_min_ratio => Usage::Common,
            r if r >= thresholds.occasional_min_ratio => Usage::Occasional,
            r if r > 0.0 => Usage::Rare,
            _ => Usage::Unused,
        }
    }
}
