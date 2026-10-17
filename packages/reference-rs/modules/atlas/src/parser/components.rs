//! Recognises React components among a module's declarations and expressions. A candidate has a PascalCase
//! name and a body that returns JSX; its props come from the first parameter's type annotation, and a wrapper
//! call such as `memo<...>(...)` or `forwardRef<..., P>(...)` supplies props when the component names none.
//! It takes the declaration or expression node plus the file context, and emits an optional `ComponentDecl`
//! stamped with that context.

use super::jsx::statements_contain_jsx;
use super::utils::{reference_name, slice_span};
use super::{FileCtx, ModuleParseState};
use crate::internal::{wrapped_expression, ComponentDecl, PropsAnnotation};
use oxc_ast::ast::{
    Argument, ArrowFunctionExpression, BindingPattern, CallExpression, Expression, Function,
    FormalParameter, Statement, TSType, TSTypeParameterInstantiation,
};
use oxc_span::GetSpan;

fn apply_wrapper_props(
    component: Option<ComponentDecl>,
    wrapper_props: Option<PropsAnnotation>,
) -> Option<ComponentDecl> {
    component.map(|mut value| {
        if matches!(value.props, PropsAnnotation::None) {
            if let Some(props) = wrapper_props {
                value.props = props;
            }
        }
        value
    })
}

fn parse_type_reference(source: &str, ts_type: &TSType<'_>) -> PropsAnnotation {
    match ts_type {
        TSType::TSTypeReference(reference) => PropsAnnotation::Named(reference_name(slice_span(
            source,
            reference.type_name.span(),
        ))),
        TSType::TSTypeLiteral(_) => PropsAnnotation::InlineObject,
        _ => PropsAnnotation::None,
    }
}

fn parse_wrapper_type_arguments(
    type_arguments: Option<&TSTypeParameterInstantiation<'_>>,
    source: &str,
) -> Option<PropsAnnotation> {
    let type_arguments = type_arguments?;
    let props_type = type_arguments.params.get(1)?;
    let props = parse_type_reference(source, props_type);
    if matches!(props, PropsAnnotation::None) {
        return None;
    }
    Some(props)
}

fn wrapper_props_from_call(call: &CallExpression<'_>, source: &str) -> Option<PropsAnnotation> {
    parse_wrapper_type_arguments(call.type_arguments.as_deref(), source).or_else(|| match &call.callee {
        Expression::TSInstantiationExpression(instantiated) => {
            parse_wrapper_type_arguments(Some(instantiated.type_arguments.as_ref()), source)
        }
        _ => None,
    })
}

pub(super) fn collect_variable_components<'a, I>(
    declarators: I,
    ctx: &FileCtx<'_>,
    state: &mut ModuleParseState,
    export_all: bool,
) where
    I: IntoIterator<Item = &'a oxc_ast::ast::VariableDeclarator<'a>>,
{
    for declarator in declarators {
        let BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };
        let name = identifier.name.to_string();
        if let Some(component) = component_from_expression(&name, init, ctx) {
            state
                .local_components
                .insert(component.name.clone(), component.clone());
            if export_all {
                state
                    .exported_components
                    .insert(component.name.clone(), component);
            }
        }
    }
}

pub(super) fn component_from_function_declaration(
    function: &Function<'_>,
    ctx: &FileCtx<'_>,
) -> Option<ComponentDecl> {
    let name = function.id.as_ref()?.name.to_string();
    component_from_function(&name, function, ctx)
}

pub(super) fn component_from_function(
    name: &str,
    function: &Function<'_>,
    ctx: &FileCtx<'_>,
) -> Option<ComponentDecl> {
    component_from_function_like(
        name,
        function.params.items.first(),
        function.body.as_ref().map(|body| &body.statements),
        ctx,
    )
}

pub(super) fn component_from_expression(
    name: &str,
    expression: &Expression<'_>,
    ctx: &FileCtx<'_>,
) -> Option<ComponentDecl> {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => component_from_arrow(name, arrow, ctx),
        Expression::FunctionExpression(function) => component_from_function(name, function, ctx),
        Expression::TSInstantiationExpression(instantiated) => apply_wrapper_props(
            component_from_expression(name, &instantiated.expression, ctx),
            parse_wrapper_type_arguments(Some(instantiated.type_arguments.as_ref()), ctx.source),
        ),
        Expression::CallExpression(call) => component_from_call(name, call, ctx),
        _ => component_through_wrapper(name, expression, ctx),
    }
}

fn component_through_wrapper(
    name: &str,
    expression: &Expression<'_>,
    ctx: &FileCtx<'_>,
) -> Option<ComponentDecl> {
    let inner = wrapped_expression(expression)?;
    component_from_expression(name, inner, ctx)
}

fn component_from_call(name: &str, call: &CallExpression<'_>, ctx: &FileCtx<'_>) -> Option<ComponentDecl> {
    let wrapper_props = wrapper_props_from_call(call, ctx.source);
    call.arguments.iter().find_map(|argument| match argument {
        Argument::SpreadElement(_) => None,
        _ => apply_wrapper_props(
            component_from_expression(name, argument.to_expression(), ctx),
            wrapper_props.clone(),
        ),
    })
}

pub(super) fn component_from_arrow(
    name: &str,
    arrow: &ArrowFunctionExpression<'_>,
    ctx: &FileCtx<'_>,
) -> Option<ComponentDecl> {
    component_from_function_like(
        name,
        arrow.params.items.first(),
        Some(&arrow.body.statements),
        ctx,
    )
}

pub(super) fn component_from_function_like(
    name: &str,
    first_param: Option<&FormalParameter<'_>>,
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    ctx: &FileCtx<'_>,
) -> Option<ComponentDecl> {
    if !is_component_name(name) {
        return None;
    }
    let body_statements = body_statements?;
    if !statements_contain_jsx(body_statements) {
        return None;
    }

    Some(ComponentDecl {
        name: name.to_string(),
        file_path: ctx.file_path.to_path_buf(),
        source_display: ctx.display_source.to_string(),
        app_relative_path: ctx.app_relative_path.cloned(),
        props: parse_props_annotation(first_param, ctx.source),
    })
}

fn parse_props_annotation(param: Option<&FormalParameter<'_>>, source: &str) -> PropsAnnotation {
    let Some(param) = param else {
        return PropsAnnotation::None;
    };
    let Some(annotation) = param.type_annotation.as_ref() else {
        return PropsAnnotation::None;
    };
    parse_type_reference(source, &annotation.type_annotation)
}

fn is_component_name(name: &str) -> bool {
    name.chars()
        .next()
        .map(|ch| ch.is_ascii_uppercase())
        .unwrap_or(false)
}
