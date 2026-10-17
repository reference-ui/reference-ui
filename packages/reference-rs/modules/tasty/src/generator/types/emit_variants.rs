//! Per-variant emitters for `TypeRef` values that carry their own fields: keyword and literal leaves, object and
//! collection types, access and operator types, signatures, and template literals. Each writes its JS object
//! literal from the fields it is given, and the family dispatch in `mod.rs` chooses which emitter runs. Variants
//! with more fields than an emitter should take read them from the whole `TypeRef` with a let-else.

use std::collections::BTreeMap;

use crate::generator::util::{emit_field, emit_object, to_js_literal};
use crate::model::{FnParam, TemplateLiteralPart, TsMember, TupleElement, TypeRef, TypeScriptBundle};

use super::emit_collections::{emit_fn_params, emit_members, emit_type_ref_array};
use super::emit_leaves::{emit_template_literal_part, emit_tuple_element};
use super::{
    emit_indented_array, emit_kind_object, emit_type_ref, optional_type_ref_field,
};

pub(super) fn emit_intrinsic_type_ref(name: &str) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("intrinsic")?),
        emit_field("name", to_js_literal(name)?),
    ]))
}

pub(super) fn emit_literal_type_ref(value: &str) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("literal")?),
        emit_field("value", to_js_literal(value)?),
    ]))
}

pub(super) fn emit_raw_type_ref(summary: &str) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("raw")?),
        emit_field("summary", to_js_literal(summary)?),
    ]))
}

pub(super) fn emit_object_type_ref(
    bundle: &TypeScriptBundle,
    members: &[TsMember],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("object")?),
        emit_field("members", emit_members(bundle, members, export_names)?),
    ]))
}

/// A union or an intersection: the caller names the kind, the members are the same shape.
pub(super) fn emit_list_type_ref(
    kind: &str,
    types: &[TypeRef],
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal(kind)?),
        emit_field("types", emit_type_ref_array(bundle, types, export_names)?),
    ]))
}

pub(super) fn emit_array_type_ref(
    bundle: &TypeScriptBundle,
    element: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("array")?),
        emit_field("element", emit_type_ref(bundle, element, export_names)?),
    ]))
}

pub(super) fn emit_tuple_type_ref(
    bundle: &TypeScriptBundle,
    elements: &[TupleElement],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("tuple")?),
        emit_field(
            "elements",
            emit_indented_array(elements, |element| {
                emit_tuple_element(bundle, element, export_names)
            })?,
        ),
    ]))
}

pub(super) fn emit_indexed_access_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let TypeRef::IndexedAccess {
        object,
        index,
        resolved,
    } = type_ref
    else {
        return Err("expected an indexed access type".to_string());
    };

    let fields = vec![
        emit_field("object", emit_type_ref(bundle, object, export_names)?),
        emit_field("index", emit_type_ref(bundle, index, export_names)?),
    ];
    let resolved = optional_type_ref_field("resolved", resolved.as_deref(), bundle, export_names)?;
    emit_kind_object("indexed_access", fields, resolved)
}

pub(super) fn emit_type_operator_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let TypeRef::TypeOperator {
        operator,
        target,
        resolved,
    } = type_ref
    else {
        return Err("expected a type operator".to_string());
    };

    let fields = vec![
        emit_field("operator", to_js_literal(operator.as_str())?),
        emit_field("target", emit_type_ref(bundle, target, export_names)?),
    ];
    let resolved = optional_type_ref_field("resolved", resolved.as_deref(), bundle, export_names)?;
    emit_kind_object("type_operator", fields, resolved)
}

pub(super) fn emit_function_type_ref(
    bundle: &TypeScriptBundle,
    params: &[FnParam],
    return_type: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field("kind", to_js_literal("function")?),
        emit_field("params", emit_fn_params(bundle, params, export_names)?),
        emit_field(
            "returnType",
            emit_type_ref(bundle, return_type, export_names)?,
        ),
    ]))
}

pub(super) fn emit_type_query_type_ref(
    bundle: &TypeScriptBundle,
    expression: &str,
    resolved: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let fields = vec![emit_field("expression", to_js_literal(expression)?)];
    let resolved = optional_type_ref_field("resolved", resolved, bundle, export_names)?;
    emit_kind_object("type_query", fields, resolved)
}

pub(super) fn emit_conditional_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let TypeRef::Conditional {
        check_type,
        extends_type,
        true_type,
        false_type,
        resolved,
    } = type_ref
    else {
        return Err("expected a conditional type".to_string());
    };

    let fields = vec![
        emit_field("checkType", emit_type_ref(bundle, check_type, export_names)?),
        emit_field(
            "extendsType",
            emit_type_ref(bundle, extends_type, export_names)?,
        ),
        emit_field("trueType", emit_type_ref(bundle, true_type, export_names)?),
        emit_field("falseType", emit_type_ref(bundle, false_type, export_names)?),
    ];
    let resolved = optional_type_ref_field("resolved", resolved.as_deref(), bundle, export_names)?;
    emit_kind_object("conditional", fields, resolved)
}

pub(super) fn emit_template_literal_type_ref(
    bundle: &TypeScriptBundle,
    parts: &[TemplateLiteralPart],
    resolved: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let fields = vec![emit_field(
        "parts",
        emit_indented_array(parts, |part| {
            emit_template_literal_part(bundle, part, export_names)
        })?,
    )];
    let resolved = optional_type_ref_field("resolved", resolved, bundle, export_names)?;
    emit_kind_object("template_literal", fields, resolved)
}
