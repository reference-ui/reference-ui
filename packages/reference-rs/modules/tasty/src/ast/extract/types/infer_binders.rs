//! Names an `infer` clause binds, read from the lowered extends type of a conditional. Lowering keeps each
//! `infer U` as a raw node whose text starts with `infer `, so this walk collects those nodes wherever they sit
//! in the extends type, and it stops at nested conditional types: their `infer` names bind inside them, not in
//! the enclosing true branch. The walk returns names in source order, one per `infer` node.

use std::iter::once;

use crate::model::{FnParam, TemplateLiteralPart, TypeRef};

const INFER_KEYWORD: &str = "infer ";

/// The `infer` names reachable from a lowered extends type, outside nested conditionals.
pub(super) fn infer_names(type_ref: &TypeRef) -> Vec<String> {
    let mut names = Vec::new();
    collect(type_ref, &mut names);
    names
}

fn collect(type_ref: &TypeRef, names: &mut Vec<String>) {
    match type_ref {
        TypeRef::Raw { summary } => names.extend(infer_name(summary)),
        TypeRef::Conditional { .. } => {}
        _ => {
            for child in child_types(type_ref) {
                collect(child, names);
            }
        }
    }
}

/// `infer U` or `infer U extends C`: the name is the word after the keyword.
fn infer_name(summary: &str) -> Option<String> {
    let rest = summary.strip_prefix(INFER_KEYWORD)?;
    rest.split_whitespace().next().map(str::to_string)
}

/// Child types of the variants that hold their children directly.
fn child_types(type_ref: &TypeRef) -> Vec<&TypeRef> {
    match type_ref {
        TypeRef::Reference {
            type_arguments: Some(arguments),
            ..
        } => arguments.iter().collect(),
        TypeRef::Union { types } | TypeRef::Intersection { types } => types.iter().collect(),
        TypeRef::Array { element } => vec![element.as_ref()],
        TypeRef::Tuple { elements } => elements.iter().map(|element| &element.element).collect(),
        TypeRef::Object { members } => members
            .iter()
            .filter_map(|member| member.type_ref.as_ref())
            .collect(),
        TypeRef::Function {
            params,
            return_type,
        }
        | TypeRef::Constructor {
            params,
            return_type,
            ..
        } => signature_types(params, return_type),
        _ => wrapper_child_types(type_ref),
    }
}

/// Child types of the variants that keep their children in optional or boxed slots.
fn wrapper_child_types(type_ref: &TypeRef) -> Vec<&TypeRef> {
    let mut children = Vec::new();
    match type_ref {
        TypeRef::IndexedAccess {
            object,
            index,
            resolved,
        } => {
            children.extend([object.as_ref(), index.as_ref()]);
            children.extend(resolved.as_deref());
        }
        TypeRef::TypeOperator {
            target, resolved, ..
        } => {
            children.push(target.as_ref());
            children.extend(resolved.as_deref());
        }
        TypeRef::Mapped {
            source_type,
            name_type,
            value_type,
            ..
        } => {
            children.push(source_type.as_ref());
            children.extend(name_type.as_deref());
            children.extend(value_type.as_deref());
        }
        TypeRef::TemplateLiteral { parts, resolved } => {
            children.extend(parts.iter().filter_map(template_part_type));
            children.extend(resolved.as_deref());
        }
        TypeRef::TypeQuery { resolved, .. } => children.extend(resolved.as_deref()),
        _ => {}
    }
    children
}

fn template_part_type(part: &TemplateLiteralPart) -> Option<&TypeRef> {
    match part {
        TemplateLiteralPart::Type { value } => Some(value),
        TemplateLiteralPart::Text { .. } => None,
    }
}

/// Parameter types, then the return type, of a function or constructor type.
fn signature_types<'t>(params: &'t [FnParam], return_type: &'t TypeRef) -> Vec<&'t TypeRef> {
    params
        .iter()
        .filter_map(|param| param.type_ref.as_ref())
        .chain(once(return_type))
        .collect()
}
