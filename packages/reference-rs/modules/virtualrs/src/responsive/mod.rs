//! Test file.
//! This file provides coverage for the respective domain.
//! It inputs test cases and emits test results.

use std::collections::HashMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, ArrayExpression, ArrayExpressionElement, CallExpression, Expression, ObjectExpression,
    ObjectProperty, ObjectPropertyKind, PropertyKey, PropertyKind,
};
use oxc_ast_visit::{walk, Visit};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};
mod ast;
use ast::*;

/// Lower `r: { ... }` sugar inside `css()` and `cva()` calls to raw
/// `@container (min-width: Npx)` keys. The optional `breakpoints` table
/// resolves named keys (e.g. `md`) to a width string. Numeric keys are
/// always accepted; unknown named keys are left untouched (the upstream
/// caller is responsible for surfacing a build-time error).
pub fn apply_responsive_styles(
    source_code: &str,
    relative_path: &str,
    breakpoints: &HashMap<String, String>,
) -> String {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(relative_path).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source_code, source_type).parse();

    let mut collector = ResponsiveCollector {
        source_code,
        breakpoints,
        replacements: Vec::new(),
    };

    collector.visit_program(&parse_result.program);

    apply_local_replacements(source_code, &collector.replacements)
}

struct ResponsiveCollector<'a> {
    source_code: &'a str,
    breakpoints: &'a HashMap<String, String>,
    replacements: Vec<TextReplacement>,
}

#[derive(Clone)]
pub struct TextReplacement {
    start: usize,
    end: usize,
    replacement: String,
}

impl<'a> Visit<'a> for ResponsiveCollector<'a> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        let Some(callee_name) = call_callee_name(call) else {
            walk::walk_call_expression(self, call);
            return;
        };

        let Some(config) = find_object_argument(call) else {
            walk::walk_call_expression(self, call);
            return;
        };

        let rewritten = match callee_name {
            "css" => rewrite_style_object(config, self.source_code, self.breakpoints),
            "cva" => rewrite_cva_config_object(config, self.source_code, self.breakpoints),
            _ => None,
        };

        if let Some(replacement) = rewritten {
            self.replacements.push(TextReplacement {
                start: config.span.start as usize,
                end: config.span.end as usize,
                replacement,
            });
            return;
        }

        walk::walk_call_expression(self, call);
    }
}

fn call_callee_name<'a>(call: &CallExpression<'a>) -> Option<&'a str> {
    let Expression::Identifier(identifier) = call.callee.get_inner_expression() else {
        return None;
    };

    Some(identifier.name.as_str())
}

fn find_object_argument<'a>(call: &'a CallExpression<'a>) -> Option<&'a ObjectExpression<'a>> {
    call.arguments.iter().find_map(|argument| match argument {
        Argument::SpreadElement(_) => None,
        value => match value.to_expression().get_inner_expression() {
            Expression::ObjectExpression(object) => Some(&**object),
            _ => None,
        },
    })
}

