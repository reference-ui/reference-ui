//! Lowers a `TypeRef` to the JS object literal the generated manifest carries. `emit_type_ref` is the one exhaustive
//! match over all seventeen variants: each arm sends one family to its dispatcher, and a dispatcher matches only its
//! own variants before calling an emitter in `emit_variants` or `emit_compounds`. No dispatcher calls another, so a
//! new variant is a compile error at the router until it is routed. Each emitter writes a `kind` discriminant first
//! and adds `resolved` only when the resolution is present.

mod emit_collections;
mod emit_compounds;
mod emit_leaves;
mod emit_variants;

use std::collections::BTreeMap;

use crate::generator::util::{emit_field, emit_object, indent_block, to_js_literal};
use crate::model::{TypeRef, TypeScriptBundle};

pub(crate) use emit_collections::emit_type_ref_array;
pub(super) use emit_collections::{emit_members, emit_type_parameters};
use emit_compounds::{emit_constructor_type_ref, emit_mapped_type_ref, emit_reference_type_ref};
use emit_variants::{
    emit_array_type_ref, emit_conditional_type_ref, emit_function_type_ref,
    emit_indexed_access_type_ref, emit_intrinsic_type_ref, emit_list_type_ref,
    emit_literal_type_ref, emit_object_type_ref, emit_raw_type_ref,
    emit_template_literal_type_ref, emit_tuple_type_ref, emit_type_operator_type_ref,
    emit_type_query_type_ref,
};

pub(super) use emit_leaves::emit_jsdoc;

pub(super) fn emit_optional_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        Some(type_ref) => emit_type_ref(bundle, type_ref, export_names),
        None => Ok("null".to_string()),
    }
}

/// The one exhaustive match over the seventeen variants. Each arm hands a whole family to one dispatcher, so no arm
/// needs a catch-all for a variant that a sibling family owns.
pub(super) fn emit_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Reference { .. } | TypeRef::Intrinsic { .. } | TypeRef::Literal { .. } => {
            emit_reference_or_leaf_type_ref(bundle, type_ref, export_names)
        }
        TypeRef::Raw { .. }
        | TypeRef::Object { .. }
        | TypeRef::Union { .. }
        | TypeRef::Array { .. } => emit_member_type_ref(bundle, type_ref, export_names),
        TypeRef::Tuple { .. }
        | TypeRef::Intersection { .. }
        | TypeRef::IndexedAccess { .. }
        | TypeRef::TypeOperator { .. } => {
            emit_tuple_access_type_ref(bundle, type_ref, export_names)
        }
        TypeRef::Function { .. } | TypeRef::Constructor { .. } | TypeRef::TypeQuery { .. } => {
            emit_signature_type_ref(bundle, type_ref, export_names)
        }
        TypeRef::Conditional { .. } | TypeRef::Mapped { .. } | TypeRef::TemplateLiteral { .. } => {
            emit_binder_type_ref(bundle, type_ref, export_names)
        }
    }
}

/// A reference, which the reference emitter builds from its descriptor, and the two leaf kinds, one scalar each.
fn emit_reference_or_leaf_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Reference { .. } => emit_reference_type_ref(bundle, type_ref, export_names),
        TypeRef::Intrinsic { name } => emit_intrinsic_type_ref(name),
        TypeRef::Literal { value } => emit_literal_type_ref(value),
        _ => unreachable!("emit_type_ref routes only reference and leaf variants here"),
    }
}

/// Raw source text, object literals, unions, and arrays.
fn emit_member_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Raw { summary } => emit_raw_type_ref(summary),
        TypeRef::Object { members } => emit_object_type_ref(bundle, members, export_names),
        TypeRef::Union { types } => emit_list_type_ref("union", types, bundle, export_names),
        TypeRef::Array { element } => emit_array_type_ref(bundle, element, export_names),
        _ => unreachable!("emit_type_ref routes only member variants here"),
    }
}

/// Tuples, intersections, and the indexed and operator types.
fn emit_tuple_access_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Tuple { elements } => emit_tuple_type_ref(bundle, elements, export_names),
        TypeRef::Intersection { types } => {
            emit_list_type_ref("intersection", types, bundle, export_names)
        }
        TypeRef::IndexedAccess { .. } => {
            emit_indexed_access_type_ref(bundle, type_ref, export_names)
        }
        TypeRef::TypeOperator { .. } => emit_type_operator_type_ref(bundle, type_ref, export_names),
        _ => unreachable!("emit_type_ref routes only tuple_access variants here"),
    }
}

/// Function and construct signatures, and type queries.
fn emit_signature_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Function {
            params,
            return_type,
        } => emit_function_type_ref(bundle, params, return_type, export_names),
        TypeRef::Constructor { .. } => emit_constructor_type_ref(bundle, type_ref, export_names),
        TypeRef::TypeQuery {
            expression,
            resolved,
        } => emit_type_query_type_ref(bundle, expression, resolved.as_deref(), export_names),
        _ => unreachable!("emit_type_ref routes only signature variants here"),
    }
}

/// Conditional, mapped, and template literal types, which bind names of their own.
fn emit_binder_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Conditional { .. } => emit_conditional_type_ref(bundle, type_ref, export_names),
        TypeRef::Mapped { .. } => emit_mapped_type_ref(bundle, type_ref, export_names),
        TypeRef::TemplateLiteral { parts, resolved } => emit_template_literal_type_ref(
            bundle,
            parts,
            resolved.as_deref(),
            export_names,
        ),
        _ => unreachable!("emit_type_ref routes only binder variants here"),
    }
}

/// `{ kind, ...fields, ...optional }`, with the kind discriminant first.
pub(super) fn emit_kind_object(
    kind: &str,
    mut fields: Vec<String>,
    optional: Option<String>,
) -> Result<String, String> {
    fields.insert(0, emit_field("kind", to_js_literal(kind)?));
    fields.extend(optional);
    Ok(emit_object(fields))
}

/// The field a present optional type reference contributes, or nothing when the reference is absent.
pub(super) fn optional_type_ref_field(
    name: &str,
    type_ref: Option<&TypeRef>,
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<Option<String>, String> {
    let Some(type_ref) = type_ref else {
        return Ok(None);
    };
    Ok(Some(emit_field(
        name,
        emit_type_ref(bundle, type_ref, export_names)?,
    )))
}

fn emit_indented_array<T>(
    items: &[T],
    mut emit_item: impl FnMut(&T) -> Result<String, String>,
) -> Result<String, String> {
    use crate::generator::util::emit_array;

    let items = items
        .iter()
        .map(|item| emit_item(item).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(emit_array(items))
}
