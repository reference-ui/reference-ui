use crate::tasty::model::TypeRef;

use super::helpers::{
    walk_fn_params, walk_member_types, walk_optional, walk_slice, walk_template_literal_parts,
    walk_tuple_elements, walk_type_parameter,
};

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

        TypeRef::Array { element } => super::collect_type_ref_references(element, references),

        TypeRef::Tuple { elements } => walk_tuple_elements(elements, references),

        TypeRef::Object { members } => walk_member_types(members, references),

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
            for tp in type_parameters {
                walk_type_parameter(tp, references);
            }
            walk_fn_params(params, references);
            super::collect_type_ref_references(return_type, references);
        }

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
            for t in [check_type, extends_type, true_type, false_type] {
                super::collect_type_ref_references(t, references);
            }
            walk_optional(resolved.as_deref(), references);
        }

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
