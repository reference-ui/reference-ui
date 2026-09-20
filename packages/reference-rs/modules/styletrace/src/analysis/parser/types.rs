//! Data structures and type definitions for parsing the module.
//! Contains context structs and state objects used during AST traversal.
//! It takes raw AST state and provides grouped contextual information.
//! These structures help avoid parameter soup during deeply nested walking.

// Handles extraction of style properties and type bindings.
//! Provides utilities to parse prop bindings and resolve styled typings.
//! Connects TypeScript typings to the component prop model.

use super::context::ParserContext;
use crate::analysis::model::PropBindings;
use crate::analysis::util::{
    is_identifier, parse_object_pattern_bindings, parse_object_pattern_rest, slice_span,
};
use crate::resolver::{collect_declared_prop_names, collect_style_prop_names, StyleTraceError};
use oxc_ast::ast::{
    AssignmentTarget, BindingPattern, Expression, FormalParameter, Statement, TSType,
};
use oxc_span::GetSpan;
use std::collections::BTreeSet;

pub fn parse_prop_bindings(
    first_param: Option<&FormalParameter<'_>>,
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    ctx: &ParserContext,
    wrapper_style_props: BTreeSet<String>,
) -> Result<PropBindings, StyleTraceError> {
    let Some(param) = first_param else {
        return Ok(PropBindings::default());
    };

    let mut resolved_style_props = if wrapper_style_props.is_empty() {
        BTreeSet::new()
    } else {
        wrapper_style_props
    };

    let mut bindings = PropBindings::default();
    if let Some(annotation) = param.type_annotation.as_ref() {
        resolved_style_props.extend(resolve_style_props_from_type_annotation(
            ctx,
            &annotation.type_annotation,
        )?);
        bindings.owned_props = resolve_owned_prop_names(ctx, &annotation.type_annotation)?;
    }
    let pattern_source = slice_span(ctx.source, param.pattern.span()).trim();
    if pattern_source.starts_with('{') {
        parse_object_bindings(pattern_source, ctx, &resolved_style_props, &mut bindings);
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
/// `const { a, ...rest } = props`) sourced directly on the props parameter
/// identifier. Top-level statements only; the scan halts at the first
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

fn unwrap_transparent_expression<'a>(expression: &'a Expression<'a>) -> &'a Expression<'a> {
    match expression {
        Expression::ParenthesizedExpression(parenthesized) => {
            unwrap_transparent_expression(&parenthesized.expression)
        }
        Expression::TSAsExpression(asserted) => unwrap_transparent_expression(&asserted.expression),
        Expression::TSSatisfiesExpression(asserted) => {
            unwrap_transparent_expression(&asserted.expression)
        }
        Expression::TSTypeAssertion(asserted) => {
            unwrap_transparent_expression(&asserted.expression)
        }
        Expression::TSNonNullExpression(asserted) => {
            unwrap_transparent_expression(&asserted.expression)
        }
        _ => expression,
    }
}

fn parse_object_bindings(
    pattern_source: &str,
    ctx: &ParserContext,
    resolved_style_props: &BTreeSet<String>,
    bindings: &mut PropBindings,
) {
    let destructured = parse_object_pattern_bindings(pattern_source);
    // Every pulled-out prop name, style or not: the §14 shadow keeps only
    // these, so quoted keys normalize like the type side does.
    bindings.destructured_prop_names.extend(
        destructured
            .iter()
            .map(|binding| binding.prop_name.trim_matches(['"', '\'']).to_string()),
    );
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

pub fn wrapper_style_props_from_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    ctx: &ParserContext,
) -> Result<BTreeSet<String>, StyleTraceError> {
    wrapper_style_props_from_type_arguments(
        ctx,
        call.type_arguments
            .as_ref()
            .and_then(|instantiation| instantiation.params.iter().nth(1)),
    )
}

pub fn wrapper_style_props_from_type_arguments(
    ctx: &ParserContext,
    ts_type: Option<&TSType<'_>>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match ts_type {
        Some(ts_type) => resolve_style_props_from_type_annotation(ctx, ts_type),
        None => Ok(BTreeSet::new()),
    }
}

