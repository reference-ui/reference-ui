//! Declaration expansion for the tracer: walks one interface or alias into the names it contributes.
//! It takes a `DeclTarget` (the declaration, its module and the type arguments bound at the use site) and a pass accumulator.
//! It binds the declaration's type parameters into a child environment before recursing, so its own references resolve against those arguments.
//! Each argument keeps the caller's environment, so a parameter forwarded under its own name (`Forward<T> = Wrap<T>`) never resolves to itself.
//! Named references expand through the session's expansion guard, so a recursive generic stops instead of overflowing the stack, and a limit that stops one is recorded on the session.

use std::borrow::Cow;
use std::collections::BTreeSet;
use std::path::Path;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::{BoundTypeExpr, TypeDeclaration, TypeEnv, TypeExpr};

use super::super::context::TraceContext;
use super::super::guard::{Entry, ExpansionSite, GuardCut, TracePass};
use super::super::reach::cut_reach;
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

/// A named type reference as one pass meets it: `name<args>` written in the current module.
pub(super) struct NamedReference<'a> {
    pub pass: TracePass,
    pub name: &'a str,
    pub args: &'a [TypeExpr],
}

/// Expand the declaration a reference names in the current module for its pass, through the guard.
/// An unresolvable name, a repeat of an expansion in progress, and a guard limit all contribute nothing;
/// a limit is recorded on the session with the names it could reach, and the trace decides later which cuts lost names.
pub(super) fn resolve_named_decl_into(
    ctx: &mut TraceContext<'_>,
    reference: &NamedReference<'_>,
    names: &mut BTreeSet<String>,
) -> Result<(), StyleTraceError> {
    let Some((module_path, declaration)) =
        ctx.resolve_declaration(ctx.module_path, reference.name)?
    else {
        return Ok(());
    };
    if !admit_expansion(ctx, reference, &module_path, &declaration) {
        return Ok(());
    }
    let target = DeclTarget::new(&module_path, &declaration, reference.args);
    let result = match reference.pass {
        TracePass::Props => resolve_decl_props_into(ctx, &target, names),
        TracePass::Literals => resolve_decl_literals_into(ctx, &target, names),
    };
    ctx.session.guard.leave();
    result
}

/// Ask the guard whether this expansion may run. A limit cut is recorded on the session with the names
/// the refused expansion could reach, read from the caller's scope; a repeat is silent, since the
/// expansion it repeats already contributes its names.
fn admit_expansion(
    ctx: &mut TraceContext<'_>,
    reference: &NamedReference<'_>,
    module_path: &Path,
    declaration: &TypeDeclaration,
) -> bool {
    let site = ExpansionSite {
        pass: reference.pass,
        module_path,
        name: declaration.name(),
        args: reference.args,
        env: ctx.env,
    };
    match ctx.session.guard.enter(&site) {
        Entry::Run => true,
        Entry::Repeat => false,
        Entry::Cut(reason) => {
            let cut = GuardCut {
                reason,
                name: declaration.name().to_string(),
                module: module_path.to_path_buf(),
            };
            let reach = cut_reach(ctx, module_path, declaration, reference.args);
            ctx.session.note_cut(cut, reach);
            false
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
