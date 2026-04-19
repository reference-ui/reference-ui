//! Property tests for [`map_type_ref`](crate::tasty::shared::type_ref_map::map_type_ref) with
//! [`IdentityMap`](super::type_ref_map_identity::IdentityMap).

use proptest::prelude::*;
use proptest::strategy::BoxedStrategy;
use proptest::string::string_regex;

use crate::tasty::model::{
    FnParam, MappedModifierKind, TemplateLiteralPart, TsMember, TsMemberKind, TsTypeParameter,
    TupleElement, TypeOperatorKind, TypeRef,
};
use crate::tasty::shared::type_ref_map::map_type_ref;

use super::type_ref_map_identity::IdentityMap;

fn arb_short_string() -> BoxedStrategy<String> {
    string_regex("[a-zA-Z0-9_]{0,24}")
        .expect("short string regex")
        .boxed()
}

fn arb_member_kind() -> impl Strategy<Value = TsMemberKind> {
    prop_oneof![
        Just(TsMemberKind::Property),
        Just(TsMemberKind::Method),
        Just(TsMemberKind::CallSignature),
        Just(TsMemberKind::IndexSignature),
        Just(TsMemberKind::ConstructSignature),
    ]
}

fn arb_modifier_kind() -> impl Strategy<Value = MappedModifierKind> {
    prop_oneof![
        Just(MappedModifierKind::Preserve),
        Just(MappedModifierKind::Add),
        Just(MappedModifierKind::Remove),
    ]
}

fn arb_type_operator_kind() -> impl Strategy<Value = TypeOperatorKind> {
    prop_oneof![
        Just(TypeOperatorKind::Keyof),
        Just(TypeOperatorKind::Readonly),
        Just(TypeOperatorKind::Unique),
    ]
}

