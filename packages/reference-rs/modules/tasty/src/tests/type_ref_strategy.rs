//! The recursive `TypeRef` generator for the identity property. Leaves grow into composite variants through one
//! helper per variant, listed in the same order as the original single generator, so the sampled values keep their
//! distribution and draw order. The leaf primitives come from `type_ref_proptest`.

use proptest::prelude::*;
use proptest::strategy::BoxedStrategy;

use crate::model::TypeRef;

use super::type_ref_proptest::{
    arb_fn_param, arb_member, arb_modifier_kind, arb_short_string, arb_template_part,
    arb_tuple_element, arb_type_operator_kind, arb_type_parameter, optional_boxed,
};

pub(super) fn type_ref_strategy() -> impl Strategy<Value = TypeRef> {
    let leaf = prop_oneof![
        arb_short_string().prop_map(|name| TypeRef::Intrinsic { name }),
        arb_short_string().prop_map(|value| TypeRef::Literal { value }),
        arb_short_string().prop_map(|summary| TypeRef::Raw { summary }),
    ];
    leaf.prop_recursive(4, 48, 8, |inner: BoxedStrategy<TypeRef>| {
        prop_oneof![
            union_strategy(inner.clone()),
            intersection_strategy(inner.clone()),
            array_strategy(inner.clone()),
            reference_strategy(inner.clone()),
            tuple_strategy(inner.clone()),
            object_strategy(inner.clone()),
            indexed_access_strategy(inner.clone()),
            function_strategy(inner.clone()),
            constructor_strategy(inner.clone()),
            type_operator_strategy(inner.clone()),
            type_query_strategy(inner.clone()),
            conditional_strategy(inner.clone()),
            mapped_strategy(inner.clone()),
            template_literal_strategy(inner),
        ]
        .boxed()
    })
}

fn union_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    prop::collection::vec(inner, 1..4).prop_map(|types| TypeRef::Union { types })
}

fn intersection_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    prop::collection::vec(inner, 1..4).prop_map(|types| TypeRef::Intersection { types })
}

fn array_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    inner.prop_map(|element| TypeRef::Array {
        element: Box::new(element),
    })
}

fn reference_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (
        arb_short_string(),
        prop::option::of(arb_short_string()),
        prop::option::of(arb_short_string()),
        prop::option::of(prop::collection::vec(inner, 0..3)),
        any::<bool>(),
    )
        .prop_map(
            |(name, target_id, source_module, type_arguments, type_parameter)| TypeRef::Reference {
                name,
                target_id,
                source_module,
                type_arguments,
                type_parameter,
            },
        )
}

fn tuple_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    prop::collection::vec(arb_tuple_element(inner), 0..4).prop_map(|elements| TypeRef::Tuple { elements })
}

fn object_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    prop::collection::vec(arb_member(inner), 0..3).prop_map(|members| TypeRef::Object { members })
}

fn indexed_access_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (inner.clone(), inner.clone(), optional_boxed(inner)).prop_map(|(object, index, resolved)| {
        TypeRef::IndexedAccess {
            object: Box::new(object),
            index: Box::new(index),
            resolved,
        }
    })
}

fn function_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (
        prop::collection::vec(arb_fn_param(inner.clone()), 0..3),
        inner,
    )
        .prop_map(|(params, return_type)| TypeRef::Function {
            params,
            return_type: Box::new(return_type),
        })
}

fn constructor_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (
        any::<bool>(),
        prop::collection::vec(arb_type_parameter(inner.clone()), 0..2),
        prop::collection::vec(arb_fn_param(inner.clone()), 0..2),
        inner,
    )
        .prop_map(|(r#abstract, type_parameters, params, return_type)| {
            TypeRef::Constructor {
                r#abstract,
                type_parameters,
                params,
                return_type: Box::new(return_type),
            }
        })
}

fn type_operator_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (arb_type_operator_kind(), inner.clone(), optional_boxed(inner)).prop_map(
        |(operator, target, resolved)| TypeRef::TypeOperator {
            operator,
            target: Box::new(target),
            resolved,
        },
    )
}

fn type_query_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (arb_short_string(), optional_boxed(inner)).prop_map(|(expression, resolved)| {
        TypeRef::TypeQuery {
            expression,
            resolved,
        }
    })
}

fn conditional_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (
        inner.clone(),
        inner.clone(),
        inner.clone(),
        inner.clone(),
        optional_boxed(inner),
    )
        .prop_map(
            |(check_type, extends_type, true_type, false_type, resolved)| TypeRef::Conditional {
                check_type: Box::new(check_type),
                extends_type: Box::new(extends_type),
                true_type: Box::new(true_type),
                false_type: Box::new(false_type),
                resolved,
            },
        )
}

fn mapped_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (
        arb_short_string(),
        inner.clone(),
        prop::option::of(inner.clone().prop_map(|t| Box::new(t))),
        arb_modifier_kind(),
        arb_modifier_kind(),
        prop::option::of(inner.prop_map(|t| Box::new(t))),
    )
        .prop_map(
            |(type_param, source_type, name_type, optional_modifier, readonly_modifier, value_type)| {
                TypeRef::Mapped {
                    type_param,
                    source_type: Box::new(source_type),
                    name_type,
                    optional_modifier,
                    readonly_modifier,
                    value_type,
                }
            },
        )
}

fn template_literal_strategy(inner: BoxedStrategy<TypeRef>) -> impl Strategy<Value = TypeRef> {
    (
        prop::collection::vec(arb_template_part(inner.clone()), 1..6),
        optional_boxed(inner),
    )
        .prop_map(|(parts, resolved)| TypeRef::TemplateLiteral { parts, resolved })
}
