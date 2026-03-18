use std::collections::BTreeMap;

use super::super::model::{
    FnParam, JsDoc, JsDocTag, TemplateLiteralPart, TsMember, TsMemberKind, TsTypeParameter,
    TupleElement, TypeRef, TypeScriptBundle,
};
use super::symbols::{emit_ref_object, reference_descriptor};
use super::util::{emit_array, emit_field, emit_object, indent_block, to_js_literal};

pub(super) fn emit_type_parameters(
    bundle: &TypeScriptBundle,
    params: &[TsTypeParameter],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(params, |param| {
        emit_type_parameter(bundle, param, export_names)
    })
}

pub(super) fn emit_members(
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

fn emit_member(
    bundle: &TypeScriptBundle,
    member: &TsMember,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut fields = vec![
        emit_field("name", to_js_literal(&member.name)?),
        emit_field("optional", to_js_literal(&member.optional)?),
        emit_field("readonly", to_js_literal(&member.readonly)?),
        emit_field("kind", to_js_literal(member_kind_name(member.kind))?),
    ];
    push_description_fields(
        &mut fields,
        member.description.as_ref(),
        member.description_raw.as_ref(),
        member.jsdoc.as_ref(),
    )?;
    fields.push(emit_field(
        "type",
        emit_optional_type_ref(bundle, member.type_ref.as_ref(), export_names)?,
    ));

    Ok(emit_object(fields))
}

pub(super) fn emit_jsdoc(jsdoc: &JsDoc) -> Result<String, String> {
    let mut fields = Vec::new();

    if let Some(summary) = jsdoc.summary.as_ref() {
        fields.push(emit_field("summary", to_js_literal(summary)?));
    }

    fields.push(emit_field("tags", emit_jsdoc_tags(&jsdoc.tags)?));

    Ok(emit_object(fields))
}

fn emit_jsdoc_tags(tags: &[JsDocTag]) -> Result<String, String> {
    emit_indented_array(tags, emit_jsdoc_tag)
}

fn emit_jsdoc_tag(tag: &JsDocTag) -> Result<String, String> {
    let mut fields = vec![emit_field("name", to_js_literal(&tag.name)?)];

    if let Some(value) = tag.value.as_ref() {
        fields.push(emit_field("value", to_js_literal(value)?));
    }

    Ok(emit_object(fields))
}

fn emit_tuple_element(
    bundle: &TypeScriptBundle,
    element: &TupleElement,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut fields = vec![
        emit_field("optional", to_js_literal(&element.optional)?),
        emit_field("rest", to_js_literal(&element.rest)?),
        emit_field(
            "element",
            emit_type_ref(bundle, &element.element, export_names)?,
        ),
    ];

    if let Some(label) = element.label.as_ref() {
        fields.insert(0, emit_field("label", to_js_literal(label)?));
    }

    Ok(emit_object(fields))
}

fn emit_fn_param(
    bundle: &TypeScriptBundle,
    param: &FnParam,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    Ok(emit_object(vec![
        emit_field(
            "name",
            match param.name.as_ref() {
                Some(name) => to_js_literal(name)?,
                None => "null".to_string(),
            },
        ),
        emit_field("optional", to_js_literal(&param.optional)?),
        emit_field(
            "typeRef",
            emit_optional_type_ref(bundle, param.type_ref.as_ref(), export_names)?,
        ),
    ]))
}

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

fn emit_template_literal_part(
    bundle: &TypeScriptBundle,
    part: &TemplateLiteralPart,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match part {
        TemplateLiteralPart::Text { value } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("text")?),
            emit_field("value", to_js_literal(value)?),
        ])),
        TemplateLiteralPart::Type { value } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("type")?),
            emit_field("value", emit_type_ref(bundle, value, export_names)?),
        ])),
    }
}

pub(super) fn emit_type_ref(
    bundle: &TypeScriptBundle,
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
        TypeRef::IndexedAccess { object, index } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("indexed_access")?),
            emit_field("object", emit_type_ref(bundle, object, export_names)?),
            emit_field("index", emit_type_ref(bundle, index, export_names)?),
        ])),
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
        TypeRef::TypeOperator { operator, target } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("type_operator")?),
            emit_field("operator", to_js_literal(operator.as_str())?),
            emit_field("target", emit_type_ref(bundle, target, export_names)?),
        ])),
        TypeRef::TypeQuery { expression } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("type_query")?),
            emit_field("expression", to_js_literal(expression)?),
        ])),
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
        } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("conditional")?),
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
        ])),
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
        TypeRef::TemplateLiteral { parts } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("template_literal")?),
            emit_field(
                "parts",
                emit_indented_array(parts, |part| {
                    emit_template_literal_part(bundle, part, export_names)
                })?,
            ),
        ])),
        TypeRef::Raw { summary } => Ok(emit_object(vec![
            emit_field("kind", to_js_literal("raw")?),
            emit_field("summary", to_js_literal(summary)?),
        ])),
    }
}

fn emit_reference_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let reference = reference_descriptor(bundle, type_ref, export_names)
        .ok_or_else(|| "Failed to emit reference.".to_string())?;
    emit_ref_object(&reference)
}

fn emit_reference_with_type_arguments(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    args: &[TypeRef],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let reference = reference_descriptor(bundle, type_ref, export_names)
        .ok_or_else(|| "Failed to emit reference.".to_string())?;

    Ok(emit_object(vec![
        emit_field("id", to_js_literal(&reference.id)?),
        emit_field("name", to_js_literal(&reference.name)?),
        emit_field("library", to_js_literal(&reference.library)?),
        emit_field(
            "typeArguments",
            emit_type_ref_array(bundle, args, export_names)?,
        ),
    ]))
}

fn emit_constructor_type_ref(
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

fn emit_mapped_type_ref(
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

fn push_optional_type_ref_field(
    fields: &mut Vec<String>,
    name: &str,
    bundle: &TypeScriptBundle,
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

fn emit_type_ref_array(
    bundle: &TypeScriptBundle,
    types: &[TypeRef],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(types, |type_ref| {
        emit_type_ref(bundle, type_ref, export_names)
    })
}

fn emit_fn_params(
    bundle: &TypeScriptBundle,
    params: &[FnParam],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    emit_indented_array(params, |param| emit_fn_param(bundle, param, export_names))
}

fn emit_indented_array<T>(
    items: &[T],
    mut emit_item: impl FnMut(&T) -> Result<String, String>,
) -> Result<String, String> {
    let items = items
        .iter()
        .map(|item| emit_item(item).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(emit_array(items))
}

fn push_description_fields(
    fields: &mut Vec<String>,
    description: Option<&String>,
    description_raw: Option<&String>,
    jsdoc: Option<&JsDoc>,
) -> Result<(), String> {
    if let Some(description) = description {
        fields.push(emit_field("description", to_js_literal(description)?));
    }

    if let Some(description_raw) = description_raw {
        fields.push(emit_field(
            "descriptionRaw",
            to_js_literal(description_raw)?,
        ));
    }

    if let Some(jsdoc) = jsdoc {
        fields.push(emit_field("jsdoc", emit_jsdoc(jsdoc)?));
    }

    Ok(())
}

fn member_kind_name(kind: TsMemberKind) -> &'static str {
    match kind {
        TsMemberKind::Property => "property",
        TsMemberKind::Method => "method",
        TsMemberKind::CallSignature => "call",
        TsMemberKind::IndexSignature => "index",
        TsMemberKind::ConstructSignature => "construct",
    }
}
