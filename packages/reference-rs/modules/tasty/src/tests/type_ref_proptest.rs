//! Property tests for [`map_type_ref`](crate::shared::type_ref_map::map_type_ref) with
//! [`IdentityMap`](super::type_ref_map_identity::IdentityMap). The recursive generator lives in `type_ref_strategy`;
//! this file holds the leaf strategies it draws from and the identity property itself.

use proptest::prelude::*;
use proptest::strategy::BoxedStrategy;
use proptest::string::string_regex;

use crate::model::{
    FnParam, MappedModifierKind, TemplateLiteralPart, TsMember, TsMemberKind, TsTypeParameter,
    TupleElement, TypeOperatorKind, TypeRef,
};
use crate::shared::type_ref_map::map_type_ref;

use super::type_ref_map_identity::IdentityMap;
use super::type_ref_strategy::type_ref_strategy;

pub(super) fn arb_short_string() -> BoxedStrategy<String> {
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

pub(super) fn arb_modifier_kind() -> impl Strategy<Value = MappedModifierKind> {
    prop_oneof![
        Just(MappedModifierKind::Preserve),
        Just(MappedModifierKind::Add),
        Just(MappedModifierKind::Remove),
    ]
}

pub(super) fn arb_type_operator_kind() -> impl Strategy<Value = TypeOperatorKind> {
    prop_oneof![
        Just(TypeOperatorKind::Keyof),
        Just(TypeOperatorKind::Readonly),
        Just(TypeOperatorKind::Unique),
    ]
}

pub(super) fn arb_type_parameter(
    inner: BoxedStrategy<TypeRef>,
) -> impl Strategy<Value = TsTypeParameter> {
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

pub(super) fn arb_fn_param(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = FnParam> {
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

pub(super) fn arb_tuple_element(
    inner: BoxedStrategy<TypeRef>,
) -> impl Strategy<Value = TupleElement> {
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

pub(super) fn arb_member(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TsMember> {
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

pub(super) fn arb_template_part(
    inner: BoxedStrategy<TypeRef>,
) -> impl Strategy<Value = TemplateLiteralPart> {
    prop_oneof![
        arb_short_string().prop_map(|value| TemplateLiteralPart::Text { value }),
        inner.prop_map(|value| TemplateLiteralPart::Type { value }),
    ]
}

pub(super) fn optional_boxed(
    inner: BoxedStrategy<TypeRef>,
) -> impl Strategy<Value = Option<Box<TypeRef>>> {
    prop::option::of(inner.prop_map(|t| Box::new(t)))
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(64))]

    #[test]
    fn identity_map_is_identity(type_ref in type_ref_strategy()) {
        let mapped = map_type_ref(&mut IdentityMap, type_ref.clone());
        prop_assert_eq!(type_ref, mapped);
    }
}
