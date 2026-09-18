//! Core resolution logic for tracing type properties and literals.
//!
//! This module implements the main recursive resolution passes. It evaluates
//! type expressions like unions, intersections, and mapped types.

use std::collections::{BTreeSet, HashMap};
use std::path::Path;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::{BoundTypeExpr, TypeDeclaration, TypeExpr};

use super::builtins::{resolve_builtin_literals, resolve_builtin_props};
use super::context::TraceContext;

pub fn resolve_reference_props(
    ctx: &mut TraceContext<'_>,
    module_path: &Path,
    name: &str,
) -> Result<BTreeSet<String>, StyleTraceError> {
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
    match expr {
        TypeExpr::Unknown | TypeExpr::UnionLiterals(_) => Ok(BTreeSet::new()),
        TypeExpr::Object(props) => Ok(props.clone()),
        TypeExpr::Intersection(types) => resolve_combined_props(ctx, types),
        TypeExpr::Reference { name, args } => resolve_reference_expr_props(ctx, name, args),
        // A name usable in either branch counts as a style prop, like conditional branches.
        TypeExpr::Union(types) => resolve_combined_props(ctx, types),
        TypeExpr::IndexedAccess { object, .. } => resolve_indexed_access_props(ctx, object),
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names(ctx, key_source),
        TypeExpr::Keyof(_) => Ok(BTreeSet::new()),
        TypeExpr::Conditional {
            true_type,
            false_type,
        } => {
            let mut names = resolve_prop_names(ctx, true_type)?;
            names.extend(resolve_prop_names(ctx, false_type)?);
            Ok(names)
        }
    }
}

fn resolve_combined_props(
    ctx: &mut TraceContext<'_>,
    types: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    for nested in types {
        names.extend(resolve_prop_names(ctx, nested)?);
    }
    Ok(names)
}

fn resolve_reference_expr_props(
    ctx: &mut TraceContext<'_>,
    name: &str,
    args: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    if let Some(names) = resolve_builtin_props(ctx, name, args)? {
        return Ok(names);
    }

    if let Some(bound) = ctx.env.get(name) {
        let mut next_ctx = ctx.branch(&bound.module_path, ctx.env);
        return resolve_prop_names(&mut next_ctx, &bound.expr);
    }

    match ctx.resolve_declaration(ctx.module_path, name)? {
        Some((resolved_module, declaration)) => {
            resolve_decl_props(ctx, &resolved_module, &declaration, args)
        }
        None => Ok(BTreeSet::new()),
    }
}

fn resolve_indexed_access_props(
    ctx: &mut TraceContext<'_>,
    object: &TypeExpr,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match object {
        TypeExpr::Mapped { value_type, .. } => resolve_prop_names(ctx, value_type),
        _ => resolve_prop_names(ctx, object),
    }
}

pub fn resolve_literal_names(
    ctx: &mut TraceContext<'_>,
    expr: &TypeExpr,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match expr {
        TypeExpr::Unknown | TypeExpr::Object(_) => Ok(BTreeSet::new()),
        TypeExpr::UnionLiterals(values) => Ok(values.clone()),
        TypeExpr::Keyof(target) => resolve_prop_names(ctx, target),
        TypeExpr::Intersection(types) => resolve_combined_literals(ctx, types),
        TypeExpr::Union(types) => resolve_combined_literals(ctx, types),
        TypeExpr::Reference { name, args } => resolve_reference_expr_literals(ctx, name, args),
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names(ctx, key_source),
        TypeExpr::IndexedAccess { object, index } => {
            resolve_indexed_access_literals(ctx, object, index)
        }
        TypeExpr::Conditional {
            true_type,
            false_type,
        } => {
            let mut names = resolve_literal_names(ctx, true_type)?;
            names.extend(resolve_literal_names(ctx, false_type)?);
            Ok(names)
        }
    }
}

fn resolve_combined_literals(
    ctx: &mut TraceContext<'_>,
    types: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    let mut names = BTreeSet::new();
    for nested in types {
        names.extend(resolve_literal_names(ctx, nested)?);
    }
    Ok(names)
}

fn resolve_reference_expr_literals(
    ctx: &mut TraceContext<'_>,
    name: &str,
    args: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    if let Some(values) = resolve_builtin_literals(ctx, name, args)? {
        return Ok(values);
    }

    if let Some(bound) = ctx.env.get(name) {
        let mut next_ctx = ctx.branch(&bound.module_path, ctx.env);
        return resolve_literal_names(&mut next_ctx, &bound.expr);
    }

    match ctx.resolve_declaration(ctx.module_path, name)? {
        Some((resolved_module, declaration)) => {
            resolve_decl_literals(ctx, &resolved_module, &declaration, args)
        }
        None => Ok(BTreeSet::new()),
    }
}

fn resolve_indexed_access_literals(
    ctx: &mut TraceContext<'_>,
    object: &TypeExpr,
    index: &TypeExpr,
) -> Result<BTreeSet<String>, StyleTraceError> {
    let _ = resolve_literal_names(ctx, index)?;
    match object {
        TypeExpr::Mapped { key_source, .. } => resolve_literal_names(ctx, key_source),
        _ => Ok(BTreeSet::new()),
    }
}

fn resolve_decl_props(
    ctx: &mut TraceContext<'_>,
    decl_module_path: &Path,
    declaration: &TypeDeclaration,
    args: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    match declaration {
        TypeDeclaration::Interface(interface_decl) => {
            let next_env =
                bind_type_params(&interface_decl.type_params, args, ctx.module_path, ctx.env);
            let mut names = interface_decl.props.clone();
            let mut next_ctx = ctx.branch(decl_module_path, &next_env);
            for parent in &interface_decl.extends {
                names.extend(resolve_prop_names(&mut next_ctx, parent)?);
            }
            Ok(names)
        }
        TypeDeclaration::TypeAlias(type_alias) => {
            let next_env =
                bind_type_params(&type_alias.type_params, args, ctx.module_path, ctx.env);
            let mut next_ctx = ctx.branch(decl_module_path, &next_env);
            resolve_prop_names(&mut next_ctx, &type_alias.expr)
        }
    }
}

fn resolve_decl_literals(
    ctx: &mut TraceContext<'_>,
    decl_module_path: &Path,
    declaration: &TypeDeclaration,
    args: &[TypeExpr],
) -> Result<BTreeSet<String>, StyleTraceError> {
    match declaration {
        TypeDeclaration::Interface(interface_decl) => {
            let next_env =
                bind_type_params(&interface_decl.type_params, args, ctx.module_path, ctx.env);
            let mut names = interface_decl.props.clone();
            let mut next_ctx = ctx.branch(decl_module_path, &next_env);
            for parent in &interface_decl.extends {
                names.extend(resolve_literal_names(&mut next_ctx, parent)?);
            }
            Ok(names)
        }
        TypeDeclaration::TypeAlias(type_alias) => {
            let next_env =
                bind_type_params(&type_alias.type_params, args, ctx.module_path, ctx.env);
            let mut next_ctx = ctx.branch(decl_module_path, &next_env);
            resolve_literal_names(&mut next_ctx, &type_alias.expr)
        }
    }
}

fn bind_type_params(
    params: &[String],
    args: &[TypeExpr],
    arg_module_path: &Path,
    inherited_env: &HashMap<String, BoundTypeExpr>,
) -> HashMap<String, BoundTypeExpr> {
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
    env
}
