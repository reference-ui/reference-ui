//! Emitted JSDoc contract types.
//! Describes the serialized summary-plus-tags documentation payloads attached to symbols and members.
//! ts-rs derives export these shapes to the JS runtime.

use serde::Serialize;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "modules/tasty/js/generated/", rename_all = "camelCase")]
pub struct TastyJsDocTag {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "modules/tasty/js/generated/", rename_all = "camelCase")]
pub struct TastyJsDoc {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub summary: Option<String>,
    pub tags: Vec<TastyJsDocTag>,
}
