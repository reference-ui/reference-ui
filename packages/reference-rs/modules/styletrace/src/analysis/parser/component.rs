//! Extracts component signatures and bodies from TSX source code.
//! Identifies components from the presence of style pipeline usage or JSX returns, and builds the component value of a function, arrow or React wrapper expression.
//! Populates the intermediate trace representation; factories and higher-order components live in `factory.rs`.

use oxc_ast::ast::{Expression, FormalParameter, Statement};
use std::collections::BTreeSet;

use super::context::ParserContext;
use super::pipeline::component_uses_style_pipeline;
use super::types::parse_prop_bindings;
use crate::analysis::model::{ComponentEdge, PropBindings, TraceComponent};
use crate::analysis::util::is_component_name;
use crate::analysis::walk::{collect_edges_from_statement, WalkContext};
use crate::resolver::StyleTraceError;

pub struct FunctionLikeContext<'a, 'b, 'c> {
    pub name: &'a str,
    pub first_param: Option<&'b FormalParameter<'b>>,
    pub body_statements: Option<&'c oxc_allocator::Vec<'c, Statement<'c>>>,
    pub wrapper_style_props: BTreeSet<String>,
}

pub fn component_from_function_declaration(
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
        wrapper_style_props: BTreeSet::new(),
    };

    let component = component_from_function_like(&fl_ctx, ctx)?;

    Ok(component.map(|c| (name, c)))
}

pub fn component_from_expression(
    name: &str,
    expression: &Expression<'_>,
    ctx: &ParserContext,
    wrapper_style_props: BTreeSet<String>,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => component_from_function_like(
            &FunctionLikeContext {
                name,
                first_param: arrow.params.items.first(),
                body_statements: Some(&arrow.body.statements),
                wrapper_style_props,
            },
            ctx,
        ),
        Expression::FunctionExpression(function) => component_from_function_like(
            &FunctionLikeContext {
                name,
                first_param: function.params.items.first(),
                body_statements: function.body.as_ref().map(|body| &body.statements),
                wrapper_style_props,
            },
            ctx,
        ),
        Expression::ParenthesizedExpression(parenthesized) => {
            component_from_expression(name, &parenthesized.expression, ctx, wrapper_style_props)
        }
        Expression::TSAsExpression(asserted) => {
            component_from_expression(name, &asserted.expression, ctx, wrapper_style_props)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            component_from_expression(name, &asserted.expression, ctx, wrapper_style_props)
        }
        Expression::TSTypeAssertion(asserted) => {
            component_from_expression(name, &asserted.expression, ctx, wrapper_style_props)
        }
        Expression::TSNonNullExpression(asserted) => {
            component_from_expression(name, &asserted.expression, ctx, wrapper_style_props)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            let next_wrapper = super::types::wrapper_style_props_from_type_arguments(
                ctx,
                instantiated.type_arguments.params.iter().nth(1),
            )?;
            component_from_expression(name, &instantiated.expression, ctx, next_wrapper)
        }
        Expression::CallExpression(call) => extract_component_from_call(name, call, ctx),
        _ => Ok(None),
    }
}

fn extract_component_from_call(
    name: &str,
    call: &oxc_allocator::Box<'_, oxc_ast::ast::CallExpression<'_>>,
    ctx: &ParserContext,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    let next_wrapper = super::types::wrapper_style_props_from_call(call, ctx)?;
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

pub fn component_from_function_like(
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
        fl_ctx.wrapper_style_props.clone(),
    )?;
    let mut edges = Vec::<ComponentEdge>::new();
    for statement in body_statements {
        collect_edges_from_statement(
            statement,
            &mut WalkContext {
                imports: ctx.imports,
                primitive_names: &ctx.surface.primitives,
                bindings: &bindings,
                edges: &mut edges,
            },
        );
    }

    let uses_style_pipeline =
        component_uses_style_pipeline(body_statements, ctx.source, ctx.imports, &bindings);

    if edges.is_empty() && !uses_style_pipeline {
        return Ok(None);
    }

    Ok(Some(TraceComponent {
        exposes_style_props: bindings.exposes_style_props(),
        uses_style_pipeline,
        edges,
        owned_props: shadowed_owned_props(&bindings),
    }))
}

/// Declared-owned names that survive the forward: only props the component
/// pulls out of the props object shadow StyleProps. Names riding the
/// props/rest spread into the primitive keep extracting at call sites.
fn shadowed_owned_props(bindings: &PropBindings) -> BTreeSet<String> {
    bindings
        .owned_props
        .intersection(&bindings.destructured_prop_names)
        .cloned()
        .collect()
}
