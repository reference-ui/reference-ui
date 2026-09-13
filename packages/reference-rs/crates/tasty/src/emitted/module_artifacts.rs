use std::collections::BTreeMap;

use serde::Serialize;
use ts_rs::TS;

use super::{TastySymbol, TastySymbolRef};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyModule {
    #[serde(flatten)]
    #[ts(flatten)]
    pub symbols: BTreeMap<String, TastySymbol>,
    pub interfaces: Vec<TastySymbolRef>,
    pub types: Vec<TastySymbolRef>,
    pub libraries: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyManifest {
    pub version: String,
    pub warnings: Vec<String>,
    pub symbols_by_name: BTreeMap<String, Vec<String>>,
    pub symbols_by_id: BTreeMap<String, TastySymbolIndexEntry>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastySymbolIndexEntry {
    pub id: String,
    pub name: String,
    pub kind: super::TastySymbolKind,
    pub chunk: String,
    pub library: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyChunkModule {
    #[serde(flatten)]
    #[ts(flatten)]
    pub symbols: BTreeMap<String, TastySymbol>,
}
