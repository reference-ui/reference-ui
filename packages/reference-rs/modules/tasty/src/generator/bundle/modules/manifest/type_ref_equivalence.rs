//! Structural equivalence of type references: the test that decides whether two same-named symbols describe the
//! same type. Two references are equivalent when they are the same variant with equivalent fields, and the walk
//! recurses into each variant's children. Differing variants are never equivalent.

use crate::model::TypeRef;

use super::equivalence::{
    fn_params_equivalent, members_equivalent, template_literal_parts_equivalent,
    tuple_elements_equivalent, type_parameters_equivalent,
};

/// Whether two type references are structurally equivalent. The dispatch is a chain of families over the pair, so
/// each match stays within the arm budget; a pair of different variants falls through to `false`.
pub(super) fn type_ref_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    match (left, right) {
        (TypeRef::Intrinsic { name: left }, TypeRef::Intrinsic { name: right })
        | (TypeRef::Literal { value: left }, TypeRef::Literal { value: right })
        | (TypeRef::Raw { summary: left }, TypeRef::Raw { summary: right }) => left == right,
        (TypeRef::Reference { .. }, TypeRef::Reference { .. }) => {
            reference_equivalent(left, right)
        }
        (TypeRef::Array { element: left }, TypeRef::Array { element: right }) => {
            type_ref_equivalent(left, right)
        }
        _ => collection_equivalent(left, right),
    }
}

fn collection_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    match (left, right) {
        (TypeRef::Union { types: left }, TypeRef::Union { types: right })
        | (TypeRef::Intersection { types: left }, TypeRef::Intersection { types: right }) => {
            type_refs_equivalent(left, right)
        }
        (TypeRef::Tuple { elements: left }, TypeRef::Tuple { elements: right }) => {
            tuple_elements_equivalent(left, right)
        }
        (TypeRef::Object { members: left }, TypeRef::Object { members: right }) => {
            members_equivalent(left, right)
        }
        _ => access_equivalent(left, right),
    }
}

fn access_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    match (left, right) {
        (TypeRef::IndexedAccess { .. }, TypeRef::IndexedAccess { .. }) => {
            indexed_access_equivalent(left, right)
        }
        (TypeRef::TypeOperator { .. }, TypeRef::TypeOperator { .. }) => {
            type_operator_equivalent(left, right)
        }
        (TypeRef::TypeQuery { .. }, TypeRef::TypeQuery { .. }) => {
            type_query_equivalent(left, right)
        }
        _ => signature_equivalent(left, right),
    }
}

fn signature_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    match (left, right) {
        (TypeRef::Function { .. }, TypeRef::Function { .. }) => function_equivalent(left, right),
        (TypeRef::Constructor { .. }, TypeRef::Constructor { .. }) => {
            constructor_equivalent(left, right)
        }
        _ => binder_equivalent(left, right),
    }
}

fn binder_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    match (left, right) {
        (TypeRef::Conditional { .. }, TypeRef::Conditional { .. }) => {
            conditional_equivalent(left, right)
        }
        (TypeRef::Mapped { .. }, TypeRef::Mapped { .. }) => mapped_equivalent(left, right),
        (TypeRef::TemplateLiteral { .. }, TypeRef::TemplateLiteral { .. }) => {
            template_literal_equivalent(left, right)
        }
        _ => false,
    }
}

fn reference_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::Reference {
            name: left_name,
            type_arguments: left_args,
            type_parameter: left_bound,
            ..
        },
        TypeRef::Reference {
            name: right_name,
            type_arguments: right_args,
            type_parameter: right_bound,
            ..
        },
    ) = (left, right)
    else {
        return false;
    };

    left_name == right_name
        && left_bound == right_bound
        && optional_type_ref_list_equivalent(left_args.as_deref(), right_args.as_deref())
}

fn indexed_access_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::IndexedAccess {
            object: left_object,
            index: left_index,
            resolved: left_resolved,
        },
        TypeRef::IndexedAccess {
            object: right_object,
            index: right_index,
            resolved: right_resolved,
        },
    ) = (left, right)
    else {
        return false;
    };

    type_ref_equivalent(left_object, right_object)
        && type_ref_equivalent(left_index, right_index)
        && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
}

fn type_operator_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::TypeOperator {
            operator: left_operator,
            target: left_target,
            resolved: left_resolved,
        },
        TypeRef::TypeOperator {
            operator: right_operator,
            target: right_target,
            resolved: right_resolved,
        },
    ) = (left, right)
    else {
        return false;
    };

    left_operator == right_operator
        && type_ref_equivalent(left_target, right_target)
        && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
}

