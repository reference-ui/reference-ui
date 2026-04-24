//! Detects whether a traced component actually drives the Reference style pipeline.
//!
//! This stays separate from AST-to-component extraction so the parser entrypoint can focus on
//! symbol collection while this module owns the style-signal dataflow walk.

use std::collections::{BTreeSet, HashMap};

use oxc_ast::ast::{Argument, Expression, Statement};
use oxc_span::GetSpan;

use super::super::model::{PropBindings, TraceImport};
use super::super::util::{
    is_identifier, parse_object_pattern_bindings, parse_object_pattern_rest, slice_span,
};

#[derive(Default)]
struct PipelineState {
    style_signals: BTreeSet<String>,
    class_name_bindings: BTreeSet<String>,
    uses_style_pipeline: bool,
}

pub(super) fn component_uses_style_pipeline(
    body_statements: &oxc_allocator::Vec<'_, Statement<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
) -> bool {
    let mut state = PipelineState {
        style_signals: bindings
            .direct_style_bindings
            .iter()
            .chain(bindings.props_object_bindings.iter())
            .chain(bindings.spread_bindings.iter())
            .cloned()
            .collect(),
        ..PipelineState::default()
    };

    for statement in body_statements {
        walk_pipeline_statement(statement, source, imports, bindings, &mut state);
        if state.uses_style_pipeline {
            return true;
        }
    }

    state.uses_style_pipeline
}

fn walk_pipeline_statement(
    statement: &Statement<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    match statement {
        Statement::ExpressionStatement(expression) => {
            walk_pipeline_expression(&expression.expression, source, imports, bindings, state)
        }
        Statement::ReturnStatement(return_statement) => {
            if let Some(argument) = &return_statement.argument {
                walk_pipeline_expression(argument, source, imports, bindings, state);
            }
        }
        Statement::VariableDeclaration(declaration) => {
            for declarator in &declaration.declarations {
                if let Some(init) = &declarator.init {
                    walk_pipeline_expression(init, source, imports, bindings, state);
                    record_pipeline_binding(
                        slice_span(source, declarator.id.span()).trim(),
                        init,
                        imports,
                        bindings,
                        state,
                    );
                }
            }
        }
        Statement::BlockStatement(block) => {
            for nested in &block.body {
                walk_pipeline_statement(nested, source, imports, bindings, state);
            }
        }
        Statement::IfStatement(if_statement) => {
            walk_pipeline_expression(&if_statement.test, source, imports, bindings, state);
            walk_pipeline_statement(&if_statement.consequent, source, imports, bindings, state);
            if let Some(alternate) = &if_statement.alternate {
                walk_pipeline_statement(alternate, source, imports, bindings, state);
            }
        }
        Statement::SwitchStatement(switch_statement) => {
            walk_pipeline_expression(
                &switch_statement.discriminant,
                source,
                imports,
                bindings,
                state,
            );
            for case in &switch_statement.cases {
                if let Some(test) = &case.test {
                    walk_pipeline_expression(test, source, imports, bindings, state);
                }
                for nested in &case.consequent {
                    walk_pipeline_statement(nested, source, imports, bindings, state);
                }
            }
        }
        _ => {}
    }
}

