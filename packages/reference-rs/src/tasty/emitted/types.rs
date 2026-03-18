use serde::Serialize;
use ts_rs::TS;

use super::{TastyFnParam, TastyMember, TastyTupleElement};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyTypeParameter {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub constraint: Option<TastyTypeRef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub default: Option<TastyTypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export_to = "js/tasty/generated/", rename_all = "camelCase")]
pub struct TastyTypeReference {
    pub id: String,
    pub name: String,
    pub library: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub type_arguments: Option<Vec<TastyTypeRef>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(untagged)]
#[ts(export_to = "js/tasty/generated/")]
pub enum TastyTypeRef {
    Reference(TastyTypeReference),
    Structured(TastyStructuredTypeRef),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(tag = "kind", rename_all = "snake_case", rename_all_fields = "camelCase")]
#[ts(
    export_to = "js/tasty/generated/",
    tag = "kind",
    rename_all = "snake_case",
    rename_all_fields = "camelCase"
)]
pub enum TastyStructuredTypeRef {
    Intrinsic {
        name: String,
    },
    Literal {
        value: String,
    },
    Object {
        members: Vec<TastyMember>,
    },
    Union {
        types: Vec<TastyTypeRef>,
    },
    Array {
        element: Box<TastyTypeRef>,
    },
    Tuple {
        elements: Vec<TastyTupleElement>,
    },
    Intersection {
        types: Vec<TastyTypeRef>,
    },
    IndexedAccess {
        object: Box<TastyTypeRef>,
        index: Box<TastyTypeRef>,
    },
    Function {
        params: Vec<TastyFnParam>,
        return_type: Box<TastyTypeRef>,
    },
    Constructor {
        r#abstract: bool,
        #[serde(skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        type_parameters: Option<Vec<TastyTypeParameter>>,
        params: Vec<TastyFnParam>,
        return_type: Box<TastyTypeRef>,
    },
    TypeOperator {
        operator: TastyTypeOperatorKind,
        target: Box<TastyTypeRef>,
    },
    TypeQuery {
        expression: String,
    },
    Conditional {
        check_type: Box<TastyTypeRef>,
        extends_type: Box<TastyTypeRef>,
        true_type: Box<TastyTypeRef>,
        false_type: Box<TastyTypeRef>,
    },
    Mapped {
        type_param: String,
        source_type: Box<TastyTypeRef>,
        #[serde(skip_serializing_if = "Option::is_none")]
        #[ts(optional)]
        name_type: Option<Box<TastyTypeRef>>,
        optional_modifier: TastyMappedModifierKind,
        readonly_modifier: TastyMappedModifierKind,
        value_type: Option<Box<TastyTypeRef>>,
    },
    TemplateLiteral {
        parts: Vec<TastyTemplateLiteralPart>,
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
pub enum TastyTemplateLiteralPart {
    Text {
        value: String,
    },
    Type {
        value: TastyTypeRef,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export_to = "js/tasty/generated/", rename_all = "snake_case")]
pub enum TastyMappedModifierKind {
    Preserve,
    Add,
    Remove,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "snake_case")]
#[ts(export_to = "js/tasty/generated/", rename_all = "snake_case")]
pub enum TastyTypeOperatorKind {
    Keyof,
    Readonly,
    Unique,
}
