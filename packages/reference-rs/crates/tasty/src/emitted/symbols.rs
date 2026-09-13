use serde::Serialize;
use ts_rs::TS;

use super::{TastyJsDoc, TastyMember, TastyTypeParameter, TastyTypeRef};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastySymbolRef {
    pub id: String,
    pub name: String,
    pub library: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_arguments: Option<Vec<TastyTypeRef>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub enum TastySymbolKind {
    Interface,
    TypeAlias,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(untagged)]
#[ts(export_to = "js/tasty/generated/")]
pub enum TastySymbol {
    Interface(TastyInterfaceSymbol),
    TypeAlias(TastyTypeAliasSymbol),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyInterfaceSymbol {
    pub id: String,
    pub name: String,
    pub library: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description_raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub jsdoc: Option<TastyJsDoc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_parameters: Option<Vec<TastyTypeParameter>>,
    pub members: Vec<TastyMember>,
    pub extends: Vec<TastySymbolRef>,
    pub types: Vec<TastySymbolRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyTypeAliasSymbol {
    pub id: String,
    pub name: String,
    pub library: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description_raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub jsdoc: Option<TastyJsDoc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_parameters: Option<Vec<TastyTypeParameter>>,
    pub definition: Option<TastyTypeRef>,
}
