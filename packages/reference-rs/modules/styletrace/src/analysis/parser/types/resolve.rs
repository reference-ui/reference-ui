//! Resolves TypeScript prop types into the style-prop and owned-prop names of wrappers and components.
//! It takes a `TSType` annotation (a reference, a literal or an intersection) from a props parameter or a wrapper type argument.
//! It emits `WrapperProps` for higher-order type arguments, and owned prop names that the shadow check later filters.
//! Each prop-type trace's lossy guard-limit cuts go on the module's type-cut sink for the report.

use super::super::context::ParserContext;
use crate::analysis::model::WrapperProps;
use crate::analysis::util::slice_span;
use crate::resolver::{
    collect_declared_prop_names, collect_style_prop_names, SurfaceTrust, StyleTraceError,
};
use oxc_ast::ast::TSType;
use oxc_span::GetSpan;
use std::collections::BTreeSet;

pub fn wrapper_props_from_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    ctx: &ParserContext,
) -> Result<WrapperProps, StyleTraceError> {
    wrapper_props_from_type_arguments(
        ctx,
        call.type_arguments
            .as_ref()
            .and_then(|instantiation| instantiation.params.get(1)),
    )
}

pub fn wrapper_props_from_type_arguments(
    ctx: &ParserContext,
    ts_type: Option<&TSType<'_>>,
) -> Result<WrapperProps, StyleTraceError> {
    let Some(ts_type) = ts_type else {
        return Ok(WrapperProps::default());
    };
    Ok(WrapperProps {
        style_props: resolve_style_props_from_type_annotation(ctx, ts_type)?,
        owned_props: resolve_owned_prop_names(ctx, ts_type)?,
    })
}

pub(super) fn resolve_style_props_from_type_annotation(
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
    let trust = ctx.surface.trusts_surface_type_names().then_some(SurfaceTrust {
        style_props: &ctx.surface.style_props,
        primitives: &ctx.surface.primitives,
    });
    let traced = collect_style_prop_names(
        ctx.workspace_root,
        ctx.path,
        slice_span(ctx.source, reference.type_name.span()),
        trust,
    )?;
    ctx.note_type_cuts(traced.cuts);
    Ok(traced
        .names
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
/// later keeps only destructured names the body does not pass on under
/// their own name: forwarded members ride the props/rest spread or an
/// attribute of the same name, and the call site mints them.
pub(super) fn resolve_owned_prop_names(
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
    let traced = collect_declared_prop_names(
        ctx.workspace_root,
        ctx.path,
        slice_span(ctx.source, reference.type_name.span()),
    )?;
    ctx.note_type_cuts(traced.cuts);
    Ok(traced.names.into_iter().collect())
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
