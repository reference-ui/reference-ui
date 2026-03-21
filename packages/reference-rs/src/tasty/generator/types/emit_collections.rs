use std::collections::BTreeMap;

use crate::tasty::model::{FnParam, TsMember, TsTypeParameter, TypeRef, TypeScriptBundle};

use super::emit_indented_array;
use super::emit_leaves::{emit_fn_param, emit_member};
use super::emit_type_ref;

pub(crate) fn emit_type_parameters(
    bundle: &TypeScriptBundle,
    params: &[TsTypeParameter],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(params, |param| {
        emit_type_parameter(bundle, param, export_names)
    })
}

pub(crate) fn emit_members(
    bundle: &TypeScriptBundle,
    members: &[TsMember],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(members, |member| emit_member(bundle, member, export_names))
}

fn emit_type_parameter(
    bundle: &TypeScriptBundle,
    param: &TsTypeParameter,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    use crate::tasty::generator::util::{emit_field, emit_object, to_js_literal};

    let mut fields = vec![emit_field("name", to_js_literal(&param.name)?)];

    if let Some(constraint) = param.constraint.as_ref() {
        fields.push(emit_field(
            "constraint",
            emit_type_ref(bundle, constraint, export_names)?,
        ));
    }

    if let Some(default) = param.default.as_ref() {
        fields.push(emit_field(
            "default",
            emit_type_ref(bundle, default, export_names)?,
        ));
    }

    Ok(emit_object(fields))
}

pub(super) fn emit_type_ref_array(
    bundle: &TypeScriptBundle,
    types: &[TypeRef],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(types, |type_ref| {
        emit_type_ref(bundle, type_ref, export_names)
    })
}

pub(super) fn emit_fn_params(
    bundle: &TypeScriptBundle,
    params: &[FnParam],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(params, |param| emit_fn_param(bundle, param, export_names))
}
