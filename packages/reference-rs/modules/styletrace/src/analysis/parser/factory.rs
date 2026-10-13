//! Recognizes factories and higher-order components: functions whose returned component is built from their own parameters, and the call sites that apply them.
//! A `function`, arrow or function-expression body yields a factory when one of its returned expressions is a component, including a forwardRef or memo wrapper and an inner function declaration. Edges that render a parameter become `Parameter` edges, which the call's arguments resolve later.
//! A call such as `withPad(Box)` yields a call site whose arguments resolve to edge targets in the calling module; an argument that names no component resolves to nothing.

use std::collections::BTreeSet;

use oxc_ast::ast::{
    Argument, ArrowFunctionExpression, BindingPattern, Expression, FormalParameters, Function,
    Statement, StaticMemberExpression,
};
use rustc_hash::FxHashMap;

use super::component::{component_from_expression, component_from_function_declaration};
use super::context::ParserContext;
use super::types::unwrap_transparent_expression;
use super::ParseState;
use crate::analysis::model::{
    EdgeTarget, FactoryCall, FactoryTarget, TraceComponent, TraceFactory, TraceImport,
};
use crate::analysis::walk::jsx::{handle_namespace_target, identifier_target};
use crate::resolver::StyleTraceError;

/// The parts of one function body a factory is read from: its name, its parameters, its statements,
/// and whether the body is a bare expression (an expression-bodied arrow returns its sole expression).
struct FactoryBody<'a> {
    name: &'a str,
    params: &'a FormalParameters<'a>,
    statements: &'a oxc_allocator::Vec<'a, Statement<'a>>,
    expression_body: bool,
}

/// The factory a function declaration defines, when one of its returned expressions is a component.
pub fn factory_from_function_declaration(
    function: &oxc_allocator::Box<'_, Function<'_>>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    let (Some(id), Some(body)) = (function.id.as_ref(), function.body.as_ref()) else {
        return Ok(None);
    };
    let body = FactoryBody {
        name: id.name.as_str(),
        params: &function.params,
        statements: &body.statements,
        expression_body: false,
    };
    factory_from_body(body, ctx)
}

/// The factory an initializer defines under its binding name: an arrow or function expression.
pub fn factory_from_expression(
    name: &str,
    expression: &Expression<'_>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => factory_from_arrow(name, arrow, ctx),
        Expression::FunctionExpression(function) => {
            let Some(body) = function.body.as_ref() else {
                return Ok(None);
            };
            let body = FactoryBody {
                name,
                params: &function.params,
                statements: &body.statements,
                expression_body: false,
            };
            factory_from_body(body, ctx)
        }
        _ => Ok(None),
    }
}

fn factory_from_arrow(
    name: &str,
    arrow: &ArrowFunctionExpression<'_>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    let body = FactoryBody {
        name,
        params: &arrow.params,
        statements: &arrow.body.statements,
        expression_body: arrow.expression,
    };
    factory_from_body(body, ctx)
}

/// Build a factory from a body: the first returned expression that yields a component, with each
/// parameter the component renders rebound to that parameter's position.
fn factory_from_body(
    body: FactoryBody<'_>,
    ctx: &ParserContext,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    // Function-local bindings live in a scratch state: only the components they
    // name matter to the factory, and their links never reach the module's maps.
    let mut local = ParseState::default();
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
        &mut local,
    )?;
    collect_inner_components(body.statements, ctx, &mut local)?;

    let names = parameter_names(body.params);
    for statement in body.statements {
        let Some(product) = returned_expression(statement, body.expression_body) else {
            continue;
        };
        if let Some(component) = factory_product(product, &local.components, ctx)? {
            let component = bind_parameters(component, &names);
            return Ok(Some((body.name.to_string(), TraceFactory { component })));
        }
    }
    Ok(None)
}

/// Components declared as function declarations inside a body, so a factory can return one by name.
fn collect_inner_components(
    statements: &oxc_allocator::Vec<'_, Statement<'_>>,
    ctx: &ParserContext,
    local: &mut ParseState,
) -> Result<(), StyleTraceError> {
    for statement in statements {
        let Statement::FunctionDeclaration(function) = statement else {
            continue;
        };
        if let Some((name, component)) = component_from_function_declaration(function, ctx)? {
            local.components.insert(name, component);
        }
    }
    Ok(())
}

