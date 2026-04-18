mod emit_collections;
mod emit_compounds;
mod emit_leaves;

use std::collections::BTreeMap;

use crate::tasty::generator::util::{emit_field, emit_object, indent_block, to_js_literal};
use crate::tasty::model::TypeRef;

use emit_collections::emit_fn_params;
pub(crate) use emit_collections::emit_type_ref_array;
pub(super) use emit_collections::{emit_members, emit_type_parameters};
use emit_compounds::{
    emit_constructor_type_ref, emit_mapped_type_ref, emit_reference_type_ref,
    emit_reference_with_type_arguments,
};
use emit_leaves::{emit_template_literal_part, emit_tuple_element};

pub(super) use emit_leaves::emit_jsdoc;

pub(super) fn emit_optional_type_ref(
    bundle: &crate::tasty::model::TypeScriptBundle,
    type_ref: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        Some(type_ref) => emit_type_ref(bundle, type_ref, export_names),
        None => Ok("null".to_string()),
    }
}

pub(super) fn emit_type_ref(
    bundle: &crate::tasty::model::TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Intrinsic { name } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("intrinsic")?),
            emit_field("name", to_js_literal(name)?),
        ])),
        TypeRef::Literal { value } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("literal")?),
            emit_field("value", to_js_literal(value)?),
        ])),
        TypeRef::Reference {
            type_arguments: Some(args),
            ..
        } => emit_reference_with_type_arguments(bundle, type_ref, args, export_names),
        TypeRef::Reference { .. } => emit_reference_type_ref(bundle, type_ref, export_names),
        TypeRef::Object { members } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("object")?),
            emit_field("members", emit_members(bundle, members, export_names)?),
        ])),
        TypeRef::Union { types } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("union")?),
            emit_field("types", emit_type_ref_array(bundle, types, export_names)?),
        ])),
        TypeRef::Array { element } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("array")?),
            emit_field("element", emit_type_ref(bundle, element, export_names)?),
        ])),
        TypeRef::Tuple { elements } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("tuple")?),
            emit_field(
                "elements",
                emit_indented_array(elements, |element| {
                    emit_tuple_element(bundle, element, export_names)
                })?,
            ),
        ])),
        TypeRef::Intersection { types } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("intersection")?),
            emit_field("types", emit_type_ref_array(bundle, types, export_names)?),
        ])),
        TypeRef::IndexedAccess {
            object,
            index,
            resolved,
        } => emit_type_ref_with_optional_resolved(
            "indexed_access",
            vec![
                emit_field("object", emit_type_ref(bundle, object, export_names)?),
                emit_field("index", emit_type_ref(bundle, index, export_names)?),
            ],
            bundle,
            resolved.as_deref(),
            export_names,
        ),
        TypeRef::Function {
            params,
            return_type,
        } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("function")?),
            emit_field("params", emit_fn_params(bundle, params, export_names)?),
            emit_field(
                "returnType",
                emit_type_ref(bundle, return_type, export_names)?,
            ),
        ])),
        TypeRef::Constructor {
            r#abstract,
            type_parameters,
            params,
            return_type,
        } => emit_constructor_type_ref(
            bundle,
            *r#abstract,
            type_parameters,
            params,
            return_type,
            export_names,
        ),
        TypeRef::TypeOperator {
            operator,
            target,
            resolved,
        } => emit_type_ref_with_optional_resolved(
            "type_operator",
            vec![
                emit_field("operator", to_js_literal(operator.as_str())?),
                emit_field("target", emit_type_ref(bundle, target, export_names)?),
            ],
            bundle,
            resolved.as_deref(),
            export_names,
        ),
        TypeRef::TypeQuery {
            expression,
            resolved,
        } => emit_type_ref_with_optional_resolved(
            "type_query",
            vec![emit_field("expression", to_js_literal(expression)?)],
            bundle,
            resolved.as_deref(),
            export_names,
        ),
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
            resolved,
        } => emit_type_ref_with_optional_resolved(
            "conditional",
            vec![
                emit_field(
                    "checkType",
                    emit_type_ref(bundle, check_type, export_names)?,
                ),
                emit_field(
                    "extendsType",
                    emit_type_ref(bundle, extends_type, export_names)?,
                ),
                emit_field("trueType", emit_type_ref(bundle, true_type, export_names)?),
                emit_field(
                    "falseType",
                    emit_type_ref(bundle, false_type, export_names)?,
                ),
            ],
            bundle,
            resolved.as_deref(),
            export_names,
        ),
        TypeRef::Mapped {
            type_param,
            source_type,
            name_type,
            optional_modifier,
            readonly_modifier,
            value_type,
        } => emit_mapped_type_ref(
            bundle,
            type_param,
            source_type,
            name_type.as_deref(),
            optional_modifier.as_str(),
            readonly_modifier.as_str(),
            value_type.as_deref(),
            export_names,
        ),
        TypeRef::TemplateLiteral { parts, resolved } => emit_type_ref_with_optional_resolved(
            "template_literal",
            vec![emit_field(
                "parts",
                emit_indented_array(parts, |part| {
                    emit_template_literal_part(bundle, part, export_names)
                })?,
            )],
            bundle,
            resolved.as_deref(),
            export_names,
        ),
        TypeRef::Raw { summary } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("raw")?),
            emit_field("summary", to_js_literal(summary)?),
        ])),
    }
}

fn emit_type_ref_with_optional_resolved(
    kind: &str,
    mut fields: Vec<String>,
    bundle: &crate::tasty::model::TypeScriptBundle,
    resolved: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    fields.insert(0, emit_field("kind", to_js_literal(kind)?));
    push_optional_type_ref_field(&mut fields, "resolved", bundle, resolved, export_names)?;
    Ok(emit_object(fields))
}

fn push_optional_type_ref_field(
    fields: &mut Vec<String>,
    name: &str,
    bundle: &crate::tasty::model::TypeScriptBundle,
    type_ref: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<(), String> {
    if let Some(type_ref) = type_ref {
        fields.push(emit_field(
            name,
            emit_type_ref(bundle, type_ref, export_names)?,
        ));
    }

    Ok(())
}

fn emit_indented_array<T>(
    items: &[T],
    mut emit_item: impl FnMut(&T) -> Result<String, String>,
) -> Result<String, String> {
    use crate::tasty::generator::util::emit_array;

    let items = items
        .iter()
        .map(|item| emit_item(item).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(emit_array(items))
}
