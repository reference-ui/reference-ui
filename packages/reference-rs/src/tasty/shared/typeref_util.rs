//! Shared helpers for `TypeRef` lowering, resolution, and evaluation.

use oxc_ast::ast::PropertyKey;
use oxc_span::GetSpan;

use crate::tasty::model::{TsMember, TupleElement, TypeRef};

pub(crate) fn reference_lookup_name(reference_name: &str) -> &str {
    reference_name
        .split(['.', '<'])
        .next()
        .unwrap_or(reference_name)
}

pub(crate) fn collapse_union(types: Vec<TypeRef>) -> Option<TypeRef> {
    let mut unique = Vec::new();

    for type_ref in types {
        if !unique.contains(&type_ref) {
            unique.push(type_ref);
        }
    }

    match unique.len() {
        0 => None,
        1 => unique.into_iter().next(),
        _ => Some(TypeRef::Union { types: unique }),
    }
}

pub(crate) fn resolved_or_self<'a>(type_ref: &'a TypeRef) -> &'a TypeRef {
    let mut current = type_ref;

    loop {
        match current {
            TypeRef::TypeQuery {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::TypeOperator {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::IndexedAccess {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::Conditional {
                resolved: Some(resolved),
                ..
            }
            | TypeRef::TemplateLiteral {
                resolved: Some(resolved),
                ..
            } => {
                current = resolved.as_ref();
            }
            _ => return current,
        }
    }
}

pub(crate) fn string_literal_type(value: &str) -> TypeRef {
    TypeRef::Literal {
        value: format!("'{}'", value.replace('\\', "\\\\").replace('\'', "\\'")),
    }
}

pub(crate) fn literal_key(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if is_wrapped_literal(trimmed) {
        return Some(trimmed[1..trimmed.len() - 1].to_string());
    }

    Some(trimmed.to_string())
}

pub(crate) fn parse_numeric_literal(value: &str) -> Option<usize> {
    let trimmed = value.trim();
    let normalized = if is_wrapped_literal(trimmed) {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    };
    normalized.parse::<usize>().ok()
}

pub(crate) fn literal_fragment(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if is_wrapped_literal(trimmed) {
        return Some(trimmed[1..trimmed.len() - 1].to_string());
    }

    Some(trimmed.to_string())
}

pub(crate) fn is_wrapped_literal(value: &str) -> bool {
    value.len() >= 2
        && ((value.starts_with('\'') && value.ends_with('\''))
            || (value.starts_with('"') && value.ends_with('"'))
            || (value.starts_with('`') && value.ends_with('`')))
}

pub(crate) fn unquote_string_literal(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.len() < 2 {
        return None;
    }

    let starts_with_quote =
        trimmed.starts_with('"') || trimmed.starts_with('\'') || trimmed.starts_with('`');
    let ends_with_quote = trimmed.ends_with('"') || trimmed.ends_with('\'') || trimmed.ends_with('`');
    if !starts_with_quote || !ends_with_quote {
        return None;
    }

    Some(trimmed[1..trimmed.len() - 1].to_string())
}

fn slice_span(source: &str, span: oxc_span::Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

/// Property key as used for object members: identifiers, quoted strings, and numeric literals.
pub(crate) fn property_key_name(property_key: &PropertyKey<'_>, source: &str) -> Option<String> {
    match property_key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(_) => Some(unquote_string_literal(slice_span(
            source,
            property_key.span(),
        ))?),
        PropertyKey::NumericLiteral(_) => Some(slice_span(source, property_key.span()).to_string()),
        _ => None,
    }
}

pub(crate) fn resolve_object_member_type(type_ref: &TypeRef, name: &str) -> Option<TypeRef> {
    let TypeRef::Object { members } = resolved_or_self(type_ref) else {
        return None;
    };

    members
        .iter()
        .find(|member| member.name == name)
        .and_then(|member| member.type_ref.clone())
}

pub(crate) fn resolve_indexed_access(object: &TypeRef, index: &TypeRef) -> Option<TypeRef> {
    match object {
        TypeRef::Object { members } => resolve_object_index(members, index),
        TypeRef::Tuple { elements } => resolve_tuple_index(elements, index),
        TypeRef::Array { element } => {
            if is_number_index(index) {
                Some(element.as_ref().clone())
            } else {
                None
            }
        }
        TypeRef::Union { types } => collapse_union(
            types
                .iter()
                .filter_map(|item| resolve_indexed_access(item, index))
                .collect(),
        ),
        _ => None,
    }
}

fn resolve_object_index(members: &[TsMember], index: &TypeRef) -> Option<TypeRef> {
    match index {
        TypeRef::Literal { value } => {
            let key = literal_key(value)?;
            members
                .iter()
                .find(|member| member.name == key)
                .and_then(|member| member.type_ref.clone())
        }
        TypeRef::Union { types } => collapse_union(
            types
                .iter()
                .filter_map(|item| resolve_object_index(members, item))
                .collect(),
        ),
        _ => None,
    }
}

fn resolve_tuple_index(elements: &[TupleElement], index: &TypeRef) -> Option<TypeRef> {
    match index {
        TypeRef::Literal { value } => {
            let index = parse_numeric_literal(value)?;
            elements.get(index).map(|element| element.element.clone())
        }
        TypeRef::Union { types } => collapse_union(
            types
                .iter()
                .filter_map(|item| resolve_tuple_index(elements, item))
                .collect(),
        ),
        _ if is_number_index(index) => collapse_union(
            elements
                .iter()
                .map(|element| element.element.clone())
                .collect(),
        ),
        _ => None,
    }
}

fn is_number_index(index: &TypeRef) -> bool {
    matches!(index, TypeRef::Intrinsic { name } if name == "number")
}

pub(crate) fn type_extends(check_type: &TypeRef, extends_type: &TypeRef) -> Option<bool> {
    match extends_type {
        TypeRef::Union { types } => {
            let results = types
                .iter()
                .map(|item| type_extends(check_type, item))
                .collect::<Option<Vec<_>>>()?;
            Some(results.into_iter().any(|result| result))
        }
        _ => match check_type {
            TypeRef::Union { types } => {
                let results = types
                    .iter()
                    .map(|item| type_extends(item, extends_type))
                    .collect::<Option<Vec<_>>>()?;
                Some(results.into_iter().all(|result| result))
            }
            TypeRef::Literal { value } => match extends_type {
                TypeRef::Literal {
                    value: extends_value,
                } => Some(value == extends_value),
                TypeRef::Intrinsic { name } => literal_matches_intrinsic(value, name),
                _ => Some(check_type == extends_type),
            },
            TypeRef::Intrinsic { name } => match extends_type {
                TypeRef::Intrinsic {
                    name: extends_name,
                } => Some(name == extends_name),
                _ => Some(check_type == extends_type),
            },
            _ => Some(check_type == extends_type),
        },
    }
}

fn literal_matches_intrinsic(value: &str, intrinsic_name: &str) -> Option<bool> {
    let trimmed = value.trim();
    match intrinsic_name {
        "string" => Some(is_wrapped_literal(trimmed)),
        "number" => Some(parse_numeric_literal(trimmed).is_some()),
        "boolean" => Some(trimmed == "true" || trimmed == "false"),
        _ => None,
    }
}