fn rewrite_cva_config_object(
    object: &ObjectExpression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let object_source = slice_span(source_code, object.span);
    let mut replacements = Vec::new();

    for property in object.properties.iter() {
        if let Some((span, rewritten)) = rewrite_cva_config_property(property, source_code, breakpoints) {
            replacements.push(relative_replacement(object.span, span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
    }
}

fn rewrite_cva_config_property(
    property: &ObjectPropertyKind<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<(oxc_span::Span, String)> {
    let property = property.as_object_property()?;
    if !is_plain_object_property(property) {
        return None;
    }

    let name = property_key_name(&property.key, source_code)?;
    let rewritten = rewrite_cva_node(&name, property.value.get_inner_expression(), source_code, breakpoints);
    
    rewritten.map(|r| (property.value.get_inner_expression().span(), r))
}

fn rewrite_cva_node(
    name: &str,
    expression: &Expression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    match name {
        "base" => object_expression(expression)
            .and_then(|styles| rewrite_style_object(styles, source_code, breakpoints)),
        "variants" => object_expression(expression)
            .and_then(|variants| rewrite_variants_object(variants, source_code, breakpoints)),
        "compoundVariants" => array_expression(expression)
            .and_then(|variants| rewrite_compound_variants_array(variants, source_code, breakpoints)),
        _ => None,
    }
}


fn rewrite_variants_object(
    object: &ObjectExpression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let object_source = slice_span(source_code, object.span);
    let mut replacements = Vec::new();

    for property in object.properties.iter() {
        let Some(property) = property.as_object_property() else {
            continue;
        };
        if !is_plain_object_property(property) {
            continue;
        }

        let Some(options) = object_expression(property.value.get_inner_expression()) else {
            continue;
        };

        if let Some(rewritten) = rewrite_variant_options_object(options, source_code, breakpoints) {
            replacements.push(relative_replacement(object.span, options.span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
    }
}

fn rewrite_variant_options_object(
    object: &ObjectExpression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let object_source = slice_span(source_code, object.span);
    let mut replacements = Vec::new();

    for property in object.properties.iter() {
        let Some(property) = property.as_object_property() else {
            continue;
        };
        if !is_plain_object_property(property) {
            continue;
        }

        let Some(styles) = object_expression(property.value.get_inner_expression()) else {
            continue;
        };

        if let Some(rewritten) = rewrite_style_object(styles, source_code, breakpoints) {
            replacements.push(relative_replacement(object.span, styles.span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
    }
}

fn rewrite_compound_variants_array(
    array: &ArrayExpression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let array_source = slice_span(source_code, array.span);
    let mut replacements = Vec::new();

    for element in array.elements.iter() {
        let Some(object) = array_element_object_expression(element) else {
            continue;
        };

        if let Some(rewritten) = rewrite_compound_variant_object(object, source_code, breakpoints) {
            replacements.push(relative_replacement(array.span, object.span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(array_source, &replacements))
    }
}

fn rewrite_compound_variant_object(
    object: &ObjectExpression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let object_source = slice_span(source_code, object.span);
    let mut replacements = Vec::new();

    for property in object.properties.iter() {
        let Some(property) = property.as_object_property() else {
            continue;
        };
        if !is_plain_object_property(property) {
            continue;
        }

        let Some(name) = property_key_name(&property.key, source_code) else {
            continue;
        };
        if name != "css" {
            continue;
        }

        let Some(styles) = object_expression(property.value.get_inner_expression()) else {
            continue;
        };

        if let Some(rewritten) = rewrite_style_object(styles, source_code, breakpoints) {
            replacements.push(relative_replacement(object.span, styles.span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
    }
}

fn rewrite_style_object(
    object: &ObjectExpression<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let object_source = slice_span(source_code, object.span);
    let mut replacements = Vec::new();

    for property in object.properties.iter() {
        if let Some((span, rewritten)) = rewrite_style_property(property, source_code, breakpoints) {
            replacements.push(relative_replacement(object.span, span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
    }
}

fn rewrite_style_property(
    property: &ObjectPropertyKind<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<(oxc_span::Span, String)> {
    let property = property.as_object_property()?;
    if !is_plain_object_property(property) {
        return None;
    }

    let name = property_key_name(&property.key, source_code)?;

    if name == "r" {
        return rewrite_responsive_property(property, source_code, breakpoints)
            .map(|r| (property.span, r));
    }

    let nested = object_expression(property.value.get_inner_expression())?;
    
    rewrite_style_object(nested, source_code, breakpoints)
        .map(|r| (nested.span, r))
}

fn rewrite_responsive_property(
    property: &ObjectProperty<'_>,
    source_code: &str,
    breakpoints: &HashMap<String, String>,
) -> Option<String> {
    let Expression::ObjectExpression(entries) = property.value.get_inner_expression() else {
        return None;
    };

    let property_indent = line_indent(source_code, property.span.start as usize);
    let breakpoint_separator = if property_contains_newline(property, source_code)
        || entries.properties.len() > 1
    {
        format!(",\n{}", property_indent)
    } else {
        ", ".to_string()
    };

    let mut lowered = Vec::new();

    for breakpoint in entries.properties.iter() {
        let Some(property) = breakpoint.as_object_property() else {
            return None;
        };
        if !is_plain_object_property(property) {
            return None;
        }

        let Some(width_key) = property_key_name(&property.key, source_code) else {
            return None;
        };
        let Some(width) = normalize_breakpoint_width(&width_key, breakpoints) else {
            return None;
        };

        let Some(styles) = object_expression(property.value.get_inner_expression()) else {
            return None;
        };

        let rewritten_styles = rewrite_style_object(styles, source_code, breakpoints)
            .unwrap_or_else(|| slice_span(source_code, styles.span).to_string());

        lowered.push(format!(
            "'@container (min-width: {}px)': {}",
            width, rewritten_styles
        ));
    }

    if lowered.is_empty() {
        None
    } else {
        Some(lowered.join(&breakpoint_separator))
    }
}

