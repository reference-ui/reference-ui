//! Round-trip tests for [`map_type_ref`](crate::tasty::shared::type_ref_map::map_type_ref).

use crate::tasty::model::{
    FnParam, MappedModifierKind, TemplateLiteralPart, TsMember, TsMemberKind, TsTypeParameter,
    TupleElement, TypeOperatorKind, TypeRef,
};
use crate::tasty::shared::type_ref_map::map_type_ref;

use super::type_ref_map_identity::IdentityMap;

fn elaborate_type_ref() -> TypeRef {
    let t = TypeRef::Intrinsic {
        name: "string".to_string(),
    };
    TypeRef::Union {
        types: vec![
            TypeRef::Reference {
                name: "Boxed".to_string(),
                target_id: Some("sym:f.ts#Boxed".to_string()),
                source_module: None,
                type_arguments: Some(vec![t.clone()]),
            },
            TypeRef::Array {
                element: Box::new(TypeRef::Literal {
                    value: "1".to_string(),
                }),
            },
            TypeRef::Tuple {
                elements: vec![TupleElement {
                    label: Some("a".to_string()),
                    optional: false,
                    rest: false,
                    readonly: false,
                    element: t.clone(),
                }],
            },
            TypeRef::Intersection {
                types: vec![
                    TypeRef::Intrinsic {
                        name: "number".to_string(),
                    },
                    t.clone(),
                ],
            },
            TypeRef::Object {
                members: vec![TsMember {
                    name: "p".to_string(),
                    optional: false,
                    readonly: true,
                    kind: TsMemberKind::Property,
                    description: None,
                    description_raw: None,
                    jsdoc: None,
                    type_ref: Some(t.clone()),
                }],
            },
            TypeRef::IndexedAccess {
                object: Box::new(t.clone()),
                index: Box::new(TypeRef::Literal {
                    value: "key".to_string(),
                }),
                resolved: Some(Box::new(t.clone())),
            },
            TypeRef::Function {
                params: vec![FnParam {
                    name: Some("x".to_string()),
                    optional: false,
                    type_ref: Some(t.clone()),
                }],
                return_type: Box::new(t.clone()),
            },
            TypeRef::Constructor {
                r#abstract: false,
                type_parameters: vec![TsTypeParameter {
                    name: "T".to_string(),
                    constraint: Some(t.clone()),
                    default: Some(TypeRef::Intrinsic {
                        name: "unknown".to_string(),
                    }),
                }],
                params: vec![],
                return_type: Box::new(t.clone()),
            },
            TypeRef::TypeOperator {
                operator: TypeOperatorKind::Keyof,
                target: Box::new(t.clone()),
                resolved: None,
            },
            TypeRef::TypeQuery {
                expression: "x".to_string(),
                resolved: Some(Box::new(t.clone())),
            },
            TypeRef::Conditional {
                check_type: Box::new(t.clone()),
                extends_type: Box::new(t.clone()),
                true_type: Box::new(t.clone()),
                false_type: Box::new(t.clone()),
                resolved: Some(Box::new(t.clone())),
            },
            TypeRef::Mapped {
                type_param: "K".to_string(),
                source_type: Box::new(t.clone()),
                name_type: Some(Box::new(t.clone())),
                optional_modifier: MappedModifierKind::Preserve,
                readonly_modifier: MappedModifierKind::Add,
                value_type: Some(Box::new(t.clone())),
            },
            TypeRef::TemplateLiteral {
                parts: vec![
                    TemplateLiteralPart::Text {
                        value: "pre-".to_string(),
                    },
                    TemplateLiteralPart::Type {
                        value: t.clone(),
                    },
                ],
                resolved: Some(Box::new(t.clone())),
            },
            TypeRef::Raw {
                summary: "opaque".to_string(),
            },
        ],
    }
}

#[test]
fn identity_map_preserves_complex_type_ref() {
    let input = elaborate_type_ref();
    let output = map_type_ref(&mut IdentityMap, input.clone());
    assert_eq!(input, output);
}
