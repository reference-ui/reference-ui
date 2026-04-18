use super::jsx::statements_contain_jsx;
use super::utils::{reference_name, slice_span};
use super::ModuleParseState;
use crate::atlas::internal::{ComponentDecl, PropsAnnotation};
use oxc_ast::ast::{
    Argument, BindingPattern, CallExpression, Expression, FormalParameter, Statement, TSType,
    TSTypeParameterInstantiation,
};
use oxc_span::GetSpan;
use std::path::Path;

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
    let props_type = type_arguments.params.iter().nth(1)?;
    let props = parse_type_reference(source, props_type);
    if matches!(props, PropsAnnotation::None) {
        return None;
    }
    Some(props)
}

fn wrapper_props_from_call(call: &CallExpression<'_>, source: &str) -> Option<PropsAnnotation> {
    parse_wrapper_type_arguments(call.type_arguments.as_deref(), source).or_else(|| {
        match &call.callee {
            Expression::TSInstantiationExpression(instantiated) => {
                parse_wrapper_type_arguments(Some(instantiated.type_arguments.as_ref()), source)
            }
            _ => None,
        }
    })
}
pub(super) fn collect_variable_components<'a, I>(
    declarators: I,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
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
        if let Some(component) = component_from_expression(
            &name,
            init,
            file_path,
            display_source,
            app_relative_path,
            source,
        ) {
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
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    let name = function.id.as_ref()?.name.to_string();
    component_from_function_like(
        &name,
        function.params.items.first(),
        function.body.as_ref().map(|body| &body.statements),
        file_path,
        display_source,
        app_relative_path,
        source,
    )
}

pub(super) fn component_from_expression(
    name: &str,
    expression: &Expression<'_>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => component_from_arrow(
            name,
            arrow,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::FunctionExpression(function) => component_from_function_like(
            name,
            function.params.items.first(),
            function.body.as_ref().map(|body| &body.statements),
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::ParenthesizedExpression(parenthesized) => component_from_expression(
            name,
            &parenthesized.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSAsExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSSatisfiesExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSTypeAssertion(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSNonNullExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSInstantiationExpression(instantiated) => apply_wrapper_props(
            component_from_expression(
                name,
                &instantiated.expression,
                file_path,
                display_source,
                app_relative_path,
                source,
            ),
            parse_wrapper_type_arguments(Some(instantiated.type_arguments.as_ref()), source),
        ),
        Expression::CallExpression(call) => {
            let wrapper_props = wrapper_props_from_call(call, source);
            call.arguments.iter().find_map(|argument| match argument {
                Argument::SpreadElement(_) => None,
                _ => apply_wrapper_props(
                    component_from_expression(
                        name,
                        argument.to_expression(),
                        file_path,
                        display_source,
                        app_relative_path,
                        source,
                    ),
                    wrapper_props.clone(),
                ),
            })
        }
        _ => None,
    }
}

pub(super) fn component_from_arrow(
    name: &str,
    arrow: &oxc_allocator::Box<'_, oxc_ast::ast::ArrowFunctionExpression<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    component_from_function_like(
        name,
        arrow.params.items.first(),
        Some(&arrow.body.statements),
        file_path,
        display_source,
        app_relative_path,
        source,
    )
}

pub(super) fn component_from_function_like(
    name: &str,
    first_param: Option<&FormalParameter<'_>>,
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    if !is_component_name(name) {
        return None;
    }
    let Some(body_statements) = body_statements else {
        return None;
    };
    if !statements_contain_jsx(body_statements) {
        return None;
    }

    Some(ComponentDecl {
        name: name.to_string(),
        file_path: file_path.to_path_buf(),
        source_display: display_source.to_string(),
        app_relative_path: app_relative_path.cloned(),
        props: parse_props_annotation(first_param, source),
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
