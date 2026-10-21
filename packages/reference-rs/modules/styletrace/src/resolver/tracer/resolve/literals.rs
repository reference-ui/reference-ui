//! Literal-key pass of the tracer: expands a type expression into the string keys it can take.
//! Union literals, `keyof` targets, mapped key sources and indexed access on a mapped type all contribute keys.
//! It takes the trace context with a type expression, and emits the union of reachable literal names; object members never count as keys.

use std::collections::BTreeSet;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::TypeExpr;

use super::super::builtins::resolve_builtin_literals;
use super::super::context::{is_surface_type_name, TraceContext};
use super::decls::{resolve_decl_literals_into, DeclTarget};
use super::{resolve_prop_names_into, take_or_extend, take_or_extend_owned};

pub(in crate::resolver::tracer) fn resolve_literal_names(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    resolve_literal_names_into(ctx, expr, &mut names)?;
    Ok(names)
}

pub(super) fn resolve_literal_names_into(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match expr {
        TypeExpr::UnionLiterals(values) => {
            take_or_extend(names, values);
            Ok(())
        }
        TypeExpr::Keyof(target) => resolve_prop_names_into(ctx, target, names),
        TypeExpr::Intersection(types) | TypeExpr::Union(types) => {
            resolve_combined_literals_into(ctx, types, names)
        }
        TypeExpr::Reference { .. } | TypeExpr::Mapped { .. } => {
            resolve_reference_mapped_literals_into(ctx, expr, names)
        }
        TypeExpr::Unknown
        | TypeExpr::Object(_)
        | TypeExpr::IndexedAccess { .. }
        | TypeExpr::Conditional { .. } => resolve_computed_literals_into(ctx, expr, names),
    }
}

/// Named references and mapped key sources; `resolve_literal_names_into` sends only these here.
fn resolve_reference_mapped_literals_into(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match expr {
        TypeExpr::Reference { name, args } => {
            resolve_reference_expr_literals_into(ctx, name, args, names)
        }
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names_into(ctx, key_source, names),
        _ => unreachable!("resolve_literal_names_into routes only reference and mapped forms here"),
    }
}

/// Indexed access, conditional, unknown and object forms; the router sends only these here.
fn resolve_computed_literals_into(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match expr {
        TypeExpr::IndexedAccess { object, index } => {
            resolve_indexed_access_literals_into(ctx, object, index, names)
        }
        TypeExpr::Conditional {
            true_type,
            false_type,
        } => {
            resolve_literal_names_into(ctx, true_type, names)?;
            resolve_literal_names_into(ctx, false_type, names)
        }
        // Unknown and object members never count as literal keys.
        TypeExpr::Unknown | TypeExpr::Object(_) => Ok(()),
        _ => unreachable!("resolve_literal_names_into routes only computed forms here"),
    }
}

fn resolve_combined_literals_into(
    ctx: &mut TraceContext<'_>,
    types: &[TypeExpr],
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    for nested in types {
        resolve_literal_names_into(ctx, nested, names)?;
    }
    Ok(())
}

fn resolve_reference_expr_literals_into(
    ctx: &mut TraceContext<'_>,
    name: &str,
    args: &[TypeExpr],
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    if ctx.session.prune_surface && is_surface_type_name(name) {
        return Ok(());
    }
    if let Some(builtin) = resolve_builtin_literals(ctx, name, args)? {
        take_or_extend_owned(names, builtin);
        return Ok(());
    }

    if let Some(bound) = ctx.env.get(name) {
        let mut next_ctx = ctx.branch(&bound.module_path, &bound.env);
        return resolve_literal_names_into(&mut next_ctx, &bound.expr, names);
    }

    match ctx.resolve_declaration(ctx.module_path, name)? {
        Some((resolved_module, declaration)) => {
            let target = DeclTarget::new(&resolved_module, &declaration, args);
            resolve_decl_literals_into(ctx, &target, names)
        }
        None => Ok(()),
    }
}

fn resolve_indexed_access_literals_into(
    ctx: &mut TraceContext<'_>,
    object: &TypeExpr,
    index: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    let _ = resolve_literal_names(ctx, index)?;
    match object {
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names_into(ctx, key_source, names),
        // Only a mapped object contributes keys; other object forms add none.
        TypeExpr::Unknown
        | TypeExpr::Object(_)
        | TypeExpr::Intersection(_)
        | TypeExpr::UnionLiterals(_)
        | TypeExpr::Union(_)
        | TypeExpr::Reference { .. }
        | TypeExpr::IndexedAccess { .. }
        | TypeExpr::Keyof(_)
        | TypeExpr::Conditional { .. } => Ok(()),
    }
}
