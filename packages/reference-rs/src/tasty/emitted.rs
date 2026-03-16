#![allow(dead_code)]

use std::collections::BTreeMap;

use serde::Serialize;
use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleModule {
    #[serde(flatten)]
    #[ts(flatten)]
    pub symbols: BTreeMap<String, BundleSymbol>,
    pub interfaces: Vec<BundleSymbolRef>,
    pub types: Vec<BundleSymbolRef>,
    pub libraries: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleSymbolRef {
    pub id: String,
    pub name: String,
    pub library: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(untagged)]
#[ts(export_to = "js/tasty/generated/")]
pub enum BundleSymbol {
    Interface(BundleInterfaceSymbol),
    TypeAlias(BundleTypeAliasSymbol),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleInterfaceSymbol {
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
    pub jsdoc: Option<BundleJsDoc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_parameters: Option<Vec<BundleTypeParameter>>,
    pub members: Vec<BundleMember>,
    pub extends: Vec<BundleSymbolRef>,
    pub types: Vec<BundleSymbolRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleTypeAliasSymbol {
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
    pub jsdoc: Option<BundleJsDoc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_parameters: Option<Vec<BundleTypeParameter>>,
    pub definition: Option<BundleTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleJsDocTag {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleJsDoc {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub summary: Option<String>,
    pub tags: Vec<BundleJsDocTag>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleTypeParameter {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub constraint: Option<BundleTypeRef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub default: Option<BundleTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleMember {
    pub name: String,
    pub optional: bool,
    pub readonly: bool,
    pub kind: BundleMemberKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub description_raw: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub jsdoc: Option<BundleJsDoc>,
    pub r#type: Option<BundleTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export_to = "js/tasty/generated/", rename_all = "snake_case")]
pub enum BundleMemberKind {
    Property,
    Method,
    Call,
    Index,
    Construct,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleFnParam {
    pub name: Option<String>,
    pub optional: bool,
    pub type_ref: Option<BundleTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleTupleElement {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub label: Option<String>,
    pub optional: bool,
    pub rest: bool,
    pub element: BundleTypeRef,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct BundleTypeReference {
    pub id: String,
    pub name: String,
    pub library: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_arguments: Option<Vec<BundleTypeRef>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(untagged)]
#[ts(export_to = "js/tasty/generated/")]
pub enum BundleTypeRef {
    Reference(BundleTypeReference),
    Structured(BundleStructuredTypeRef),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(tag = "kind", rename_all = "snake_case", rename_all_fields = "camelCase")]
#[ts(
    export_to = "js/tasty/generated/",
    tag = "kind",
    rename_all = "snake_case",
    rename_all_fields = "camelCase"
)]
pub enum BundleStructuredTypeRef {
    Intrinsic {
        name: String,
    },
    Literal {
        value: String,
    },
    Object {
        members: Vec<BundleMember>,
    },
    Union {
        types: Vec<BundleTypeRef>,
    },
    Array {
        element: Box<BundleTypeRef>,
    },
    Tuple {
        elements: Vec<BundleTupleElement>,
    },
    Intersection {
        types: Vec<BundleTypeRef>,
    },
    IndexedAccess {
        object: Box<BundleTypeRef>,
        index: Box<BundleTypeRef>,
    },
    Function {
        params: Vec<BundleFnParam>,
        return_type: Box<BundleTypeRef>,
    },
    Constructor {
        r#abstract: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        type_parameters: Option<Vec<BundleTypeParameter>>,
        params: Vec<BundleFnParam>,
        return_type: Box<BundleTypeRef>,
    },
    TypeOperator {
        operator: BundleTypeOperatorKind,
        target: Box<BundleTypeRef>,
    },
    TypeQuery {
        expression: String,
    },
    Conditional {
        check_type: Box<BundleTypeRef>,
        extends_type: Box<BundleTypeRef>,
        true_type: Box<BundleTypeRef>,
        false_type: Box<BundleTypeRef>,
    },
    Mapped {
        type_param: String,
        source_type: Box<BundleTypeRef>,
        #[serde(skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        name_type: Option<Box<BundleTypeRef>>,
        optional_modifier: BundleMappedModifierKind,
        readonly_modifier: BundleMappedModifierKind,
        value_type: Option<Box<BundleTypeRef>>,
    },
    TemplateLiteral {
        parts: Vec<BundleTemplateLiteralPart>,
    },
    Raw {
        summary: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(tag = "kind", rename_all = "snake_case", rename_all_fields = "camelCase")]
#[ts(
    export_to = "js/tasty/generated/",
    tag = "kind",
    rename_all = "snake_case",
    rename_all_fields = "camelCase"
)]
pub enum BundleTemplateLiteralPart {
    Text {
        value: String,
    },
    Type {
        value: BundleTypeRef,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export_to = "js/tasty/generated/", rename_all = "snake_case")]
pub enum BundleMappedModifierKind {
    Preserve,
    Add,
    Remove,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export_to = "js/tasty/generated/", rename_all = "snake_case")]
pub enum BundleTypeOperatorKind {
    Keyof,
    Readonly,
    Unique,
}
