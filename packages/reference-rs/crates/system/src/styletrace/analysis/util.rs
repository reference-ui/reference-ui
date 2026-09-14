//! Shared string and pattern helpers for styletrace analysis parsing.

use oxc_ast::ast::{JSXElementName, JSXMemberExpressionObject};
use oxc_span::GetSpan;

use super::model::ObjectPatternBinding;

pub(super) fn module_source_literal(source: &str, span: oxc_span::Span) -> String {
    slice_span(source, span)
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}

pub(super) fn module_export_name(
    source: &str,
    name: &oxc_ast::ast::ModuleExportName<'_>,
) -> String {
    slice_span(source, name.span())
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}

pub(super) fn jsx_name_to_string(name: &JSXElementName<'_>) -> String {
    match name {
        JSXElementName::Identifier(identifier) => identifier.name.to_string(),
        JSXElementName::IdentifierReference(identifier) => identifier.name.to_string(),
        JSXElementName::NamespacedName(namespaced) => {
            format!("{}:{}", namespaced.namespace.name, namespaced.name.name)
        }
        JSXElementName::MemberExpression(member) => {
            format!(
                "{}.{}",
                jsx_member_object_to_string(&member.object),
                member.property.name
            )
        }
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

fn jsx_member_object_to_string(object: &JSXMemberExpressionObject<'_>) -> String {
    match object {
        JSXMemberExpressionObject::IdentifierReference(identifier) => identifier.name.to_string(),
        JSXMemberExpressionObject::MemberExpression(member) => format!(
            "{}.{}",
            jsx_member_object_to_string(&member.object),
            member.property.name
        ),
        JSXMemberExpressionObject::ThisExpression(_) => "this".to_string(),
    }
}

pub(super) fn parse_object_pattern_bindings(pattern_source: &str) -> Vec<ObjectPatternBinding> {
    let inner = pattern_source
        .trim()
        .strip_prefix('{')
        .and_then(|value| value.strip_suffix('}'))
        .unwrap_or("");

    split_top_level(inner)
        .into_iter()
        .filter_map(|part| {
            let trimmed = part.trim();
            if trimmed.is_empty() || trimmed.starts_with("...") {
                return None;
            }

            let without_default = trimmed.split('=').next().unwrap_or(trimmed).trim();
            if let Some((prop_name, local_name)) = without_default.split_once(':') {
                return Some(ObjectPatternBinding {
                    prop_name: prop_name.trim().to_string(),
                    local_name: local_name.trim().to_string(),
                });
            }

            Some(ObjectPatternBinding {
                prop_name: without_default.to_string(),
                local_name: without_default.to_string(),
            })
        })
        .collect()
}

pub(super) fn parse_object_pattern_rest(pattern_source: &str) -> Option<String> {
    let inner = pattern_source
        .trim()
        .strip_prefix('{')
        .and_then(|value| value.strip_suffix('}'))
        .unwrap_or("");

    split_top_level(inner).into_iter().find_map(|part| {
        part.trim()
            .strip_prefix("...")
            .map(|value| value.trim().to_string())
    })
}

fn split_top_level(input: &str) -> Vec<String> {
    let mut parts = Vec::new();
    let mut current = String::new();
    let mut depth = 0i32;

    for ch in input.chars() {
        match ch {
            '{' | '[' | '(' => {
                depth += 1;
                current.push(ch);
            }
            '}' | ']' | ')' => {
                depth -= 1;
                current.push(ch);
            }
            ',' if depth == 0 => {
                parts.push(current.trim().to_string());
                current.clear();
            }
            _ => current.push(ch),
        }
    }

    if !current.trim().is_empty() {
        parts.push(current.trim().to_string());
    }

    parts
}

pub(super) fn slice_span<'a>(source: &'a str, span: oxc_span::Span) -> &'a str {
    source
        .get(span.start as usize..span.end as usize)
        .unwrap_or_default()
}

pub(super) fn is_identifier(value: &str) -> bool {
    let mut chars = value.chars();
    match chars.next() {
        Some(ch) if ch == '_' || ch == '$' || ch.is_ascii_alphabetic() => {}
        _ => return false,
    }

    chars.all(|ch| ch == '_' || ch == '$' || ch.is_ascii_alphanumeric())
}

pub(super) fn is_component_name(name: &str) -> bool {
    name.chars()
        .next()
        .map(|ch| ch.is_ascii_uppercase())
        .unwrap_or(false)
}
