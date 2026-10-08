//! Core resolution logic for tracing type properties and literals.
//!
//! This module implements the main recursive resolution passes. It evaluates
//! type expressions like unions, intersections, and mapped types.

use std::borrow::Cow;
use std::collections::BTreeSet;
use std::path::Path;

use rustc_hash::FxHashMap;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::{BoundTypeExpr, TypeDeclaration, TypeExpr};

use super::builtins::{resolve_builtin_literals, resolve_builtin_props};
use super::context::{is_surface_type_name, TraceContext};

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
        TypeExpr::Unknown | TypeExpr::UnionLiterals(_) => Ok(()),
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
        TypeExpr::IndexedAccess { object, .. } => {
            resolve_indexed_access_props_into(ctx, object, names)
        }
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names_into(ctx, key_source, names),
        TypeExpr::Keyof(_) => Ok(()),
        TypeExpr::Conditional {
            true_type,
            false_type,
        } => {
            resolve_prop_names_into(ctx, true_type, names)?;
            resolve_prop_names_into(ctx, false_type, names)
        }
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
        _ => resolve_prop_names_into(ctx, object, names),
    }
}

pub fn resolve_literal_names(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    resolve_literal_names_into(ctx, expr, &mut names)?;
    Ok(names)
}

fn resolve_literal_names_into(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match expr {
        TypeExpr::Unknown | TypeExpr::Object(_) => Ok(()),
        TypeExpr::UnionLiterals(values) => {
            take_or_extend(names, values);
            Ok(())
        }
        TypeExpr::Keyof(target) => resolve_prop_names_into(ctx, target, names),
        TypeExpr::Intersection(types) | TypeExpr::Union(types) => {
            resolve_combined_literals_into(ctx, types, names)
        }
        TypeExpr::Reference { name, args } => {
            resolve_reference_expr_literals_into(ctx, name, args, names)
        }
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names_into(ctx, key_source, names),
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
        let mut next_ctx = ctx.branch(&bound.module_path, ctx.env);
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
        _ => Ok(()),
    }
}

/// Declaration inputs for one property/literal expansion.
struct DeclTarget<'a> {
    module_path: &'a Path,
    declaration: &'a TypeDeclaration,
    args: &'a [TypeExpr],
}

impl<'a> DeclTarget<'a> {
    fn new(module_path: &'a Path, declaration: &'a TypeDeclaration, args: &'a [TypeExpr]) -> Self {
        Self {
            module_path,
            declaration,
            args,
        }
    }
}

fn resolve_decl_props(
    ctx: &mut TraceContext<'_>,
    decl_module_path: &Path,
    declaration: &TypeDeclaration,
    args: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    let target = DeclTarget::new(decl_module_path, declaration, args);
    let mut names = BTreeSet::new();
    resolve_decl_props_into(ctx, &target, &mut names)?;
    Ok(names)
}

fn resolve_decl_props_into(
    ctx: &mut TraceContext<'_>,
    target: &DeclTarget<'_>,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match target.declaration {
        TypeDeclaration::Interface(interface_decl) => {
            let next_env = bind_type_params(
                &interface_decl.type_params,
                target.args,
                ctx.module_path,
                ctx.env,
            );
            take_or_extend(names, &interface_decl.props);
            let mut next_ctx = ctx.branch(target.module_path, &next_env);
            for parent in &interface_decl.extends {
                resolve_prop_names_into(&mut next_ctx, parent, names)?;
            }
            Ok(())
        }
        TypeDeclaration::TypeAlias(type_alias) => {
            let next_env = bind_type_params(
                &type_alias.type_params,
                target.args,
                ctx.module_path,
                ctx.env,
            );
            let mut next_ctx = ctx.branch(target.module_path, &next_env);
            resolve_prop_names_into(&mut next_ctx, &type_alias.expr, names)
        }
    }
}

fn resolve_decl_literals_into(
    ctx: &mut TraceContext<'_>,
    target: &DeclTarget<'_>,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    match target.declaration {
        TypeDeclaration::Interface(interface_decl) => {
            let next_env = bind_type_params(
                &interface_decl.type_params,
                target.args,
                ctx.module_path,
                ctx.env,
            );
            take_or_extend(names, &interface_decl.props);
            let mut next_ctx = ctx.branch(target.module_path, &next_env);
            for parent in &interface_decl.extends {
                resolve_literal_names_into(&mut next_ctx, parent, names)?;
            }
            Ok(())
        }
        TypeDeclaration::TypeAlias(type_alias) => {
            let next_env = bind_type_params(
                &type_alias.type_params,
                target.args,
                ctx.module_path,
                ctx.env,
            );
            let mut next_ctx = ctx.branch(target.module_path, &next_env);
            resolve_literal_names_into(&mut next_ctx, &type_alias.expr, names)
        }
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

fn bind_type_params<'a>(
    params: &[String],
    args: &[TypeExpr],
    arg_module_path: &Path,
    inherited_env: &'a FxHashMap<String, BoundTypeExpr>,
) -> Cow<'a, FxHashMap<String, BoundTypeExpr>> {
    if params.is_empty() {
        return Cow::Borrowed(inherited_env);
    }
    let mut env = inherited_env.clone();
    for (index, param) in params.iter().enumerate() {
        env.insert(
            param.clone(),
            BoundTypeExpr {
                module_path: arg_module_path.to_path_buf(),
                expr: args.get(index).cloned().unwrap_or(TypeExpr::Unknown),
            },
        );
    }
    Cow::Owned(env)
}