fn arb_type_parameter(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TsTypeParameter> {
    (
        arb_short_string(),
        prop::option::of(inner.clone()),
        prop::option::of(inner),
    )
        .prop_map(|(name, constraint, default)| TsTypeParameter {
            name,
            constraint,
            default,
        })
}

fn arb_fn_param(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = FnParam> {
    (
        prop::option::of(arb_short_string()),
        any::<bool>(),
        prop::option::of(inner),
    )
        .prop_map(|(name, optional, type_ref)| FnParam {
            name,
            optional,
            type_ref,
        })
}

fn arb_tuple_element(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TupleElement> {
    (
        prop::option::of(arb_short_string()),
        any::<bool>(),
        any::<bool>(),
        inner,
    )
        .prop_map(|(label, optional, rest, element)| TupleElement {
            label,
            optional,
            rest,
            readonly: false,
            element,
        })
}

fn arb_member(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TsMember> {
    (
        arb_short_string(),
        any::<bool>(),
        any::<bool>(),
        arb_member_kind(),
        prop::option::of(inner),
    )
        .prop_map(|(name, optional, readonly, kind, type_ref)| TsMember {
            name,
            optional,
            readonly,
            kind,
            description: None,
            description_raw: None,
            jsdoc: None,
            type_ref,
        })
}

fn arb_template_part(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TemplateLiteralPart> {
    prop_oneof![
        arb_short_string().prop_map(|value| TemplateLiteralPart::Text { value }),
        inner.prop_map(|value| TemplateLiteralPart::Type { value }),
    ]
}

fn optional_boxed(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = Option<Box<TypeRef>>> {
    prop::option::of(inner.prop_map(|t| Box::new(t)))
}

fn type_ref_strategy() -> impl Strategy<Value = TypeRef> {
    let leaf = prop_oneof![
        arb_short_string().prop_map(|name| TypeRef::Intrinsic { name }),
        arb_short_string().prop_map(|value| TypeRef::Literal { value }),
        arb_short_string().prop_map(|summary| TypeRef::Raw { summary }),
    ];
    leaf.prop_recursive(4, 48, 8, |inner: BoxedStrategy<TypeRef>| {
        prop_oneof![
            prop::collection::vec(inner.clone(), 1..4).prop_map(|types| TypeRef::Union { types }),
            prop::collection::vec(inner.clone(), 1..4)
                .prop_map(|types| TypeRef::Intersection { types }),
            inner.clone().prop_map(|element| TypeRef::Array {
                element: Box::new(element),
            }),
            (
                arb_short_string(),
                prop::option::of(arb_short_string()),
                prop::option::of(arb_short_string()),
                prop::option::of(prop::collection::vec(inner.clone(), 0..3)),
            )
                .prop_map(|(name, target_id, source_module, type_arguments)| {
                    TypeRef::Reference {
                        name,
                        target_id,
                        source_module,
                        type_arguments,
                    }
                },),
            prop::collection::vec(arb_tuple_element(inner.clone()), 0..4)
                .prop_map(|elements| TypeRef::Tuple { elements }),
            prop::collection::vec(arb_member(inner.clone()), 0..3)
                .prop_map(|members| TypeRef::Object { members }),
            (inner.clone(), inner.clone(), optional_boxed(inner.clone()),).prop_map(
                |(object, index, resolved)| TypeRef::IndexedAccess {
                    object: Box::new(object),
                    index: Box::new(index),
                    resolved,
                }
            ),
            (
                prop::collection::vec(arb_fn_param(inner.clone()), 0..3),
                inner.clone(),
            )
                .prop_map(|(params, return_type)| TypeRef::Function {
                    params,
                    return_type: Box::new(return_type),
                }),
            (
                any::<bool>(),
                prop::collection::vec(arb_type_parameter(inner.clone()), 0..2),
                prop::collection::vec(arb_fn_param(inner.clone()), 0..2),
                inner.clone(),
            )
                .prop_map(|(r#abstract, type_parameters, params, return_type)| {
                    TypeRef::Constructor {
                        r#abstract,
                        type_parameters,
                        params,
                        return_type: Box::new(return_type),
                    }
                },),
            (
                arb_type_operator_kind(),
                inner.clone(),
                optional_boxed(inner.clone()),
            )
                .prop_map(|(operator, target, resolved)| TypeRef::TypeOperator {
                    operator,
                    target: Box::new(target),
                    resolved,
                }),
            (arb_short_string(), optional_boxed(inner.clone())).prop_map(
                |(expression, resolved)| TypeRef::TypeQuery {
                    expression,
                    resolved,
                },
            ),
            (
                inner.clone(),
                inner.clone(),
                inner.clone(),
                inner.clone(),
                optional_boxed(inner.clone()),
            )
                .prop_map(
                    |(check_type, extends_type, true_type, false_type, resolved)| {
                        TypeRef::Conditional {
                            check_type: Box::new(check_type),
                            extends_type: Box::new(extends_type),
                            true_type: Box::new(true_type),
                            false_type: Box::new(false_type),
                            resolved,
                        }
                    },
                ),
            (
                arb_short_string(),
                inner.clone(),
                prop::option::of(inner.clone().prop_map(|t| Box::new(t))),
                arb_modifier_kind(),
                arb_modifier_kind(),
                prop::option::of(inner.clone().prop_map(|t| Box::new(t))),
            )
                .prop_map(
                    |(
                        type_param,
                        source_type,
                        name_type,
                        optional_modifier,
                        readonly_modifier,
                        value_type,
                    )| TypeRef::Mapped {
                        type_param,
                        source_type: Box::new(source_type),
                        name_type,
                        optional_modifier,
                        readonly_modifier,
                        value_type,
                    },
                ),
            (
                prop::collection::vec(arb_template_part(inner.clone()), 1..6),
                optional_boxed(inner),
            )
                .prop_map(|(parts, resolved)| TypeRef::TemplateLiteral { parts, resolved }),
        ]
        .boxed()
    })
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(64))]

    #[test]
    fn identity_map_is_identity(type_ref in type_ref_strategy()) {
        let mapped = map_type_ref(&mut IdentityMap, type_ref.clone());
        prop_assert_eq!(type_ref, mapped);
    }
}
