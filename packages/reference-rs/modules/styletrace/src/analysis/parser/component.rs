//! Extracts component signatures and bodies from TSX source code.
//! Identifies components and factories based on the presence of style pipeline usage or JSX returns.
//! Populates the intermediate trace representation.

use oxc_ast::ast::{Expression, FormalParameter, Statement};
use std::collections::{BTreeSet, HashMap};

use super::context::ParserContext;
use super::pipeline::component_uses_style_pipeline;
use super::types::parse_prop_bindings;
use crate::analysis::model::{
    ComponentEdge, FactoryTarget, TraceComponent, TraceFactory, TraceImport,
};
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

pub fn factory_from_function_declaration(
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    let Some(id) = function.id.as_ref() else {
        return Ok(None);
    };
    let Some(body) = function.body.as_ref() else {
        return Ok(None);
    };

    let mut local_components = HashMap::new();
    super::collect_variable_symbols(
        body.statements
            .iter()
            .filter_map(|statement| match statement {
                Statement::VariableDeclaration(declaration) => {
                    Some(declaration.declarations.iter())
                }
                _ => None,
            })
            .flatten(),
        ctx,
        &mut local_components,
        &mut HashMap::new(),
    )?;

    for statement in &body.statements {
        if let Some(factory) =
            extract_factory_from_statement(statement, id.name.as_str(), &local_components, ctx)?
        {
            return Ok(Some(factory));
        }
    }

    Ok(None)
}

fn extract_factory_from_statement(
    statement: &Statement<'_>,
    id_name: &str,
    local_components: &HashMap<String, TraceComponent>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    let Statement::ReturnStatement(return_statement) = statement else {
        return Ok(None);
    };

    let Some(argument) = return_statement.argument.as_ref() else {
        return Ok(None);
    };

    if let Expression::Identifier(identifier) = argument {
        if let Some(component) = local_components.get(identifier.name.as_str()) {
            return Ok(Some((
                id_name.to_string(),
                TraceFactory {
                    component: component.clone(),
                },
            )));
        }
    }

    if let Some(component) =
        component_from_expression("FactoryProduct", argument, ctx, BTreeSet::new())?
    {
        return Ok(Some((id_name.to_string(), TraceFactory { component })));
    }

    Ok(None)
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
        owned_props: bindings.owned_props.clone(),
    }))
}

pub fn factory_target_from_expression(
    expression: &Expression<'_>,
    imports: &HashMap<String, TraceImport>,
) -> Option<FactoryTarget> {
    match expression {
        Expression::CallExpression(call) => match &call.callee {
            Expression::Identifier(identifier) => imports
                .get(identifier.name.as_str())
                .map(|import_binding| FactoryTarget::Imported {
                    source: import_binding.source.clone(),
                    imported_name: import_binding.imported_name.clone(),
                })
                .or_else(|| Some(FactoryTarget::Local(identifier.name.to_string()))),
            _ => None,
        },
        Expression::ParenthesizedExpression(parenthesized) => {
            factory_target_from_expression(&parenthesized.expression, imports)
        }
        Expression::TSAsExpression(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSTypeAssertion(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSNonNullExpression(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            factory_target_from_expression(&instantiated.expression, imports)
        }
        _ => None,
    }
}
