//! Emitters for the variants that resolve through the symbol table or carry a signature of their own: references,
//! construct signatures, and mapped types. The construct and mapped emitters take the whole `TypeRef` and read its
//! fields with a let-else, so the family dispatch in `mod.rs` passes one value per variant.

use std::collections::BTreeMap;

use crate::generator::symbols::{emit_ref_object, reference_descriptor};
use crate::generator::util::{emit_field, emit_object, to_js_literal};
use crate::model::{TsTypeParameter, TypeRef, TypeScriptBundle};

use super::emit_collections::{emit_fn_params, emit_type_parameters};
use super::{emit_optional_type_ref, emit_type_ref, optional_type_ref_field};

pub(super) fn emit_reference_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let reference = reference_descriptor(bundle, type_ref, export_names)
        .ok_or_else(|| "Failed to emit reference.".to_string())?;
    emit_ref_object(bundle, &reference, export_names)
}

pub(super) fn emit_constructor_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let TypeRef::Constructor {
        r#abstract,
        type_parameters,
        params,
        return_type,
    } = type_ref
    else {
        return Err("expected a constructor type".to_string());
    };

    let mut fields = vec![
        emit_field("kind", to_js_literal("constructor")?),
        emit_field("abstract", to_js_literal(r#abstract)?),
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
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let TypeRef::Mapped {
        type_param,
        source_type,
        name_type,
        optional_modifier,
        readonly_modifier,
        value_type,
    } = type_ref
    else {
        return Err("expected a mapped type".to_string());
    };

    let mut fields = vec![
        emit_field("kind", to_js_literal("mapped")?),
        emit_field("typeParam", to_js_literal(type_param)?),
        emit_field(
            "sourceType",
            emit_type_ref(bundle, source_type, export_names)?,
        ),
        emit_field("optionalModifier", to_js_literal(optional_modifier.as_str())?),
        emit_field("readonlyModifier", to_js_literal(readonly_modifier.as_str())?),
    ];

    fields.extend(optional_type_ref_field(
        "nameType",
        name_type.as_deref(),
        bundle,
        export_names,
    )?);
    fields.push(emit_field(
        "valueType",
        emit_optional_type_ref(bundle, value_type.as_deref(), export_names)?,
    ));

    Ok(emit_object(fields))
}
