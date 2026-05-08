use std::collections::HashMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, ArrayExpression, ArrayExpressionElement, CallExpression, Expression, ObjectExpression,
    ObjectProperty, ObjectPropertyKind, PropertyKey, PropertyKind,
};
use oxc_ast_visit::{walk, Visit};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

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
struct TextReplacement {
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
        let Some(property) = property.as_object_property() else {
            continue;
        };
        if !is_plain_object_property(property) {
            continue;
        }

        let Some(name) = property_key_name(&property.key, source_code) else {
            continue;
        };

        let rewritten = match name.as_str() {
            "base" => object_expression(property.value.get_inner_expression())
                .and_then(|styles| rewrite_style_object(styles, source_code, breakpoints)),
            "variants" => object_expression(property.value.get_inner_expression())
                .and_then(|variants| rewrite_variants_object(variants, source_code, breakpoints)),
            "compoundVariants" => array_expression(property.value.get_inner_expression())
                .and_then(|variants| rewrite_compound_variants_array(variants, source_code, breakpoints)),
            _ => None,
        };

        if let Some(rewritten) = rewritten {
            let value_span = property.value.get_inner_expression().span();
            replacements.push(relative_replacement(object.span, value_span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
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
        let Some(property) = property.as_object_property() else {
            continue;
        };
        if !is_plain_object_property(property) {
            continue;
        }

        let Some(name) = property_key_name(&property.key, source_code) else {
            continue;
        };

        if name == "r" {
            if let Some(rewritten) = rewrite_responsive_property(property, source_code, breakpoints) {
                replacements.push(relative_replacement(object.span, property.span, rewritten));
            }
            continue;
        }

        let Some(nested) = object_expression(property.value.get_inner_expression()) else {
            continue;
        };

        if let Some(rewritten) = rewrite_style_object(nested, source_code, breakpoints) {
            replacements.push(relative_replacement(object.span, nested.span, rewritten));
        }
    }

    if replacements.is_empty() {
        None
    } else {
        Some(apply_fragment_replacements(object_source, &replacements))
    }
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

fn object_expression<'a>(expression: &'a Expression<'a>) -> Option<&'a ObjectExpression<'a>> {
    let Expression::ObjectExpression(object) = expression else {
        return None;
    };

    Some(&**object)
}

fn array_expression<'a>(expression: &'a Expression<'a>) -> Option<&'a ArrayExpression<'a>> {
    let Expression::ArrayExpression(array) = expression else {
        return None;
    };

    Some(&**array)
}

fn array_element_object_expression<'a>(
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

fn is_plain_object_property(property: &ObjectProperty<'_>) -> bool {
    property.kind == PropertyKind::Init && !property.computed && !property.method
}

fn property_contains_newline(property: &ObjectProperty<'_>, source_code: &str) -> bool {
    slice_span(source_code, property.span).contains('\n')
}

fn normalize_breakpoint_width<'a>(
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

    breakpoints.get(trimmed).map(|width| width.clone())
}

fn relative_replacement(container_span: Span, target_span: Span, replacement: String) -> TextReplacement {
    TextReplacement {
        start: (target_span.start - container_span.start) as usize,
        end: (target_span.end - container_span.start) as usize,
        replacement,
    }
}

fn apply_fragment_replacements(source: &str, replacements: &[TextReplacement]) -> String {
    apply_local_replacements(source, replacements)
}

fn apply_local_replacements(source: &str, replacements: &[TextReplacement]) -> String {
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

fn slice_span(source_code: &str, span: Span) -> &str {
    &source_code[span.start as usize..span.end as usize]
}

fn property_key_name(property_key: &PropertyKey<'_>, source_code: &str) -> Option<String> {
    match property_key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(_) => Some(unquote(slice_span(source_code, property_key.span()))),
        PropertyKey::NumericLiteral(_) => Some(slice_span(source_code, property_key.span()).to_string()),
        _ => None,
    }
}

fn unquote(value: &str) -> String {
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

fn line_indent(source_code: &str, start: usize) -> &str {
    let line_start = source_code[..start].rfind('\n').map_or(0, |index| index + 1);
    let prefix = &source_code[line_start..start];

    if prefix.chars().all(|character| character == ' ' || character == '\t') {
        prefix
    } else {
        ""
    }
}

trait ObjectPropertyExt<'a> {
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