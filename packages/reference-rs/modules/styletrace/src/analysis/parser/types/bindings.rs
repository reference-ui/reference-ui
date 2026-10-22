//! Derives the prop bindings a component reads from its props parameter and its top-level body.
//! It takes the first formal parameter, the body statements and the wrapper props, and emits a `PropBindings` that names the props object, destructured locals and rest spreads.
//! The body scan is one-hop and additive: it stops at the first rebinding or shadowing of the props identifier. An object-pattern parameter's rest binding is that identifier when the rest carries StyleProps.

use super::super::context::ParserContext;
use super::resolve::{resolve_owned_prop_names, resolve_style_props_from_type_annotation};
use super::unwrap_transparent_expression;
use crate::analysis::model::{PropBindings, WrapperProps};
use crate::analysis::util::{
    is_identifier, parse_object_pattern_bindings, parse_object_pattern_rest, slice_span,
};
use crate::resolver::StyleTraceError;
use oxc_ast::ast::{AssignmentTarget, BindingPattern, Expression, FormalParameter, Statement};
use oxc_span::GetSpan;
use std::collections::BTreeSet;

pub fn parse_prop_bindings(
    first_param: Option<&FormalParameter<'_>>,
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    ctx: &ParserContext,
    wrapper: WrapperProps,
) -> Result<PropBindings, StyleTraceError> {
    let Some(param) = first_param else {
        return Ok(PropBindings::default());
    };

    // A forwardRef generic declares the props its unannotated inner function destructures, so its
    // owned names seed the bindings; an annotation on the parameter adds to them.
    let WrapperProps {
        style_props: mut resolved_style_props,
        owned_props,
    } = wrapper;
    let mut bindings = PropBindings {
        owned_props,
        ..PropBindings::default()
    };
    if let Some(annotation) = param.type_annotation.as_ref() {
        resolved_style_props.extend(resolve_style_props_from_type_annotation(
            ctx,
            &annotation.type_annotation,
        )?);
        bindings
            .owned_props
            .extend(resolve_owned_prop_names(ctx, &annotation.type_annotation)?);
    }
    let pattern_source = slice_span(ctx.source, param.pattern.span()).trim();
    if pattern_source.starts_with('{') {
        parse_object_bindings(pattern_source, ctx, &resolved_style_props, &mut bindings);
        // A carrying rest is the props object for the body, so a body re-destructure of it forwards too.
        let carrying_rest = parse_object_pattern_rest(pattern_source)
            .filter(|rest| bindings.spread_bindings.contains(rest));
        if let Some(rest_binding) = carrying_rest {
            collect_body_destructure_bindings(
                body_statements,
                BodyBindingScan {
                    props_name: &rest_binding,
                    ctx,
                    resolved_style_props: &resolved_style_props,
                    bindings: &mut bindings,
                },
            );
        }
        return Ok(bindings);
    }

    if is_identifier(pattern_source) {
        if !resolved_style_props.is_empty() {
            bindings
                .props_object_bindings
                .insert(pattern_source.to_string());
            bindings.spread_bindings.insert(pattern_source.to_string());
        }
        collect_body_destructure_bindings(
            body_statements,
            BodyBindingScan {
                props_name: pattern_source,
                ctx,
                resolved_style_props: &resolved_style_props,
                bindings: &mut bindings,
            },
        );
    }

    Ok(bindings)
}

/// Scan state for one-hop body binding collection.
struct BodyBindingScan<'a, 'b, 'c> {
    props_name: &'a str,
    ctx: &'a ParserContext<'b>,
    resolved_style_props: &'a BTreeSet<String>,
    bindings: &'c mut PropBindings,
}

/// Collects one-hop body bindings (`const { x } = props`,
/// `const { a, ...rest } = props`) sourced directly on the props identifier:
/// the parameter itself, or the carrying rest of an object-pattern parameter.
/// Top-level statements only; the scan halts at the first
/// rebinding or shadowing of `props` (or a collected local) rather than
/// chasing it. Additive only: names are gained, never removed.
fn collect_body_destructure_bindings(
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    mut scan: BodyBindingScan<'_, '_, '_>,
) {
    let Some(statements) = body_statements else {
        return;
    };
    for statement in statements {
        if statement_ends_body_scan(statement, scan.props_name, scan.bindings) {
            break;
        }
        let Statement::VariableDeclaration(declaration) = statement else {
            continue;
        };
        for declarator in &declaration.declarations {
            collect_body_declarator(declarator, &mut scan);
        }
    }
}

fn collect_body_declarator(
    declarator: &oxc_ast::ast::VariableDeclarator<'_>,
    scan: &mut BodyBindingScan<'_, '_, '_>,
) {
    let Some(init) = declarator.init.as_ref() else {
        return;
    };
    if !expression_is_props_identifier(init, scan.props_name) {
        return;
    }
    let pattern_source = slice_span(scan.ctx.source, declarator.id.span()).trim();
    if pattern_source.starts_with('{') {
        parse_object_bindings(
            pattern_source,
            scan.ctx,
            scan.resolved_style_props,
            scan.bindings,
        );
    }
}

