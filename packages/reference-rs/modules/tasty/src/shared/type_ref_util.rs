//! Shared helpers for `TypeRef` lowering, resolution, and evaluation. Extraction uses the name and
//! property-key helpers; the evaluator uses the union, keyof and indexed-access helpers, which fail
//! closed (return `None`) rather than answer from a partial member set. Union size is capped in the
//! evaluator path only, so extraction's own unions keep their uncapped behavior.

use oxc_ast::ast::PropertyKey;
use oxc_span::GetSpan;

use crate::model::{TsMember, TsMemberKind, TupleElement, TypeRef};

use super::literal_value::{index_position, property_key_text};

/// Largest union the evaluator builds. Template literal and keyof expansions past this fail closed,
/// which bounds memory before TypeScript's own limit (100,000) would matter.
pub(crate) const MAX_EVALUATED_UNION_MEMBERS: usize = 1000;

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

/// `collapse_union` for evaluator results: a union past the member cap is not built at all.
pub(crate) fn collapse_union_capped(types: Vec<TypeRef>) -> Option<TypeRef> {
    if types.len() > MAX_EVALUATED_UNION_MEMBERS {
        return None;
    }
    collapse_union(types)
}

/// A union small enough to distribute over. A larger one fails closed rather than instantiating the
/// alias body once per member.
pub(crate) fn union_members(types: Vec<TypeRef>) -> Option<Vec<TypeRef>> {
    (types.len() <= MAX_EVALUATED_UNION_MEMBERS).then_some(types)
}

/// `boolean` is `true | false`, the two members a distributive conditional runs over.
pub(crate) fn boolean_members() -> Vec<TypeRef> {
    ["true", "false"]
        .into_iter()
        .map(|value| TypeRef::Literal {
            value: value.to_string(),
        })
        .collect()
}

/// Appends each fragment to each prefix, failing closed past the union member cap.
pub(crate) fn cross_product(prefixes: &[String], fragments: &[String]) -> Option<Vec<String>> {
    if prefixes.len().checked_mul(fragments.len())? > MAX_EVALUATED_UNION_MEMBERS {
        return None;
    }

    Some(
        prefixes
            .iter()
            .flat_map(|prefix| {
                fragments
                    .iter()
                    .map(move |fragment| format!("{prefix}{fragment}"))
            })
            .collect(),
    )
}

/// Adds a union's members to a flat list, or a single type as itself.
pub(crate) fn push_members(results: &mut Vec<TypeRef>, value: TypeRef) {
    match value {
        TypeRef::Union { types } => results.extend(types),
        other => results.push(other),
    }
}

pub(crate) fn resolved_or_self(type_ref: &TypeRef) -> &TypeRef {
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

pub(crate) fn unquote_string_literal(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.len() < 2 {
        return None;
    }

    let starts_with_quote =
        trimmed.starts_with('"') || trimmed.starts_with('\'') || trimmed.starts_with('`');
    let ends_with_quote =
        trimmed.ends_with('"') || trimmed.ends_with('\'') || trimmed.ends_with('`');
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

/// Property names `keyof` lists for an object type. An index signature has no recoverable key type
/// here (string or number), and a numeric-looking name is a number literal in TypeScript, so both
/// fail closed. Call and construct signatures never become keys.
pub(crate) fn object_key_names(members: &[TsMember]) -> Option<Vec<String>> {
    if members
        .iter()
        .any(|member| member.kind == TsMemberKind::IndexSignature)
    {
        return None;
    }
    let names: Vec<String> = members
        .iter()
        .filter(|member| is_key_kind(member.kind))
        .map(|member| member.name.clone())
        .collect();
    let numeric = names.iter().any(|name| name.parse::<f64>().is_ok());
    (!names.is_empty() && !numeric).then_some(names)
}

fn is_key_kind(kind: TsMemberKind) -> bool {
    matches!(kind, TsMemberKind::Property | TsMemberKind::Method)
}

pub(crate) fn resolve_indexed_access(object: &TypeRef, index: &TypeRef) -> Option<TypeRef> {
    if let TypeRef::Union { types } = object {
        return collapse_all(types.iter().map(|item| resolve_indexed_access(item, index)));
    }
    match object {
        TypeRef::Object { members } => resolve_object_index(members, index),
        TypeRef::Tuple { elements } => resolve_tuple_index(elements, index),
        TypeRef::Array { element } => is_number_index(index).then(|| element.as_ref().clone()),
        _ => None,
    }
}

/// Collapses per-member answers only when every member answered. A partial union would silently
/// drop the members that failed, which is a wrong answer rather than an unknown one.
fn collapse_all(results: impl Iterator<Item = Option<TypeRef>>) -> Option<TypeRef> {
    let members = results.collect::<Option<Vec<_>>>()?;
    collapse_union_capped(members)
}

/// The single declared property or method named `key`. Overloads, optional members, and index or
/// call signatures fail closed: an optional member would add `undefined` under strictNullChecks.
fn resolve_object_index(members: &[TsMember], index: &TypeRef) -> Option<TypeRef> {
    match index {
        TypeRef::Literal { value } => {
            let key = property_key_text(value)?;
            named_member_type(members, &key)
        }
        TypeRef::Union { types } => {
            collapse_all(types.iter().map(|item| resolve_object_index(members, item)))
        }
        _ => None,
    }
}

fn named_member_type(members: &[TsMember], key: &str) -> Option<TypeRef> {
    let mut named = members
        .iter()
        .filter(|member| is_key_kind(member.kind) && member.name == key);
    let member = named.next()?;
    if named.next().is_some() || member.optional {
        return None;
    }
    member.type_ref.clone()
}

fn resolve_tuple_index(elements: &[TupleElement], index: &TypeRef) -> Option<TypeRef> {
    if is_number_index(index) {
        return tuple_number_index(elements);
    }
    match index {
        TypeRef::Literal { value } => tuple_element_at(elements, index_position(value)?),
        TypeRef::Union { types } => {
            collapse_all(types.iter().map(|item| resolve_tuple_index(elements, item)))
        }
        _ => None,
    }
}

/// `tuple[position]`. A position at or past a trailing rest element has the rest's item type, not
/// the array type it is stored as. An optional element fails closed, because its type would gain
/// `undefined` under strictNullChecks.
fn tuple_element_at(elements: &[TupleElement], position: usize) -> Option<TypeRef> {
    if let Some(rest) = elements.iter().position(|element| element.rest) {
        if position >= rest {
            return (rest + 1 == elements.len())
                .then(|| rest_item_type(&elements[rest]))
                .flatten();
        }
    }
    let element = elements.get(position)?;
    (!element.optional && !element.rest).then(|| element.element.clone())
}

/// `tuple[number]`: the union of every element's item type, with rest elements unwrapped.
fn tuple_number_index(elements: &[TupleElement]) -> Option<TypeRef> {
    let items = elements
        .iter()
        .map(|element| {
            if element.optional {
                None
            } else if element.rest {
                rest_item_type(element)
            } else {
                Some(element.element.clone())
            }
        })
        .collect::<Option<Vec<_>>>()?;
    collapse_union_capped(items)
}

/// The item type of a rest element: `...T[]` stores the array, and its item type is `T`.
fn rest_item_type(element: &TupleElement) -> Option<TypeRef> {
    match &element.element {
        TypeRef::Array { element: item } => Some(item.as_ref().clone()),
        _ => None,
    }
}

fn is_number_index(index: &TypeRef) -> bool {
    matches!(index, TypeRef::Intrinsic { name } if name == "number")
}