fn type_query_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::TypeQuery {
            expression: left_expression,
            resolved: left_resolved,
        },
        TypeRef::TypeQuery {
            expression: right_expression,
            resolved: right_resolved,
        },
    ) = (left, right)
    else {
        return false;
    };

    left_expression == right_expression
        && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
}

fn function_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::Function {
            params: left_params,
            return_type: left_return,
        },
        TypeRef::Function {
            params: right_params,
            return_type: right_return,
        },
    ) = (left, right)
    else {
        return false;
    };

    fn_params_equivalent(left_params, right_params)
        && type_ref_equivalent(left_return, right_return)
}

fn constructor_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::Constructor {
            r#abstract: left_abstract,
            type_parameters: left_type_parameters,
            params: left_params,
            return_type: left_return,
        },
        TypeRef::Constructor {
            r#abstract: right_abstract,
            type_parameters: right_type_parameters,
            params: right_params,
            return_type: right_return,
        },
    ) = (left, right)
    else {
        return false;
    };

    left_abstract == right_abstract
        && type_parameters_equivalent(left_type_parameters, right_type_parameters)
        && fn_params_equivalent(left_params, right_params)
        && type_ref_equivalent(left_return, right_return)
}

fn conditional_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::Conditional {
            check_type: left_check,
            extends_type: left_extends,
            true_type: left_true,
            false_type: left_false,
            resolved: left_resolved,
        },
        TypeRef::Conditional {
            check_type: right_check,
            extends_type: right_extends,
            true_type: right_true,
            false_type: right_false,
            resolved: right_resolved,
        },
    ) = (left, right)
    else {
        return false;
    };

    type_ref_equivalent(left_check, right_check)
        && type_ref_equivalent(left_extends, right_extends)
        && type_ref_equivalent(left_true, right_true)
        && type_ref_equivalent(left_false, right_false)
        && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
}

fn mapped_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::Mapped {
            type_param: left_type_param,
            source_type: left_source,
            name_type: left_name_type,
            optional_modifier: left_optional,
            readonly_modifier: left_readonly,
            value_type: left_value,
        },
        TypeRef::Mapped {
            type_param: right_type_param,
            source_type: right_source,
            name_type: right_name_type,
            optional_modifier: right_optional,
            readonly_modifier: right_readonly,
            value_type: right_value,
        },
    ) = (left, right)
    else {
        return false;
    };

    left_type_param == right_type_param
        && type_ref_equivalent(left_source, right_source)
        && optional_boxed_type_ref_equivalent(left_name_type, right_name_type)
        && left_optional == right_optional
        && left_readonly == right_readonly
        && optional_boxed_type_ref_equivalent(left_value, right_value)
}

fn template_literal_equivalent(left: &TypeRef, right: &TypeRef) -> bool {
    let (
        TypeRef::TemplateLiteral {
            parts: left_parts,
            resolved: left_resolved,
        },
        TypeRef::TemplateLiteral {
            parts: right_parts,
            resolved: right_resolved,
        },
    ) = (left, right)
    else {
        return false;
    };

    template_literal_parts_equivalent(left_parts, right_parts)
        && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
}

/// Both absent, or both present and equivalent.
pub(super) fn optional_type_ref_equivalent(
    left: &Option<TypeRef>,
    right: &Option<TypeRef>,
) -> bool {
    match (left, right) {
        (Some(left), Some(right)) => type_ref_equivalent(left, right),
        (None, None) => true,
        _ => false,
    }
}

pub(super) fn type_refs_equivalent(left: &[TypeRef], right: &[TypeRef]) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| type_ref_equivalent(left, right))
}

fn optional_type_ref_list_equivalent(left: Option<&[TypeRef]>, right: Option<&[TypeRef]>) -> bool {
    match (left, right) {
        (Some(left), Some(right)) => type_refs_equivalent(left, right),
        (None, None) => true,
        _ => false,
    }
}

fn optional_boxed_type_ref_equivalent(
    left: &Option<Box<TypeRef>>,
    right: &Option<Box<TypeRef>>,
) -> bool {
    match (left, right) {
        (Some(left), Some(right)) => type_ref_equivalent(left, right),
        (None, None) => true,
        _ => false,
    }
}