fn walk_pipeline_expression(
    expression: &Expression<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    match expression {
        Expression::JSXElement(element) => {
            walk_pipeline_jsx_element(element, source, imports, bindings, state)
        }
        Expression::JSXFragment(fragment) => {
            walk_pipeline_jsx_fragment(fragment, source, imports, bindings, state)
        }
        Expression::CallExpression(call) => {
            if is_direct_style_pipeline_call(call, imports)
                && call.arguments.iter().any(|argument| match argument {
                    Argument::SpreadElement(spread) => {
                        expression_reads_style_signal(&spread.argument, bindings, state)
                    }
                    _ => expression_reads_style_signal(argument.to_expression(), bindings, state),
                })
            {
                state.uses_style_pipeline = true;
            }

            walk_pipeline_expression(&call.callee, source, imports, bindings, state);
            for argument in &call.arguments {
                match argument {
                    Argument::SpreadElement(spread) => {
                        walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
                    }
                    _ => walk_pipeline_expression(
                        argument.to_expression(),
                        source,
                        imports,
                        bindings,
                        state,
                    ),
                }
            }
        }
        Expression::ConditionalExpression(conditional) => {
            walk_pipeline_expression(&conditional.test, source, imports, bindings, state);
            walk_pipeline_expression(&conditional.consequent, source, imports, bindings, state);
            walk_pipeline_expression(&conditional.alternate, source, imports, bindings, state);
        }
        Expression::LogicalExpression(logical) => {
            walk_pipeline_expression(&logical.left, source, imports, bindings, state);
            walk_pipeline_expression(&logical.right, source, imports, bindings, state);
        }
        Expression::ArrayExpression(array) => {
            for element in &array.elements {
                match element {
                    oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                        walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
                    }
                    oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
                    _ => walk_pipeline_expression(
                        element.to_expression(),
                        source,
                        imports,
                        bindings,
                        state,
                    ),
                }
            }
        }
        Expression::ObjectExpression(object) => {
            for property in &object.properties {
                match property {
                    oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                        walk_pipeline_expression(&property.value, source, imports, bindings, state)
                    }
                    oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                        walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
                    }
                }
            }
        }
        Expression::ArrowFunctionExpression(arrow) => {
            for nested in &arrow.body.statements {
                walk_pipeline_statement(nested, source, imports, bindings, state);
            }
        }
        Expression::FunctionExpression(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    walk_pipeline_statement(nested, source, imports, bindings, state);
                }
            }
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            walk_pipeline_expression(&parenthesized.expression, source, imports, bindings, state)
        }
        Expression::TSAsExpression(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSTypeAssertion(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSNonNullExpression(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            walk_pipeline_expression(&instantiated.expression, source, imports, bindings, state)
        }
        Expression::ComputedMemberExpression(member) => {
            walk_pipeline_expression(&member.object, source, imports, bindings, state);
            walk_pipeline_expression(&member.expression, source, imports, bindings, state);
        }
        Expression::StaticMemberExpression(member) => {
            walk_pipeline_expression(&member.object, source, imports, bindings, state)
        }
        _ => {}
    }
}

fn walk_pipeline_jsx_element(
    element: &oxc_allocator::Box<'_, oxc_ast::ast::JSXElement<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    for attribute in &element.opening_element.attributes {
        match attribute {
            oxc_ast::ast::JSXAttributeItem::Attribute(attribute) => {
                let is_class_name = matches!(
                    &attribute.name,
                    oxc_ast::ast::JSXAttributeName::Identifier(identifier)
                        if identifier.name.as_str() == "className"
                );

                if is_class_name {
                    if let Some(oxc_ast::ast::JSXAttributeValue::ExpressionContainer(container)) =
                        &attribute.value
                    {
                        if !matches!(
                            &container.expression,
                            oxc_ast::ast::JSXExpression::EmptyExpression(_)
                        ) && expression_uses_class_name_binding(
                            container.expression.to_expression(),
                            state,
                        )
                        {
                            state.uses_style_pipeline = true;
                        }
                    }
                }

                if let Some(value) = &attribute.value {
                    match value {
                        oxc_ast::ast::JSXAttributeValue::ExpressionContainer(container) => {
                            if !matches!(
                                &container.expression,
                                oxc_ast::ast::JSXExpression::EmptyExpression(_)
                            ) {
                                walk_pipeline_expression(
                                    container.expression.to_expression(),
                                    source,
                                    imports,
                                    bindings,
                                    state,
                                );
                            }
                        }
                        oxc_ast::ast::JSXAttributeValue::Element(element) => {
                            walk_pipeline_jsx_element(element, source, imports, bindings, state)
                        }
                        oxc_ast::ast::JSXAttributeValue::Fragment(fragment) => {
                            walk_pipeline_jsx_fragment(fragment, source, imports, bindings, state)
                        }
                        oxc_ast::ast::JSXAttributeValue::StringLiteral(_) => {}
                    }
                }
            }
            oxc_ast::ast::JSXAttributeItem::SpreadAttribute(spread) => {
                walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
            }
        }
    }

    for child in &element.children {
        walk_pipeline_jsx_child(child, source, imports, bindings, state);
    }
}

