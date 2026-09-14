//! Expression traversal for collecting JSX forwarding edges.

use oxc_ast::ast::{Argument, Expression};
use super::{WalkContext, collect_edges_from_statement};
use super::jsx::{collect_edges_from_jsx_element, collect_edges_from_jsx_child, create_element_target, create_element_props_pass_style_props, is_react_create_element_call};
use crate::analysis::model::ComponentEdge;

pub fn collect_edges_from_expression(
    expression: &Expression<'_>,
    ctx: &mut WalkContext<'_>
) {
    match expression {
        Expression::JSXElement(element) => collect_edges_from_jsx_element(element, ctx),
        Expression::JSXFragment(fragment) => {
            for child in &fragment.children {
                collect_edges_from_jsx_child(child, ctx);
            }
        }
        Expression::CallExpression(call) => walk_call_expression(call, ctx),
        Expression::ConditionalExpression(conditional) => walk_conditional_expression(conditional, ctx),
        Expression::LogicalExpression(logical) => walk_logical_expression(logical, ctx),
        Expression::ArrayExpression(array) => walk_array_expression(array, ctx),
        Expression::ObjectExpression(object) => walk_object_expression(object, ctx),
        Expression::ArrowFunctionExpression(arrow) => walk_arrow_function(arrow, ctx),
        Expression::FunctionExpression(function) => walk_function_expression(function, ctx),
        Expression::ComputedMemberExpression(member) => {
            collect_edges_from_expression(&member.object, ctx);
            collect_edges_from_expression(&member.expression, ctx);
        }
        Expression::StaticMemberExpression(member) => collect_edges_from_expression(&member.object, ctx),
        Expression::ParenthesizedExpression(paren) => collect_edges_from_expression(&paren.expression, ctx),
        Expression::TSAsExpression(asserted) => collect_edges_from_expression(&asserted.expression, ctx),
        Expression::TSSatisfiesExpression(asserted) => collect_edges_from_expression(&asserted.expression, ctx),
        Expression::TSTypeAssertion(asserted) => collect_edges_from_expression(&asserted.expression, ctx),
        Expression::TSNonNullExpression(asserted) => collect_edges_from_expression(&asserted.expression, ctx),
        Expression::TSInstantiationExpression(instantiated) => collect_edges_from_expression(&instantiated.expression, ctx),
        _ => {}
    }
}

fn walk_call_expression(call: &oxc_allocator::Box<'_, oxc_ast::ast::CallExpression<'_>>, ctx: &mut WalkContext<'_>) {
    collect_edges_from_create_element_call(call, ctx);
    collect_edges_from_expression(&call.callee, ctx);
    for argument in &call.arguments {
        collect_edges_from_argument(argument, ctx);
    }
}

fn walk_conditional_expression(conditional: &oxc_ast::ast::ConditionalExpression<'_>, ctx: &mut WalkContext<'_>) {
    collect_edges_from_expression(&conditional.test, ctx);
    collect_edges_from_expression(&conditional.consequent, ctx);
    collect_edges_from_expression(&conditional.alternate, ctx);
}

fn walk_logical_expression(logical: &oxc_ast::ast::LogicalExpression<'_>, ctx: &mut WalkContext<'_>) {
    collect_edges_from_expression(&logical.left, ctx);
    collect_edges_from_expression(&logical.right, ctx);
}

fn walk_array_expression(array: &oxc_ast::ast::ArrayExpression<'_>, ctx: &mut WalkContext<'_>) {
    for element in &array.elements {
        match element {
            oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                collect_edges_from_expression(&spread.argument, ctx)
            }
            oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
            _ => collect_edges_from_expression(element.to_expression(), ctx),
        }
    }
}

fn walk_object_expression(object: &oxc_ast::ast::ObjectExpression<'_>, ctx: &mut WalkContext<'_>) {
    for property in &object.properties {
        match property {
            oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                collect_edges_from_expression(&property.value, ctx)
            }
            oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                collect_edges_from_expression(&spread.argument, ctx)
            }
        }
    }
}

fn walk_arrow_function(arrow: &oxc_ast::ast::ArrowFunctionExpression<'_>, ctx: &mut WalkContext<'_>) {
    for nested in &arrow.body.statements {
        collect_edges_from_statement(nested, ctx);
    }
}

fn walk_function_expression(function: &oxc_ast::ast::Function<'_>, ctx: &mut WalkContext<'_>) {
    if let Some(body) = &function.body {
        for nested in &body.statements {
            collect_edges_from_statement(nested, ctx);
        }
    }
}

fn collect_edges_from_create_element_call(
    call: &oxc_allocator::Box<'_, oxc_ast::ast::CallExpression<'_>>,
    ctx: &mut WalkContext<'_>
) {
    if !is_react_create_element_call(call) {
        return;
    }
    let Some(target_argument) = call.arguments.first() else { return; };
    let Some(props_argument) = call.arguments.get(1) else { return; };
    let Some(target) = create_element_target(target_argument, ctx.imports, ctx.primitive_names) else { return; };

    if create_element_props_pass_style_props(props_argument, ctx.bindings) {
        ctx.edges.push(ComponentEdge { target });
    }

    for child in call.arguments.iter().skip(2) {
        collect_edges_from_argument(child, ctx);
    }
}

fn collect_edges_from_argument(argument: &Argument<'_>, ctx: &mut WalkContext<'_>) {
    match argument {
        Argument::SpreadElement(spread) => collect_edges_from_expression(&spread.argument, ctx),
        _ => collect_edges_from_expression(argument.to_expression(), ctx),
    }
}
