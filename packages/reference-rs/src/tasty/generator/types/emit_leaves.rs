use crate::tasty::generator::util::{emit_field, emit_object, to_js_literal};
use crate::tasty::model::{
    FnParam, JsDoc, JsDocTag, TemplateLiteralPart, TsMember, TsMemberKind, TupleElement,
};

use super::{emit_indented_array, emit_optional_type_ref, emit_type_ref};

pub(crate) fn emit_jsdoc(jsdoc: &JsDoc) -> Result<String, String> {
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

pub(super) fn emit_member(
    bundle: &crate::tasty::model::TypeScriptBundle,
    member: &TsMember,
    export_names: &std::collections::BTreeMap<String, String>,
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

pub(super) fn emit_tuple_element(
    bundle: &crate::tasty::model::TypeScriptBundle,
    element: &TupleElement,
    export_names: &std::collections::BTreeMap<String, String>,
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

pub(super) fn emit_fn_param(
    bundle: &crate::tasty::model::TypeScriptBundle,
    param: &FnParam,
    export_names: &std::collections::BTreeMap<String, String>,
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

pub(super) fn emit_template_literal_part(
    bundle: &crate::tasty::model::TypeScriptBundle,
    part: &TemplateLiteralPart,
    export_names: &std::collections::BTreeMap<String, String>,
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
