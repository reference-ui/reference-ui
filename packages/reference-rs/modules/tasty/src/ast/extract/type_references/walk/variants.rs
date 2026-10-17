//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use crate::model::TypeRef;

use super::helpers::{
    walk_fn_params, walk_member_types, walk_optional, walk_slice, walk_template_literal_parts,
    walk_tuple_elements, walk_type_parameter,
};

/// Pushes the references a type holds and walks into its children. Each family below handles a few variants and
/// passes the rest down the chain, so every match stays within the arm budget.
pub fn dispatch(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Reference {
            type_arguments: Some(args),
            ..
        } => {
            references.push(type_ref.clone());
            walk_slice(args, references);
        }
        TypeRef::Reference { .. } => references.push(type_ref.clone()),

        TypeRef::Union { types } | TypeRef::Intersection { types } => walk_slice(types, references),

        other => walk_list_members(other, references),
    }
}

fn walk_list_members(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Array { element } => super::collect_type_ref_references(element, references),
        TypeRef::Tuple { elements } => walk_tuple_elements(elements, references),
        TypeRef::Object { members } => walk_member_types(members, references),
        other => walk_access_and_signatures(other, references),
    }
}

fn walk_access_and_signatures(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::IndexedAccess {
            object,
            index,
            resolved,
        } => {
            super::collect_type_ref_references(object, references);
            super::collect_type_ref_references(index, references);
            walk_optional(resolved.as_deref(), references);
        }
        TypeRef::Function {
            params,
            return_type,
        } => {
            walk_fn_params(params, references);
            super::collect_type_ref_references(return_type, references);
        }
        TypeRef::Constructor {
            type_parameters,
            params,
            return_type,
            ..
        } => {
            type_parameters
                .iter()
                .for_each(|tp| walk_type_parameter(tp, references));
            walk_fn_params(params, references);
            super::collect_type_ref_references(return_type, references);
        }
        other => walk_operators_and_conditionals(other, references),
    }
}

fn walk_operators_and_conditionals(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::TypeOperator {
            target, resolved, ..
        } => {
            super::collect_type_ref_references(target, references);
            walk_optional(resolved.as_deref(), references);
        }
        TypeRef::TypeQuery { resolved, .. } => walk_optional(resolved.as_deref(), references),
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
            resolved,
        } => {
            [check_type, extends_type, true_type, false_type]
                .into_iter()
                .for_each(|t| super::collect_type_ref_references(t, references));
            walk_optional(resolved.as_deref(), references);
        }
        other => walk_binders(other, references),
    }
}

fn walk_binders(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Mapped {
            source_type,
            name_type,
            value_type,
            ..
        } => {
            super::collect_type_ref_references(source_type, references);
            walk_optional(name_type.as_deref(), references);
            walk_optional(value_type.as_deref(), references);
        }
        TypeRef::TemplateLiteral { parts, resolved } => {
            walk_template_literal_parts(parts, references);
            walk_optional(resolved.as_deref(), references);
        }
        _ => {}
    }
}
