//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use serde::Serialize;
use ts_rs::TS;

use super::{TastyJsDoc, TastyTypeRef};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "modules/tasty/js/generated/", rename_all = "camelCase")]
pub struct TastyMember {
    pub name: String,
    pub optional: bool,
    pub readonly: bool,
    pub kind: TastyMemberKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description_raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub jsdoc: Option<TastyJsDoc>,
    pub r#type: Option<TastyTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export_to = "modules/tasty/js/generated/", rename_all = "snake_case")]
pub enum TastyMemberKind {
    Property,
    Method,
    Call,
    Index,
    Construct,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "modules/tasty/js/generated/", rename_all = "camelCase")]
pub struct TastyFnParam {
    pub name: Option<String>,
    pub optional: bool,
    pub type_ref: Option<TastyTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "modules/tasty/js/generated/", rename_all = "camelCase")]
pub struct TastyTupleElement {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub label: Option<String>,
    pub optional: bool,
    pub rest: bool,
    pub readonly: bool,
    pub element: TastyTypeRef,
}
