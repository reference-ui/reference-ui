//! Structural equivalence for the parts of a symbol that are not type references themselves: type parameters,
//! members, function parameters, tuple elements, and template literal parts. Each comparison requires equal lengths
//! and compares the parts in order, and it defers to `type_ref_equivalence` for every type reference a part holds.

use crate::model::{FnParam, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement};

use super::type_ref_equivalence::{optional_type_ref_equivalent, type_ref_equivalent};

pub(super) fn type_parameters_equivalent(
    left: &[TsTypeParameter],
    right: &[TsTypeParameter],
) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.name == right.name
                && optional_type_ref_equivalent(&left.constraint, &right.constraint)
                && optional_type_ref_equivalent(&left.default, &right.default)
        })
}

pub(super) fn members_equivalent(left: &[TsMember], right: &[TsMember]) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.name == right.name
                && left.optional == right.optional
                && left.readonly == right.readonly
                && left.kind == right.kind
                && left.description == right.description
                && left.description_raw == right.description_raw
                && left.jsdoc == right.jsdoc
                && optional_type_ref_equivalent(&left.type_ref, &right.type_ref)
        })
}

pub(super) fn fn_params_equivalent(left: &[FnParam], right: &[FnParam]) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.name == right.name
                && left.optional == right.optional
                && optional_type_ref_equivalent(&left.type_ref, &right.type_ref)
        })
}

pub(super) fn tuple_elements_equivalent(left: &[TupleElement], right: &[TupleElement]) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.label == right.label
                && left.optional == right.optional
                && left.rest == right.rest
                && left.readonly == right.readonly
                && type_ref_equivalent(&left.element, &right.element)
        })
}

pub(super) fn template_literal_parts_equivalent(
    left: &[TemplateLiteralPart],
    right: &[TemplateLiteralPart],
) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| match (left, right) {
                (
                    TemplateLiteralPart::Text { value: left },
                    TemplateLiteralPart::Text { value: right },
                ) => left == right,
                (
                    TemplateLiteralPart::Type { value: left },
                    TemplateLiteralPart::Type { value: right },
                ) => type_ref_equivalent(left, right),
                _ => false,
            })
}