fn walk_pipeline_jsx_fragment(
    fragment: &oxc_allocator::Box<'_, oxc_ast::ast::JSXFragment<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    for child in &fragment.children {
        walk_pipeline_jsx_child(child, source, imports, bindings, state);
    }
}

fn walk_pipeline_jsx_child(
    child: &oxc_ast::ast::JSXChild<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    match child {
        oxc_ast::ast::JSXChild::Element(element) => {
            walk_pipeline_jsx_element(element, source, imports, bindings, state)
        }
        oxc_ast::ast::JSXChild::Fragment(fragment) => {
            walk_pipeline_jsx_fragment(fragment, source, imports, bindings, state)
        }
        oxc_ast::ast::JSXChild::ExpressionContainer(container) => {
            if !matches!(
                &container.expression,
                oxc_ast::ast::JSXExpression::EmptyExpression(_)
            ) {
                walk_pipeline_expression(
                    container.expression.to_expression(),
                    source,
                    imports,
                    bindings,
                    state,
                );
            }
        }
        oxc_ast::ast::JSXChild::Spread(spread) => {
            walk_pipeline_expression(&spread.expression, source, imports, bindings, state)
        }
        oxc_ast::ast::JSXChild::Text(_) => {}
    }
}

fn record_pipeline_binding(
    pattern_source: &str,
    init: &Expression<'_>,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    let init_uses_style_signal = expression_reads_style_signal(init, bindings, state)
        || matches!(init, Expression::CallExpression(call) if call_has_style_signal_arg(call, bindings, state));

    if pattern_source.starts_with('{') && init_uses_style_signal {
        for binding in parse_object_pattern_bindings(pattern_source) {
            state.style_signals.insert(binding.local_name);
        }
        if let Some(rest_binding) = parse_object_pattern_rest(pattern_source) {
            state.style_signals.insert(rest_binding);
        }
        return;
    }

    if pattern_source.starts_with('[')
        && matches!(init, Expression::CallExpression(call) if is_split_css_props_call(call, imports))
        && expression_reads_style_signal(call_first_argument(init), bindings, state)
    {
        if let Some(first_binding) = parse_array_pattern_first_binding(pattern_source) {
            state.style_signals.insert(first_binding);
        }
        return;
    }

    if is_identifier(pattern_source) {
        if pattern_source.to_ascii_lowercase().contains("class")
            && matches!(init, Expression::CallExpression(call) if call_has_style_signal_arg(call, bindings, state))
        {
            state.class_name_bindings.insert(pattern_source.to_string());
        }

        if expression_directly_derives_from_style_signal(init, bindings, state) {
            state.style_signals.insert(pattern_source.to_string());
        }
    }
}

fn parse_array_pattern_first_binding(pattern_source: &str) -> Option<String> {
    let inner = pattern_source
        .trim()
        .strip_prefix('[')
        .and_then(|value| value.strip_suffix(']'))
        .unwrap_or("");

    inner
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

fn expression_reads_style_signal(
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
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_reads_style_signal(&parenthesized.expression, bindings, state)
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
        _ => false,
    }
}

fn expression_directly_derives_from_style_signal(
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

fn expression_uses_class_name_binding(expression: &Expression<'_>, state: &PipelineState) -> bool {
    match expression {
        Expression::Identifier(identifier) => {
            state.class_name_bindings.contains(identifier.name.as_str())
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_uses_class_name_binding(&parenthesized.expression, state)
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

fn call_has_style_signal_arg(
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

fn is_direct_style_pipeline_call(
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

fn is_split_css_props_call(
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