fn resolve_style_props_from_type_annotation(
    ctx: &ParserContext,
    type_annotation: &TSType<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match type_annotation {
        TSType::TSTypeReference(reference) => resolve_type_reference(ctx, reference),
        TSType::TSTypeLiteral(type_literal) => resolve_type_literal(ctx, type_literal),
        TSType::TSIntersectionType(intersection) => resolve_intersection_type(ctx, intersection),
        TSType::TSParenthesizedType(parenthesized) => {
            resolve_style_props_from_type_annotation(ctx, &parenthesized.type_annotation)
        }
        _ => Ok(BTreeSet::new()),
    }
}

fn resolve_type_reference(
    ctx: &ParserContext,
    reference: &oxc_ast::ast::TSTypeReference<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let fallback = ctx
        .surface
        .trusts_surface_type_names()
        .then(|| &ctx.surface.style_props);
    Ok(collect_style_prop_names(
        ctx.workspace_root,
        ctx.path,
        slice_span(ctx.source, reference.type_name.span()),
        fallback,
    )?
    .into_iter()
    .filter(|name| ctx.surface.style_props.contains(name))
    .collect())
}

fn resolve_type_literal(
    ctx: &ParserContext,
    type_literal: &oxc_ast::ast::TSTypeLiteral<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    Ok(type_literal
        .members
        .iter()
        .filter_map(|member| match member {
            oxc_ast::ast::TSSignature::TSPropertySignature(property) => {
                let name = slice_span(ctx.source, property.key.span())
                    .trim_matches('"')
                    .trim_matches('\'');
                ctx.surface
                    .style_props
                    .contains(name)
                    .then(|| name.to_string())
            }
            _ => None,
        })
        .collect())
}

fn resolve_intersection_type(
    ctx: &ParserContext,
    intersection: &oxc_ast::ast::TSIntersectionType<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    for nested in &intersection.types {
        names.extend(resolve_style_props_from_type_annotation(ctx, nested)?);
    }
    Ok(names)
}

/// The host's own declared prop names: every member of its props type
/// except names contributed through the surface types. Own-literal
/// collisions with style props (`size`, `weight`) stay owned — that is
/// the §14 shadow — while `StyleProps` / `PrimitiveProps` references
/// prune inside the resolver, so `color` keeps extracting. The shadow
/// later keeps only destructured names: forwarded members ride the
/// props/rest spread and the call site mints them.
fn resolve_owned_prop_names(
    ctx: &ParserContext,
    type_annotation: &TSType<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match type_annotation {
        TSType::TSTypeReference(reference) => resolve_owned_type_reference(ctx, reference),
        TSType::TSTypeLiteral(type_literal) => resolve_owned_type_literal(ctx, type_literal),
        TSType::TSIntersectionType(intersection) => {
            resolve_owned_intersection_type(ctx, intersection)
        }
        TSType::TSParenthesizedType(parenthesized) => {
            resolve_owned_prop_names(ctx, &parenthesized.type_annotation)
        }
        _ => Ok(BTreeSet::new()),
    }
}

fn resolve_owned_type_reference(
    ctx: &ParserContext,
    reference: &oxc_ast::ast::TSTypeReference<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    Ok(collect_declared_prop_names(
        ctx.workspace_root,
        ctx.path,
        slice_span(ctx.source, reference.type_name.span()),
    )?
    .into_iter()
    .collect())
}

fn resolve_owned_type_literal(
    ctx: &ParserContext,
    type_literal: &oxc_ast::ast::TSTypeLiteral<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    Ok(type_literal
        .members
        .iter()
        .filter_map(|member| match member {
            oxc_ast::ast::TSSignature::TSPropertySignature(property) => {
                let name = slice_span(ctx.source, property.key.span())
                    .trim_matches('"')
                    .trim_matches('\'');
                Some(name.to_string())
            }
            _ => None,
        })
        .collect())
}

fn resolve_owned_intersection_type(
    ctx: &ParserContext,
    intersection: &oxc_ast::ast::TSIntersectionType<'_>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    for nested in &intersection.types {
        names.extend(resolve_owned_prop_names(ctx, nested)?);
    }
    Ok(names)
}
