use std::collections::BTreeMap;

use super::symbols::{emit_ref_object, reference_descriptor};
use super::util::{indent_block, to_js_literal};
use super::super::model::{
    FnParam, JsDoc, JsDocTag, TemplateLiteralPart, TsMember, TsMemberKind, TsTypeParameter,
    TupleElement, TypeRef, TypeScriptBundle,
};

pub(super) fn emit_type_parameters(
    bundle: &TypeScriptBundle,
    params: &[TsTypeParameter],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    if params.is_empty() {
        return Ok("[]".to_string());
    }
    let lines = params
        .iter()
        .map(|p| {
            let mut parts = vec![format!("  name: {}", to_js_literal(&p.name)?)];
            if let Some(ref c) = p.constraint {
                let constraint_str = emit_type_ref(bundle, c, export_names)?;
                parts.push(format!("  constraint: {}", indent_block(&constraint_str, 2)));
            }
            if let Some(ref d) = p.default {
                let default_str = emit_type_ref(bundle, d, export_names)?;
                parts.push(format!("  default: {}", indent_block(&default_str, 2)));
            }
            Ok::<String, String>(indent_block(&format!("{{\n{}\n}}", parts.join(",\n")), 2))
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

pub(super) fn emit_members(
    bundle: &TypeScriptBundle,
    members: &[TsMember],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    if members.is_empty() {
        return Ok("[]".to_string());
    }

    let lines = members
        .iter()
        .map(|member| emit_member(bundle, member, export_names).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn emit_member(
    bundle: &TypeScriptBundle,
    member: &TsMember,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let kind_str = match member.kind {
        TsMemberKind::Property => "property",
        TsMemberKind::Method => "method",
        TsMemberKind::CallSignature => "call",
        TsMemberKind::IndexSignature => "index",
        TsMemberKind::ConstructSignature => "construct",
    };
    let mut parts = vec![
        format!("  name: {}", to_js_literal(&member.name)?),
        format!("  optional: {}", to_js_literal(&member.optional)?),
        format!("  readonly: {}", to_js_literal(&member.readonly)?),
        format!("  kind: {}", to_js_literal(kind_str)?),
    ];
    if let Some(ref d) = member.description {
        parts.push(format!("  description: {}", to_js_literal(d)?));
    }
    if let Some(ref d) = member.description_raw {
        parts.push(format!("  descriptionRaw: {}", to_js_literal(d)?));
    }
    if let Some(ref jsdoc) = member.jsdoc {
        parts.push(format!("  jsdoc: {}", emit_jsdoc(jsdoc)?));
    }
    parts.push(format!(
        "  type: {}",
        emit_optional_type_ref(bundle, member.type_ref.as_ref(), export_names)?
    ));
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
}

pub(super) fn emit_jsdoc(jsdoc: &JsDoc) -> Result<String, String> {
    let mut parts = Vec::new();
    if let Some(ref summary) = jsdoc.summary {
        parts.push(format!("  summary: {}", to_js_literal(summary)?));
    }
    parts.push(format!("  tags: {}", emit_jsdoc_tags(&jsdoc.tags)?));
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
}

fn emit_jsdoc_tags(tags: &[JsDocTag]) -> Result<String, String> {
    if tags.is_empty() {
        return Ok("[]".to_string());
    }
    let lines = tags
        .iter()
        .map(|tag| {
            let mut parts = vec![format!("  name: {}", to_js_literal(&tag.name)?)];
            if let Some(ref value) = tag.value {
                parts.push(format!("  value: {}", to_js_literal(value)?));
            }
            Ok::<String, String>(indent_block(&format!("{{\n{}\n}}", parts.join(",\n")), 2))
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn emit_tuple_element(
    bundle: &TypeScriptBundle,
    te: &TupleElement,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut parts = vec![
        format!("  optional: {}", to_js_literal(&te.optional)?),
        format!("  rest: {}", to_js_literal(&te.rest)?),
        format!(
            "  element: {}",
            indent_block(&emit_type_ref(bundle, &te.element, export_names)?, 2)
        ),
    ];
    if let Some(ref label) = te.label {
        parts.insert(0, format!("  label: {}", to_js_literal(label)?));
    }
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
}

fn emit_fn_param(
    bundle: &TypeScriptBundle,
    p: &FnParam,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let name_str = match &p.name {
        Some(n) => to_js_literal(n)?,
        None => "null".to_string(),
    };
    let type_ref_str = emit_optional_type_ref(bundle, p.type_ref.as_ref(), export_names)?;
    Ok(format!(
        "{{\n  name: {},\n  optional: {},\n  typeRef: {},\n}}",
        name_str,
        to_js_literal(&p.optional)?,
        indent_block(&type_ref_str, 2)
    ))
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
        TemplateLiteralPart::Text { value } => Ok(format!(
            "{{\n  kind: \"text\",\n  value: {},\n}}",
            to_js_literal(value)?,
        )),
        TemplateLiteralPart::Type { value } => Ok(format!(
            "{{\n  kind: \"type\",\n  value: {},\n}}",
            indent_block(&emit_type_ref(bundle, value, export_names)?, 2)
        )),
    }
}

pub(super) fn emit_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Intrinsic { name } => Ok(format!(
            "{{\n  kind: \"intrinsic\",\n  name: {},\n}}",
            to_js_literal(name)?,
        )),
        TypeRef::Literal { value } => Ok(format!(
            "{{\n  kind: \"literal\",\n  value: {},\n}}",
            to_js_literal(value)?,
        )),
        TypeRef::Reference {
            type_arguments: Some(args),
            ..
        } => {
            let reference = reference_descriptor(bundle, type_ref, export_names)
                .ok_or_else(|| "Failed to emit reference.".to_string())?;
            let args_lines: Vec<_> = args
                .iter()
                .map(|t| emit_type_ref(bundle, t, export_names).map(|s| indent_block(&s, 2)))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  id: {},\n  name: {},\n  library: {},\n  typeArguments: [\n{}\n  ],\n}}",
                to_js_literal(&reference.id)?,
                to_js_literal(&reference.name)?,
                to_js_literal(&reference.library)?,
                args_lines.join(",\n")
            ))
        }
        TypeRef::Reference { .. } => {
            let reference = reference_descriptor(bundle, type_ref, export_names)
                .ok_or_else(|| "Failed to emit reference.".to_string())?;
            emit_ref_object(&reference)
        }
        TypeRef::Object { members } => {
            let lines = members
                .iter()
                .map(|m| emit_member(bundle, m, export_names).map(|s| indent_block(&s, 2)))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"object\",\n  members: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Union { types } => {
            let lines = types
                .iter()
                .map(|nested| emit_type_ref(bundle, nested, export_names).map(|value| indent_block(&value, 2)))
                .collect::<Result<Vec<_>, _>>()?;

            Ok(format!(
                "{{\n  kind: \"union\",\n  types: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Array { element } => {
            let inner = emit_type_ref(bundle, element, export_names)?;
            Ok(format!(
                "{{\n  kind: \"array\",\n  element: {},\n}}",
                indent_block(&inner, 2)
            ))
        }
        TypeRef::Tuple { elements } => {
            let lines = elements
                .iter()
                .map(|te| emit_tuple_element(bundle, te, export_names))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"tuple\",\n  elements: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Intersection { types } => {
            let lines = types
                .iter()
                .map(|t| emit_type_ref(bundle, t, export_names).map(|s| indent_block(&s, 2)))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"intersection\",\n  types: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::IndexedAccess { object, index } => {
            let object_str = emit_type_ref(bundle, object, export_names)?;
            let index_str = emit_type_ref(bundle, index, export_names)?;
            Ok(format!(
                "{{\n  kind: \"indexed_access\",\n  object: {},\n  index: {},\n}}",
                indent_block(&object_str, 2),
                indent_block(&index_str, 2)
            ))
        }
        TypeRef::Function { params, return_type } => {
            let param_lines: Vec<_> = params
                .iter()
                .map(|p| emit_fn_param(bundle, p, export_names))
                .collect::<Result<Vec<_>, _>>()?;
            let return_str = emit_type_ref(bundle, return_type, export_names)?;
            Ok(format!(
                "{{\n  kind: \"function\",\n  params: [\n{}\n  ],\n  returnType: {},\n}}",
                param_lines
                    .iter()
                    .map(|s| indent_block(s, 2))
                    .collect::<Vec<_>>()
                    .join(",\n"),
                indent_block(&return_str, 2)
            ))
        }
        TypeRef::Constructor {
            r#abstract,
            type_parameters,
            params,
            return_type,
        } => {
            let param_lines: Vec<_> = params
                .iter()
                .map(|p| emit_fn_param(bundle, p, export_names))
                .collect::<Result<Vec<_>, _>>()?;
            let return_str = emit_type_ref(bundle, return_type, export_names)?;
            let mut parts = vec![
                "  kind: \"constructor\"".to_string(),
                format!("  abstract: {}", to_js_literal(r#abstract)?),
                format!(
                    "  params: [\n{}\n  ]",
                    param_lines
                        .iter()
                        .map(|s| indent_block(s, 2))
                        .collect::<Vec<_>>()
                        .join(",\n")
                ),
                format!("  returnType: {}", indent_block(&return_str, 2)),
            ];
            if !type_parameters.is_empty() {
                parts.insert(
                    2,
                    format!(
                        "  typeParameters: {}",
                        indent_block(&emit_type_parameters(bundle, type_parameters, export_names)?, 2)
                    ),
                );
            }
            Ok(format!("{{\n{}\n}}", parts.join(",\n")))
        }
        TypeRef::TypeOperator { operator, target } => {
            let target_str = emit_type_ref(bundle, target, export_names)?;
            Ok(format!(
                "{{\n  kind: \"type_operator\",\n  operator: {},\n  target: {},\n}}",
                to_js_literal(operator.as_str())?,
                indent_block(&target_str, 2)
            ))
        }
        TypeRef::TypeQuery { expression } => Ok(format!(
            "{{\n  kind: \"type_query\",\n  expression: {},\n}}",
            to_js_literal(expression)?,
        )),
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
        } => Ok(format!(
            "{{\n  kind: \"conditional\",\n  checkType: {},\n  extendsType: {},\n  trueType: {},\n  falseType: {},\n}}",
            indent_block(&emit_type_ref(bundle, check_type, export_names)?, 2),
            indent_block(&emit_type_ref(bundle, extends_type, export_names)?, 2),
            indent_block(&emit_type_ref(bundle, true_type, export_names)?, 2),
            indent_block(&emit_type_ref(bundle, false_type, export_names)?, 2)
        )),
        TypeRef::Mapped {
            type_param,
            source_type,
            name_type,
            optional_modifier,
            readonly_modifier,
            value_type,
        } => {
            let mut parts = vec![
                format!("  kind: {}", to_js_literal("mapped")?),
                format!("  typeParam: {}", to_js_literal(type_param)?),
                format!(
                    "  sourceType: {}",
                    indent_block(&emit_type_ref(bundle, source_type, export_names)?, 2)
                ),
                format!("  optionalModifier: {}", to_js_literal(optional_modifier.as_str())?),
                format!("  readonlyModifier: {}", to_js_literal(readonly_modifier.as_str())?),
            ];
            if let Some(name_type) = name_type {
                parts.push(format!(
                    "  nameType: {}",
                    indent_block(&emit_type_ref(bundle, name_type, export_names)?, 2)
                ));
            }
            let value_type_str = match value_type {
                Some(value_type) => emit_type_ref(bundle, value_type, export_names)?,
                None => "null".to_string(),
            };
            parts.push(format!("  valueType: {}", indent_block(&value_type_str, 2)));
            Ok(format!("{{\n{}\n}}", parts.join(",\n")))
        }
        TypeRef::TemplateLiteral { parts } => {
            let lines = parts
                .iter()
                .map(|part| {
                    emit_template_literal_part(bundle, part, export_names)
                        .map(|value| indent_block(&value, 2))
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"template_literal\",\n  parts: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Raw { summary } => Ok(format!(
            "{{\n  kind: \"raw\",\n  summary: {},\n}}",
            to_js_literal(summary)?,
        )),
    }
}
