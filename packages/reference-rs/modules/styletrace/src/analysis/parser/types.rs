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
use crate::resolver::{collect_style_prop_names, StyleTraceError};
use oxc_ast::ast::{FormalParameter, TSType};
use oxc_span::GetSpan;
use std::collections::BTreeSet;

pub fn parse_prop_bindings(
    first_param: Option<&FormalParameter<'_>>,
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

    if let Some(annotation) = param.type_annotation.as_ref() {
        resolved_style_props.extend(resolve_style_props_from_type_annotation(
            ctx,
            &annotation.type_annotation,
        )?);
    }

    let mut bindings = PropBindings::default();
    let pattern_source = slice_span(ctx.source, param.pattern.span()).trim();
    if pattern_source.starts_with('{') {
        parse_object_bindings(pattern_source, ctx, &resolved_style_props, &mut bindings);
        return Ok(bindings);
    }

    if is_identifier(pattern_source) && !resolved_style_props.is_empty() {
        bindings
            .props_object_bindings
            .insert(pattern_source.to_string());
        bindings.spread_bindings.insert(pattern_source.to_string());
    }

    Ok(bindings)
}

fn parse_object_bindings(
    pattern_source: &str,
    ctx: &ParserContext,
    resolved_style_props: &BTreeSet<String>,
    bindings: &mut PropBindings,
) {
    let destructured = parse_object_pattern_bindings(pattern_source);
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
