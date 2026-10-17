//! Core property pass of the tracer: resolves a reference or type expression into the style-prop names it reaches.
//! Literal-key expansion lives in `resolve/literals.rs` and declaration expansion in `resolve/decls.rs`, and both feed back here.
//! It takes the trace context with a type reference or expression, and emits the sorted set of prop names; built-in utility types are delegated to `builtins`.

mod decls;
mod literals;

use std::collections::BTreeSet;
use std::path::Path;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::TypeExpr;

use super::builtins::resolve_builtin_props;
use super::context::{is_surface_type_name, TraceContext};
use decls::{resolve_decl_props, resolve_decl_props_into, DeclTarget};
use literals::resolve_literal_names_into;

pub(super) use literals::resolve_literal_names;

pub fn resolve_reference_props(
    ctx: &mut TraceContext<'_>,
    module_path: &Path,
    name: &str,
) -> Result<BTreeSet<String>, StyleTraceError> {
    if ctx.session.prune_surface && is_surface_type_name(name) {
        return Ok(BTreeSet::new());
    }
    if let Some(bound) = ctx.env.get(name) {
        let mut next_ctx = ctx.branch(&bound.module_path, ctx.env);
        return resolve_prop_names(&mut next_ctx, &bound.expr);
    }

    let visit_key = format!("{}::{name}", module_path.display());
    if !ctx.visited.insert(visit_key.clone()) {
        return Ok(BTreeSet::new());
    }

    let result = match ctx.resolve_declaration(module_path, name)? {
        Some((resolved_module, declaration)) => {
            let mut next_ctx = ctx.branch(module_path, ctx.env);
            resolve_decl_props(&mut next_ctx, &resolved_module, &declaration, &[])
        }
        None => Ok(BTreeSet::new()),
    };

    ctx.visited.remove(&visit_key);
    result
}

pub fn resolve_prop_names(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    resolve_prop_names_into(ctx, expr, &mut names)?;
    Ok(names)
}

fn resolve_prop_names_into(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match expr {
        TypeExpr::Object(props) => {
            take_or_extend(names, props);
            Ok(())
        }
        // A name usable in either branch counts as a style prop, like conditional branches.
        TypeExpr::Intersection(types) | TypeExpr::Union(types) => {
            resolve_combined_props_into(ctx, types, names)
        }
        TypeExpr::Reference { name, args } => {
            resolve_reference_expr_props_into(ctx, name, args, names)
        }
        TypeExpr::IndexedAccess { .. } | TypeExpr::Mapped { .. } | TypeExpr::Conditional { .. } => {
            resolve_computed_props_into(ctx, expr, names)
        }
        // Unknown and literal unions name no props; `keyof` names keys, not props.
        TypeExpr::Unknown | TypeExpr::UnionLiterals(_) | TypeExpr::Keyof(_) => Ok(()),
    }
}

/// Indexed access, mapped and conditional forms; `resolve_prop_names_into` sends only these here.
fn resolve_computed_props_into(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match expr {
        TypeExpr::IndexedAccess { object, .. } => {
            resolve_indexed_access_props_into(ctx, object, names)
        }
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names_into(ctx, key_source, names),
        TypeExpr::Conditional {
            true_type,
            false_type,
        } => {
            resolve_prop_names_into(ctx, true_type, names)?;
            resolve_prop_names_into(ctx, false_type, names)
        }
        _ => unreachable!("resolve_prop_names_into routes only computed forms here"),
    }
}

fn resolve_combined_props_into(
    ctx: &mut TraceContext<'_>,
    types: &[TypeExpr],
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    for nested in types {
        resolve_prop_names_into(ctx, nested, names)?;
    }
    Ok(())
}

fn resolve_reference_expr_props_into(
    ctx: &mut TraceContext<'_>,
    name: &str,
    args: &[TypeExpr],
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    if ctx.session.prune_surface && is_surface_type_name(name) {
        return Ok(());
    }
    if let Some(builtin) = resolve_builtin_props(ctx, name, args)? {
        take_or_extend_owned(names, builtin);
        return Ok(());
    }

    if let Some(bound) = ctx.env.get(name) {
        let mut next_ctx = ctx.branch(&bound.module_path, ctx.env);
        return resolve_prop_names_into(&mut next_ctx, &bound.expr, names);
    }

    match ctx.resolve_declaration(ctx.module_path, name)? {
        Some((resolved_module, declaration)) => {
            let target = DeclTarget::new(&resolved_module, &declaration, args);
            resolve_decl_props_into(ctx, &target, names)
        }
        None => Ok(()),
    }
}

fn resolve_indexed_access_props_into(
    ctx: &mut TraceContext<'_>,
    object: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match object {
        TypeExpr::Mapped { value_type, .. } => resolve_prop_names_into(ctx, value_type, names),
        // Any other object form is walked as written.
        TypeExpr::Unknown
        | TypeExpr::Object(_)
        | TypeExpr::Intersection(_)
        | TypeExpr::UnionLiterals(_)
        | TypeExpr::Union(_)
        | TypeExpr::Reference { .. }
        | TypeExpr::IndexedAccess { .. }
        | TypeExpr::Keyof(_)
        | TypeExpr::Conditional { .. } => resolve_prop_names_into(ctx, object, names),
    }
}

/// Merge a stored set into the accumulator: structural clone when empty
/// (single-path cost, as before), per-element inserts otherwise (no temp set).
fn take_or_extend(names: &mut BTreeSet<String>, props: &BTreeSet<String>) {
    if names.is_empty() {
        *names = props.clone();
    } else {
        names.extend(props.iter().cloned());
    }
}

/// Merge an owned builtin result: move when empty, extend otherwise.
/// No element is cloned on either path.
fn take_or_extend_owned(names: &mut BTreeSet<String>, props: BTreeSet<String>) {
    if names.is_empty() {
        *names = props;
    } else {
        names.extend(props);
    }
}
