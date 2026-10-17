//! Extracts component signatures and bodies from TSX source code.
//! Identifies components from the presence of style pipeline usage or JSX returns, and builds the component value of a function, arrow or React wrapper expression.
//! A bare declaration whose body reaches no primitive keeps a declared-only record when it owns props, so those props still reach the trace; strict callers never see that record.
//! Populates the intermediate trace representation; factories and higher-order components live in `factory.rs`.

use oxc_ast::ast::{Expression, FormalParameter, Statement};
use std::collections::BTreeSet;

use super::context::ParserContext;
use super::pipeline::component_uses_style_pipeline;
use super::types::parse_prop_bindings;
use crate::analysis::model::{ComponentEdge, PropBindings, TraceComponent, WrapperProps};
use crate::analysis::util::{is_component_name, transparent_inner};
use crate::analysis::walk::{collect_edges_from_statement, WalkContext};
use crate::resolver::StyleTraceError;

pub struct FunctionLikeContext<'a, 'b, 'c> {
    pub name: &'a str,
    pub first_param: Option<&'b FormalParameter<'b>>,
    pub body_statements: Option<&'c oxc_allocator::Vec<'c, Statement<'c>>>,
    pub wrapper_props: WrapperProps,
}

/// The component a top-level function declaration declares, traced or declared-only.
pub fn declared_from_function_declaration(
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceComponent)>, StyleTraceError> {
    let Some(id) = function.id.as_ref() else {
        return Ok(None);
    };

    let name = id.name.to_string();
    let fl_ctx = FunctionLikeContext {
        name: &name,
        first_param: function.params.items.first(),
        body_statements: function.body.as_ref().map(|body| &body.statements),
        wrapper_props: WrapperProps::default(),
    };

    let component = declared_from_function_like(&fl_ctx, ctx)?;

    Ok(component.map(|c| (name, c)))
}

/// The component an expression yields when it can reach a primitive. Calls recurse into their
/// arguments here, so only a traced component answers: a declared-only record would hide the
/// factory and wrapper paths that the same call may take.
pub fn component_from_expression(
    name: &str,
    expression: &Expression<'_>,
    ctx: &ParserContext,
    wrapper_props: WrapperProps,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    match expression {
        Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => Ok(
            declared_from_function_expression(name, expression, ctx, wrapper_props)?
                .filter(TraceComponent::has_style_path),
        ),
        Expression::CallExpression(call) => extract_component_from_call(name, call, ctx),
        _ => component_from_other_expression(name, expression, ctx, wrapper_props),
    }
}

/// The component a top-level binding declares. A bare arrow or function keeps its declared-only
/// record; every other initializer follows `component_from_expression`, so the wrapper and factory
/// paths that a call initializer takes stay exactly as they were.
pub fn declared_component_from_binding(
    name: &str,
    expression: &Expression<'_>,
    ctx: &ParserContext,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    match expression {
        Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => {
            declared_from_function_expression(name, expression, ctx, WrapperProps::default())
        }
        _ => component_from_expression(name, expression, ctx, WrapperProps::default()),
    }
}

/// The declared record of an arrow or function expression; any other expression declares nothing.
fn declared_from_function_expression(
    name: &str,
    expression: &Expression<'_>,
    ctx: &ParserContext,
    wrapper_props: WrapperProps,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    let fl_ctx = match expression {
        Expression::ArrowFunctionExpression(arrow) => FunctionLikeContext {
            name,
            first_param: arrow.params.items.first(),
            body_statements: Some(&arrow.body.statements),
            wrapper_props,
        },
        Expression::FunctionExpression(function) => FunctionLikeContext {
            name,
            first_param: function.params.items.first(),
            body_statements: function.body.as_ref().map(|body| &body.statements),
            wrapper_props,
        },
        _ => return Ok(None),
    };
    declared_from_function_like(&fl_ctx, ctx)
}