/// Precision guard: a top-level statement ends the body scan when it shadows
/// or rebinds the props identifier or an already-collected local.
fn statement_ends_body_scan(
    statement: &Statement<'_>,
    props_name: &str,
    bindings: &PropBindings,
) -> bool {
    match statement {
        Statement::VariableDeclaration(declaration) => {
            declaration.declarations.iter().any(|declarator| {
                declarator_rebinds_guard(declarator, props_name, bindings)
            })
        }
        Statement::FunctionDeclaration(function) => function
            .id
            .as_ref()
            .is_some_and(|id| name_is_guarded(id.name.as_str(), props_name, bindings)),
        Statement::ExpressionStatement(expression) => assigned_identifier_name(&expression.expression)
            .is_some_and(|name| name_is_guarded(name, props_name, bindings)),
        _ => false,
    }
}

fn name_is_guarded(name: &str, props_name: &str, bindings: &PropBindings) -> bool {
    name == props_name
        || bindings.direct_style_bindings.contains(name)
        || bindings.spread_bindings.contains(name)
}

fn declarator_rebinds_guard(
    declarator: &oxc_ast::ast::VariableDeclarator<'_>,
    props_name: &str,
    bindings: &PropBindings,
) -> bool {
    let mut names = Vec::new();
    collect_pattern_names(&declarator.id, &mut names);
    names
        .iter()
        .any(|name| name_is_guarded(name, props_name, bindings))
}

fn collect_pattern_names<'a>(pattern: &'a BindingPattern<'a>, out: &mut Vec<&'a str>) {
    match pattern {
        BindingPattern::BindingIdentifier(identifier) => out.push(identifier.name.as_str()),
        BindingPattern::ObjectPattern(object) => collect_object_pattern_names(object, out),
        BindingPattern::ArrayPattern(array) => collect_array_pattern_names(array, out),
        BindingPattern::AssignmentPattern(assignment) => {
            collect_pattern_names(&assignment.left, out)
        }
    }
}

fn collect_object_pattern_names<'a>(
    object: &'a oxc_ast::ast::ObjectPattern<'a>,
    out: &mut Vec<&'a str>,
) {
    for property in &object.properties {
        collect_pattern_names(&property.value, out);
    }
    if let Some(rest) = &object.rest {
        collect_pattern_names(&rest.argument, out);
    }
}

fn collect_array_pattern_names<'a>(
    array: &'a oxc_ast::ast::ArrayPattern<'a>,
    out: &mut Vec<&'a str>,
) {
    for element in array.elements.iter().flatten() {
        collect_pattern_names(element, out);
    }
    if let Some(rest) = &array.rest {
        collect_pattern_names(&rest.argument, out);
    }
}

fn assigned_identifier_name<'a>(expression: &'a Expression<'a>) -> Option<&'a str> {
    let Expression::AssignmentExpression(assignment) = expression else {
        return None;
    };
    let AssignmentTarget::AssignmentTargetIdentifier(identifier) = &assignment.left else {
        return None;
    };
    Some(identifier.name.as_str())
}

fn expression_is_props_identifier(expression: &Expression<'_>, props_name: &str) -> bool {
    matches!(
        unwrap_transparent_expression(expression),
        Expression::Identifier(identifier) if identifier.name.as_str() == props_name
    )
}

fn parse_object_bindings(
    pattern_source: &str,
    ctx: &ParserContext,
    resolved_style_props: &BTreeSet<String>,
    bindings: &mut PropBindings,
) {
    let destructured = parse_object_pattern_bindings(pattern_source);
    bindings.record_destructured(&destructured);
    let explicit_style_props = destructured
        .iter()
        .filter(|binding| resolved_style_props.contains(&binding.prop_name))
        .map(|binding| binding.local_name.clone())
        .collect::<BTreeSet<_>>();

    if explicit_style_props.is_empty() {
        for binding in &destructured {
            if ctx.surface.style_props.contains(&binding.prop_name) {
                bindings
                    .direct_style_bindings
                    .insert(binding.local_name.clone());
            }
        }
    } else {
        bindings.direct_style_bindings.extend(explicit_style_props);
    }

    if let Some(rest_binding) = parse_object_pattern_rest(pattern_source) {
        let explicitly_named_props = destructured
            .iter()
            .map(|binding| binding.prop_name.clone())
            .collect::<BTreeSet<_>>();
        if resolved_style_props
            .iter()
            .any(|name| !explicitly_named_props.contains(name))
        {
            bindings.spread_bindings.insert(rest_binding);
        }
    }
}
