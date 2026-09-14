//! AST utilities for responsive style lowering.
//! Provides helpers for extracting and asserting oxc AST nodes.
//! Contains functions to safely cast properties, arrays, and literals.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind, PropertyKey, PropertyKind};
use oxc_span::{GetSpan, Span};
use std::collections::HashMap;
use super::TextReplacement;

pub fn object_expression<'a>(expression: &'a Expression<'a>) -> Option<&'a ObjectExpression<'a>> {
    let Expression::ObjectExpression(object) = expression else {
        return None;
    };

    Some(&**object)
}

pub fn array_expression<'a>(expression: &'a Expression<'a>) -> Option<&'a ArrayExpression<'a>> {
    let Expression::ArrayExpression(array) = expression else {
        return None;
    };

    Some(&**array)
}

pub fn array_element_object_expression<'a>(
    element: &'a ArrayExpressionElement<'a>,
) -> Option<&'a ObjectExpression<'a>> {
    match element {
        ArrayExpressionElement::ObjectExpression(object) => Some(&**object),
        ArrayExpressionElement::TSAsExpression(asserted) => object_expression(asserted.expression.get_inner_expression()),
        ArrayExpressionElement::TSSatisfiesExpression(asserted) => {
            object_expression(asserted.expression.get_inner_expression())
        }
        ArrayExpressionElement::ParenthesizedExpression(parenthesized) => {
            object_expression(parenthesized.expression.get_inner_expression())
        }
        _ => None,
    }
}

pub fn is_plain_object_property(property: &ObjectProperty<'_>) -> bool {
    property.kind == PropertyKind::Init && !property.computed && !property.method
}

pub fn property_contains_newline(property: &ObjectProperty<'_>, source_code: &str) -> bool {
    slice_span(source_code, property.span).contains('\n')
}

pub fn normalize_breakpoint_width<'a>(
    value: &'a str,
    breakpoints: &'a HashMap<String, String>,
) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }

    if trimmed.parse::<f64>().is_ok() {
        return Some(trimmed.to_string());
    }

    breakpoints.get(trimmed).cloned()
}

pub fn relative_replacement(container_span: Span, target_span: Span, replacement: String) -> TextReplacement {
    TextReplacement {
        start: (target_span.start - container_span.start) as usize,
        end: (target_span.end - container_span.start) as usize,
        replacement,
    }
}

pub fn apply_fragment_replacements(source: &str, replacements: &[TextReplacement]) -> String {
    apply_local_replacements(source, replacements)
}

pub fn apply_local_replacements(source: &str, replacements: &[TextReplacement]) -> String {
    if replacements.is_empty() {
        return source.to_string();
    }

    let mut ordered = replacements.to_vec();
    ordered.sort_by_key(|replacement| replacement.start);

    let mut output = String::with_capacity(source.len());
    let mut cursor = 0;

    for replacement in ordered {
        if replacement.start < cursor || replacement.end > source.len() {
            continue;
        }

        output.push_str(&source[cursor..replacement.start]);
        output.push_str(&replacement.replacement);
        cursor = replacement.end;
    }

    output.push_str(&source[cursor..]);
    output
}

pub fn slice_span(source_code: &str, span: Span) -> &str {
    &source_code[span.start as usize..span.end as usize]
}

pub fn property_key_name(property_key: &PropertyKey<'_>, source_code: &str) -> Option<String> {
    match property_key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(_) => Some(unquote(slice_span(source_code, property_key.span()))),
        PropertyKey::NumericLiteral(_) => Some(slice_span(source_code, property_key.span()).to_string()),
        _ => None,
    }
}

pub fn unquote(value: &str) -> String {
    let trimmed = value.trim();
    if trimmed.len() >= 2
        && ((trimmed.starts_with('"') && trimmed.ends_with('"'))
            || (trimmed.starts_with('\'') && trimmed.ends_with('\''))
            || (trimmed.starts_with('`') && trimmed.ends_with('`')))
    {
        trimmed[1..trimmed.len() - 1].to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn line_indent(source_code: &str, start: usize) -> &str {
    let line_start = source_code[..start].rfind('\n').map_or(0, |index| index + 1);
    let prefix = &source_code[line_start..start];

    if prefix.chars().all(|character| character == ' ' || character == '\t') {
        prefix
    } else {
        ""
    }
}

pub trait ObjectPropertyExt<'a> {
    fn as_object_property(&'a self) -> Option<&'a ObjectProperty<'a>>;
}

impl<'a> ObjectPropertyExt<'a> for ObjectPropertyKind<'a> {
    fn as_object_property(&'a self) -> Option<&'a ObjectProperty<'a>> {
        let ObjectPropertyKind::ObjectProperty(property) = self else {
            return None;
        };

        Some(property)
    }
}