/// Parenthesis and TS assertion wrappers pass the same props to their inner expression. TS
/// instantiation is the one wrapper that replaces them, with props read from its type arguments.
fn component_from_other_expression(
    name: &str,
    expression: &Expression<'_>,
    ctx: &ParserContext,
    wrapper_props: WrapperProps,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    if let Expression::TSInstantiationExpression(instantiated) = expression {
        let next_wrapper = super::types::wrapper_props_from_type_arguments(
            ctx,
            instantiated.type_arguments.params.get(1),
        )?;
        return component_from_expression(name, &instantiated.expression, ctx, next_wrapper);
    }
    match transparent_inner(expression) {
        Some(inner) => component_from_expression(name, inner, ctx, wrapper_props),
        None => Ok(None),
    }
}

fn extract_component_from_call(
    name: &str,
    call: &oxc_allocator::Box<'_, oxc_ast::ast::CallExpression<'_>>,
    ctx: &ParserContext,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    let next_wrapper = super::types::wrapper_props_from_call(call, ctx)?;
    for argument in &call.arguments {
        let oxc_ast::ast::Argument::SpreadElement(_) = argument else {
            if let Some(component) = component_from_expression(
                name,
                argument.to_expression(),
                ctx,
                next_wrapper.clone(),
            )? {
                return Ok(Some(component));
            }
            continue;
        };
    }
    Ok(None)
}

/// The traced component a function-like yields, if any. Strict: a declared-only record is dropped.
pub fn component_from_function_like(
    fl_ctx: &FunctionLikeContext<'_, '_, '_>,
    ctx: &ParserContext,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    Ok(declared_from_function_like(fl_ctx, ctx)?.filter(TraceComponent::has_style_path))
}

/// The record a function-like declares. A body that reaches a primitive gives the traced record.
/// A body that reaches none, but owns props, gives a declared-only record: no edges, no style
/// props exposed, so its host decision stays off and only its owned names reach the trace.
pub fn declared_from_function_like(
    fl_ctx: &FunctionLikeContext<'_, '_, '_>,
    ctx: &ParserContext,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    if !is_component_name(fl_ctx.name) {
        return Ok(None);
    }
    let Some(body_statements) = fl_ctx.body_statements else {
        return Ok(None);
    };

    let bindings = parse_prop_bindings(
        fl_ctx.first_param,
        fl_ctx.body_statements,
        ctx,
        fl_ctx.wrapper_props.clone(),
    )?;
    let mut edges = Vec::<ComponentEdge>::new();
    let mut forwarded_props = BTreeSet::<String>::new();
    for statement in body_statements {
        collect_edges_from_statement(
            statement,
            &mut WalkContext {
                imports: ctx.imports,
                primitive_names: &ctx.surface.primitives,
                bindings: &bindings,
                edges: &mut edges,
                forwarded_props: &mut forwarded_props,
            },
        );
    }

    let uses_style_pipeline =
        component_uses_style_pipeline(body_statements, ctx.source, ctx.imports, &bindings);
    let has_style_path = uses_style_pipeline || !edges.is_empty();
    let owned_props = shadowed_owned_props(&bindings, &forwarded_props);
    if !has_style_path && owned_props.is_empty() {
        return Ok(None);
    }

    Ok(Some(TraceComponent {
        // A declared-only record has no style path, so it exposes no style props either.
        exposes_style_props: has_style_path && bindings.exposes_style_props(),
        uses_style_pipeline,
        edges,
        owned_props,
    }))
}

/// Declared-owned names that survive the forward: only props the component
/// pulls out of the props object shadow StyleProps, and only while the body
/// never passes them on under their own name (`size={size}`). Names riding
/// the props/rest spread into the primitive, or handed on under their own
/// name, keep extracting at call sites.
fn shadowed_owned_props(
    bindings: &PropBindings,
    forwarded_props: &BTreeSet<String>,
) -> BTreeSet<String> {
    bindings
        .owned_props
        .intersection(&bindings.destructured_prop_names)
        .filter(|name| !forwarded_props.contains(*name))
        .cloned()
        .collect()
}
