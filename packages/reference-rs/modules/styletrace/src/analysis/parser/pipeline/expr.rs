//! Walk pipeline expressions.
use oxc_ast::ast::{Argument, Expression};
use super::{PipelineContext, jsx, util, walk_pipeline_statement};

pub fn walk_pipeline_expression(expression: &Expression<'_>, ctx: &mut PipelineContext) {
    match expression {
        Expression::JSXElement(element) => jsx::walk_pipeline_jsx_element(element, ctx),
        Expression::JSXFragment(fragment) => jsx::walk_pipeline_jsx_fragment(fragment, ctx),
        Expression::CallExpression(call) => walk_call(call, ctx),
        Expression::ConditionalExpression(cond) => walk_cond(cond, ctx),
        Expression::LogicalExpression(logical) => walk_logical(logical, ctx),
        Expression::ArrayExpression(array) => walk_array(array, ctx),
        Expression::ObjectExpression(object) => walk_object(object, ctx),
        Expression::ArrowFunctionExpression(arrow) => walk_arrow(arrow, ctx),
        Expression::FunctionExpression(function) => walk_function(function, ctx),
        Expression::ParenthesizedExpression(paren) => walk_pipeline_expression(&paren.expression, ctx),
        Expression::TSAsExpression(asserted) => walk_pipeline_expression(&asserted.expression, ctx),
        Expression::TSSatisfiesExpression(asserted) => walk_pipeline_expression(&asserted.expression, ctx),
        Expression::TSTypeAssertion(asserted) => walk_pipeline_expression(&asserted.expression, ctx),
        Expression::TSNonNullExpression(asserted) => walk_pipeline_expression(&asserted.expression, ctx),
        Expression::TSInstantiationExpression(instantiated) => walk_pipeline_expression(&instantiated.expression, ctx),
        Expression::ComputedMemberExpression(member) => {
            walk_pipeline_expression(&member.object, ctx);
            walk_pipeline_expression(&member.expression, ctx);
        }
        Expression::StaticMemberExpression(member) => walk_pipeline_expression(&member.object, ctx),
        _ => {}
    }
}

fn walk_call(call: &oxc_ast::ast::CallExpression<'_>, ctx: &mut PipelineContext) {
    if util::is_direct_style_pipeline_call(call, ctx.imports)
        && call.arguments.iter().any(|arg| match arg {
            Argument::SpreadElement(spread) => util::expression_reads_style_signal(&spread.argument, ctx.bindings, ctx.state),
            _ => util::expression_reads_style_signal(arg.to_expression(), ctx.bindings, ctx.state),
        })
    {
        ctx.state.uses_style_pipeline = true;
    }
    walk_pipeline_expression(&call.callee, ctx);
    for argument in &call.arguments {
        match argument {
            Argument::SpreadElement(spread) => walk_pipeline_expression(&spread.argument, ctx),
            _ => walk_pipeline_expression(argument.to_expression(), ctx),
        }
    }
}

fn walk_cond(cond: &oxc_ast::ast::ConditionalExpression<'_>, ctx: &mut PipelineContext) {
    walk_pipeline_expression(&cond.test, ctx);
    walk_pipeline_expression(&cond.consequent, ctx);
    walk_pipeline_expression(&cond.alternate, ctx);
}

fn walk_logical(logical: &oxc_ast::ast::LogicalExpression<'_>, ctx: &mut PipelineContext) {
    walk_pipeline_expression(&logical.left, ctx);
    walk_pipeline_expression(&logical.right, ctx);
}

fn walk_array(array: &oxc_ast::ast::ArrayExpression<'_>, ctx: &mut PipelineContext) {
    for element in &array.elements {
        match element {
            oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => walk_pipeline_expression(&spread.argument, ctx),
            oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
            _ => walk_pipeline_expression(element.to_expression(), ctx),
        }
    }
}

fn walk_object(object: &oxc_ast::ast::ObjectExpression<'_>, ctx: &mut PipelineContext) {
    for property in &object.properties {
        match property {
            oxc_ast::ast::ObjectPropertyKind::ObjectProperty(prop) => walk_pipeline_expression(&prop.value, ctx),
            oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => walk_pipeline_expression(&spread.argument, ctx),
        }
    }
}

fn walk_arrow(arrow: &oxc_ast::ast::ArrowFunctionExpression<'_>, ctx: &mut PipelineContext) {
    for nested in &arrow.body.statements {
        walk_pipeline_statement(nested, ctx);
    }
}

fn walk_function(function: &oxc_ast::ast::Function<'_>, ctx: &mut PipelineContext) {
    if let Some(body) = &function.body {
        for nested in &body.statements {
            walk_pipeline_statement(nested, ctx);
        }
    }
}
