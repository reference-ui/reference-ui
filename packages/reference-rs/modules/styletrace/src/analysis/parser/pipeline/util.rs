//! Pipeline utility functions.

use super::{PipelineContext, PipelineState};
use crate::analysis::model::{PropBindings, TraceImport};
use crate::analysis::util::{
    is_identifier, parse_object_pattern_bindings, parse_object_pattern_rest,
};
use oxc_ast::ast::{Argument, Expression};
use std::collections::HashMap;

pub fn record_pipeline_binding(
    pattern_source: &str,
    init: &Expression<'_>,
    ctx: &mut PipelineContext,
) {
    let init_uses_style_signal = expression_reads_style_signal(init, ctx.bindings, ctx.state)
        || matches!(init, Expression::CallExpression(call) if call_has_style_signal_arg(call, ctx.bindings, ctx.state));

    if pattern_source.starts_with('{') && init_uses_style_signal {
        for binding in parse_object_pattern_bindings(pattern_source) {
            ctx.state.style_signals.insert(binding.local_name);
        }
        if let Some(rest_binding) = parse_object_pattern_rest(pattern_source) {
            ctx.state.style_signals.insert(rest_binding);
        }
        return;
    }

    if pattern_source.starts_with('[')
        && matches!(init, Expression::CallExpression(call) if is_split_css_props_call(call, ctx.imports))
        && expression_reads_style_signal(call_first_argument(init), ctx.bindings, ctx.state)
    {
        if let Some(first_binding) = parse_array_pattern_first_binding(pattern_source) {
            ctx.state.style_signals.insert(first_binding);
        }
        return;
    }

    if is_identifier(pattern_source) {
        if pattern_source.to_ascii_lowercase().contains("class")
            && matches!(init, Expression::CallExpression(call) if call_has_style_signal_arg(call, ctx.bindings, ctx.state))
        {
            ctx.state
                .class_name_bindings
                .insert(pattern_source.to_string());
        }

        if expression_directly_derives_from_style_signal(init, ctx.bindings, ctx.state) {
            ctx.state.style_signals.insert(pattern_source.to_string());
        }
    }
}

fn parse_array_pattern_first_binding(pattern_source: &str) -> Option<String> {
    pattern_source
        .trim()
        .strip_prefix('[')
        .and_then(|value| value.strip_suffix(']'))
        .unwrap_or("")
        .split(',')
        .next()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn call_first_argument<'a>(expression: &'a Expression<'a>) -> &'a Expression<'a> {
    match expression {
        Expression::CallExpression(call) => call
            .arguments
            .iter()
            .find_map(|argument| match argument {
                Argument::SpreadElement(spread) => Some(&spread.argument),
                _ => Some(argument.to_expression()),
            })
            .expect("expected call expression to have an argument"),
        _ => expression,
    }
}

pub fn expression_reads_style_signal(
    expression: &Expression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    match expression {
        Expression::Identifier(identifier) => {
            bindings.expression_reads_style_prop(expression)
                || state.style_signals.contains(identifier.name.as_str())
        }
        Expression::StaticMemberExpression(member) => {
            if let Expression::Identifier(identifier) = &member.object {
                return bindings.expression_reads_style_prop(expression)
                    || state.style_signals.contains(identifier.name.as_str());
            }
            expression_reads_style_signal(&member.object, bindings, state)
        }
        Expression::ComputedMemberExpression(member) => {
            expression_reads_style_signal(&member.object, bindings, state)
                || expression_reads_style_signal(&member.expression, bindings, state)
        }
        Expression::ParenthesizedExpression(paren) => {
            expression_reads_style_signal(&paren.expression, bindings, state)
        }
        Expression::TSAsExpression(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::TSTypeAssertion(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::TSNonNullExpression(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::ObjectExpression(object) => {
            object_reads_style_signal(object, bindings, state)
        }
        Expression::ArrayExpression(array) => {
            array_reads_style_signal(array, bindings, state)
        }
        _ => false,
    }
}

// Object keys never count as signals: a key names the property being set,
// not flow from the boundary. No computed-key chasing; functions inside
// values fall into the `_ => false` arm, so rebinding stops the walk.
fn object_reads_style_signal(
    object: &oxc_ast::ast::ObjectExpression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    object.properties.iter().any(|property| match property {
        oxc_ast::ast::ObjectPropertyKind::ObjectProperty(prop) => {
            expression_reads_style_signal(&prop.value, bindings, state)
        }
        oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
            expression_reads_style_signal(&spread.argument, bindings, state)
        }
    })
}

fn array_reads_style_signal(
    array: &oxc_ast::ast::ArrayExpression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    array.elements.iter().any(|element| match element {
        oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
            expression_reads_style_signal(&spread.argument, bindings, state)
        }
        oxc_ast::ast::ArrayExpressionElement::Elision(_) => false,
        _ => expression_reads_style_signal(element.to_expression(), bindings, state),
    })
}

// Object/array literals recurse in `expression_reads_style_signal` (signal
// flow into a sink) but stay out of this predicate: an object literal is a
// container, not a direct alias, so `const obj = { color }` must not mint a
// new style signal. Container indirection (`css(obj)`) stays untraced.
pub fn expression_directly_derives_from_style_signal(
    expression: &Expression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    match expression {
        Expression::Identifier(_)
        | Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::ParenthesizedExpression(_)
        | Expression::TSAsExpression(_)
        | Expression::TSSatisfiesExpression(_)
        | Expression::TSTypeAssertion(_)
        | Expression::TSNonNullExpression(_) => {
            expression_reads_style_signal(expression, bindings, state)
        }
        _ => false,
    }
}

pub fn expression_uses_class_name_binding(
    expression: &Expression<'_>,
    state: &PipelineState,
) -> bool {
    match expression {
        Expression::Identifier(identifier) => {
            state.class_name_bindings.contains(identifier.name.as_str())
        }
        Expression::ParenthesizedExpression(paren) => {
            expression_uses_class_name_binding(&paren.expression, state)
        }
        Expression::TSAsExpression(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        Expression::TSTypeAssertion(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        Expression::TSNonNullExpression(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        _ => false,
    }
}

pub fn call_has_style_signal_arg(
    call: &oxc_ast::ast::CallExpression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    call.arguments.iter().any(|argument| match argument {
        Argument::SpreadElement(spread) => {
            expression_reads_style_signal(&spread.argument, bindings, state)
        }
        _ => expression_reads_style_signal(argument.to_expression(), bindings, state),
    })
}

pub fn is_direct_style_pipeline_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    imports: &HashMap<String, TraceImport>,
) -> bool {
    if is_split_css_props_call(call, imports) {
        return true;
    }
    let Expression::Identifier(identifier) = &call.callee else {
        return false;
    };
    match imports.get(identifier.name.as_str()) {
        Some(import_binding)
            if import_binding.source == "@reference-ui/styled/css"
                && import_binding.imported_name == "css" =>
        {
            true
        }
        Some(import_binding)
            if import_binding.source.contains("/patterns/box")
                && import_binding.imported_name == "box" =>
        {
            true
        }
        _ => matches!(identifier.name.as_str(), "css" | "box" | "splitCssProps"),
    }
}

pub fn is_split_css_props_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    imports: &HashMap<String, TraceImport>,
) -> bool {
    let Expression::Identifier(identifier) = &call.callee else {
        return false;
    };
    match imports.get(identifier.name.as_str()) {
        Some(import_binding)
            if import_binding.source == "@reference-ui/styled/jsx"
                && import_binding.imported_name == "splitCssProps" =>
        {
            true
        }
        _ => identifier.name.as_str() == "splitCssProps",
    }
}