/// The expression a body statement hands back: a `return` argument, or the sole expression of an
/// expression-bodied arrow.
fn returned_expression<'a>(
    statement: &'a Statement<'a>,
    expression_body: bool,
) -> Option<&'a Expression<'a>> {
    match statement {
        Statement::ReturnStatement(return_statement) => return_statement.argument.as_ref(),
        Statement::ExpressionStatement(expression) if expression_body => {
            Some(&expression.expression)
        }
        _ => None,
    }
}

/// The component a returned expression yields: a local component by name, or an inline one.
fn factory_product(
    expression: &Expression<'_>,
    local: &FxHashMap<String, TraceComponent>,
    ctx: &ParserContext,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    if let Expression::Identifier(identifier) = expression {
        return Ok(local.get(identifier.name.as_str()).cloned());
    }
    component_from_expression("FactoryProduct", expression, ctx, BTreeSet::new())
}

/// Each positional parameter's name. A destructured or defaulted pattern names nothing, so it binds no edge.
fn parameter_names(params: &FormalParameters<'_>) -> Vec<String> {
    params
        .items
        .iter()
        .map(|param| match &param.pattern {
            BindingPattern::BindingIdentifier(identifier) => identifier.name.to_string(),
            _ => String::new(),
        })
        .collect()
}

/// Rebind each edge that renders one of the factory's parameters to that parameter's position.
fn bind_parameters(mut component: TraceComponent, names: &[String]) -> TraceComponent {
    for edge in &mut component.edges {
        let EdgeTarget::Local(name) = &edge.target else {
            continue;
        };
        if let Some(index) = names.iter().position(|param| param == name) {
            edge.target = EdgeTarget::Parameter(index);
        }
    }
    component
}

/// The factory call an expression makes, when its callee names a function: `callee(args...)`.
pub fn factory_call_from_expression<'a>(
    expression: &'a Expression<'a>,
    ctx: &ParserContext,
) -> Option<FactoryCall> {
    let Expression::CallExpression(call) = unwrap_transparent_expression(expression) else {
        return None;
    };
    let target = callee_target(&call.callee, ctx.imports)?;
    let args = call
        .arguments
        .iter()
        .map(|argument| argument_target(argument, ctx))
        .collect();
    Some(FactoryCall { target, args })
}

/// What a callee names: a local or imported function, or a member of a namespace import.
fn callee_target(
    callee: &Expression<'_>,
    imports: &FxHashMap<String, TraceImport>,
) -> Option<FactoryTarget> {
    match callee {
        Expression::Identifier(identifier) => {
            Some(identifier_callee(identifier.name.as_str(), imports))
        }
        Expression::StaticMemberExpression(member) => namespace_callee(member, imports),
        _ => None,
    }
}

fn identifier_callee(name: &str, imports: &FxHashMap<String, TraceImport>) -> FactoryTarget {
    match imports.get(name) {
        Some(binding) => FactoryTarget::Imported {
            source: binding.source.clone(),
            imported_name: binding.imported_name.clone(),
        },
        None => FactoryTarget::Local(name.to_string()),
    }
}

fn namespace_callee(
    member: &StaticMemberExpression<'_>,
    imports: &FxHashMap<String, TraceImport>,
) -> Option<FactoryTarget> {
    let Expression::Identifier(namespace) = &member.object else {
        return None;
    };
    let binding = imports
        .get(namespace.name.as_str())
        .filter(|binding| binding.is_namespace)?;
    Some(FactoryTarget::Imported {
        source: binding.source.clone(),
        imported_name: member.property.name.to_string(),
    })
}

/// The component an argument names, resolved in the calling module. Spreads and anything that is
/// not a component reference name none, so the call site leaves that parameter unresolved.
fn argument_target(argument: &Argument<'_>, ctx: &ParserContext) -> Option<EdgeTarget> {
    if matches!(argument, Argument::SpreadElement(_)) {
        return None;
    }
    match argument.to_expression() {
        Expression::Identifier(identifier) => identifier_target(
            identifier.name.as_str(),
            ctx.imports,
            &ctx.surface.primitives,
        ),
        Expression::StaticMemberExpression(member) => {
            let Expression::Identifier(namespace) = &member.object else {
                return None;
            };
            handle_namespace_target(
                namespace.name.as_str(),
                member.property.name.as_str(),
                ctx.imports,
                &ctx.surface.primitives,
            )
        }
        _ => None,
    }
}
