//! Declaration expansion for the tracer: walks one interface or alias into the names it contributes.
//! It takes a `DeclTarget` (the declaration, its module and the type arguments bound at the use site) and a pass accumulator.
//! It binds the declaration's type parameters into a child environment before recursing, so its own references resolve against those arguments.
//! Each argument keeps the caller's environment, so a parameter forwarded under its own name (`Forward<T> = Wrap<T>`) never resolves to itself.

use std::borrow::Cow;
use std::collections::BTreeSet;
use std::path::Path;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::{BoundTypeExpr, TypeDeclaration, TypeEnv, TypeExpr};

use super::super::context::TraceContext;
use super::literals::resolve_literal_names_into;
use super::{resolve_prop_names_into, take_or_extend};

/// Declaration inputs for one property/literal expansion.
pub(super) struct DeclTarget<'a> {
    module_path: &'a Path,
    declaration: &'a TypeDeclaration,
    args: &'a [TypeExpr],
}

impl<'a> DeclTarget<'a> {
    pub(super) fn new(
        module_path: &'a Path,
        declaration: &'a TypeDeclaration,
        args: &'a [TypeExpr],
    ) -> Self {
        Self {
            module_path,
            declaration,
            args,
        }
    }
}

pub(super) fn resolve_decl_props(
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

pub(super) fn resolve_decl_props_into(
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

pub(super) fn resolve_decl_literals_into(
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

fn bind_type_params<'a>(
    params: &[String],
    args: &[TypeExpr],
    arg_module_path: &Path,
    inherited_env: &'a TypeEnv,
) -> Cow<'a, TypeEnv> {
    if params.is_empty() {
        return Cow::Borrowed(inherited_env);
    }
    let mut env = (**inherited_env).clone();
    for (index, param) in params.iter().enumerate() {
        env.insert(
            param.clone(),
            BoundTypeExpr {
                module_path: arg_module_path.to_path_buf(),
                expr: args.get(index).cloned().unwrap_or(TypeExpr::Unknown),
                // Arguments were written in the caller's scope and resolve there.
                env: TypeEnv::clone(inherited_env),
            },
        );
    }
    Cow::Owned(TypeEnv::new(env))
}
