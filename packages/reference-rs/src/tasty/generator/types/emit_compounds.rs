use std::collections::BTreeMap;

use crate::tasty::generator::symbols::{emit_ref_object, reference_descriptor};
use crate::tasty::generator::util::{emit_field, emit_object, to_js_literal};
use crate::tasty::model::{FnParam, TsTypeParameter, TypeRef, TypeScriptBundle};

use super::emit_collections::{emit_fn_params, emit_type_parameters};
use super::{emit_optional_type_ref, emit_type_ref, push_optional_type_ref_field};

pub(super) fn emit_reference_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let reference = reference_descriptor(bundle, type_ref, export_names)
        .ok_or_else(|| "Failed to emit reference.".to_string())?;
    emit_ref_object(bundle, &reference, export_names)
}

pub(super) fn emit_reference_with_type_arguments(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    _args: &[TypeRef],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_reference_type_ref(bundle, type_ref, export_names)
}

pub(super) fn emit_constructor_type_ref(
    bundle: &TypeScriptBundle,
    is_abstract: bool,
    type_parameters: &[TsTypeParameter],
    params: &[FnParam],
    return_type: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut fields = vec![
        emit_field("kind", to_js_literal("constructor")?),
        emit_field("abstract", to_js_literal(&is_abstract)?),
    ];

    push_constructor_type_parameters(&mut fields, bundle, type_parameters, export_names)?;
    fields.push(emit_field(
        "params",
        emit_fn_params(bundle, params, export_names)?,
    ));
    fields.push(emit_field(
        "returnType",
        emit_type_ref(bundle, return_type, export_names)?,
    ));

    Ok(emit_object(fields))
}

fn push_constructor_type_parameters(
    fields: &mut Vec<String>,
    bundle: &TypeScriptBundle,
    type_parameters: &[TsTypeParameter],
    export_names: &BTreeMap<String, String>,
) -> Result<(), String> {
    if !type_parameters.is_empty() {
        fields.push(emit_field(
            "typeParameters",
            emit_type_parameters(bundle, type_parameters, export_names)?,
        ));
    }

    Ok(())
}

pub(super) fn emit_mapped_type_ref(
    bundle: &TypeScriptBundle,
    type_param: &str,
    source_type: &TypeRef,
    name_type: Option<&TypeRef>,
    optional_modifier: &str,
    readonly_modifier: &str,
    value_type: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut fields = vec![
        emit_field("kind", to_js_literal("mapped")?),
        emit_field("typeParam", to_js_literal(type_param)?),
        emit_field(
            "sourceType",
            emit_type_ref(bundle, source_type, export_names)?,
        ),
        emit_field("optionalModifier", to_js_literal(optional_modifier)?),
        emit_field("readonlyModifier", to_js_literal(readonly_modifier)?),
    ];

    push_optional_type_ref_field(fields.as_mut(), "nameType", bundle, name_type, export_names)?;
    fields.push(emit_field(
        "valueType",
        emit_optional_type_ref(bundle, value_type, export_names)?,
    ));

    Ok(emit_object(fields))
}
