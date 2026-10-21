//! Static reach of a refused expansion: the prop names it could add, found without expanding it.
//! The walk follows the references the tracer would, from the refused declaration, its arguments
//! and the bindings in scope, reading each declaration and binding once per scope.
//! It ends on recursive generics whose arguments grow: each declaration is read once per scope, and the
//! scopes are only the bindings the trace already holds, so no new scope is ever made.
//! A cut is lossless when every reached name is already traced; a declaration that fails to load
//! makes the reach unbounded, which counts as lossy.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use crate::resolver::model::{TypeDeclaration, TypeEnv, TypeExpr};

use super::context::{is_surface_type_name, TraceContext};

/// The names one refused expansion could contribute, or that its reach could not be bounded.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Reach {
    names: BTreeSet<String>,
    unbounded: bool,
}

impl Reach {
    /// Fold a repeat of the same cut into this one: the cut loses names when any refusal does.
    pub fn absorb(&mut self, other: Reach) {
        self.unbounded |= other.unbounded;
        self.names.extend(other.names);
    }

    /// True when the refused expansion could add no name the trace does not already hold.
    pub fn covered_by(&self, traced: &BTreeSet<String>) -> bool {
        !self.unbounded && self.names.is_subset(traced)
    }
}

/// The names a refused expansion could contribute: its own declaration, the arguments written at the
/// refused site, and every binding in scope there. Arguments and bindings are read in the scope that
/// wrote them, and nothing is expanded, so the walk never needs the guard.
pub(super) fn cut_reach(
    ctx: &mut TraceContext<'_>,
    module: &Path,
    declaration: &TypeDeclaration,
    args: &[TypeExpr],
) -> Reach {
    let caller = ctx.module_path;
    let env = ctx.env;
    let mut walk = Walk {
        ctx,
        reach: Reach::default(),
        seen_decls: BTreeSet::new(),
        seen_bindings: BTreeSet::new(),
    };
    walk.visit_decl(module, declaration, env);
    for arg in args {
        walk.expr(
            arg,
            Scope {
                module: caller,
                env,
                skip: &[],
            },
        );
    }
    walk.reach
}

/// The sub-expressions a tracer pass reads through an expression that names no declaration itself.
/// A mapped value type is read only through an indexed access of the mapped object, and an index reads nothing.
/// Leaves (unknown, object and union literals) and references, which `expr` handles, read no sub-expression here.
fn read_children(expr: &TypeExpr) -> Vec<&TypeExpr> {
    if let TypeExpr::Intersection(types) | TypeExpr::Union(types) = expr {
        return types.iter().collect();
    }
    if let TypeExpr::Conditional {
        true_type,
        false_type,
    } = expr
    {
        return vec![true_type.as_ref(), false_type.as_ref()];
    }
    if let TypeExpr::Mapped { key_source, .. } | TypeExpr::Keyof(key_source) = expr {
        return vec![key_source.as_ref()];
    }
    if let TypeExpr::IndexedAccess { object, .. } = expr {
        return indexed_children(object);
    }
    Vec::new()
}

/// The object of an indexed access: a mapped object is read through both its key source and its value type.
fn indexed_children(object: &TypeExpr) -> Vec<&TypeExpr> {
    match object {
        TypeExpr::Mapped {
            key_source,
            value_type,
        } => vec![key_source.as_ref(), value_type.as_ref()],
        other => vec![other],
    }
}

/// Where an expression is read: the module its names resolve in, the bindings in scope, and the
/// parameters of the declaration being read, whose values are walked where they are passed.
#[derive(Clone, Copy)]
struct Scope<'s> {
    module: &'s Path,
    env: &'s TypeEnv,
    skip: &'s [String],
}

/// One reach walk. Declarations are keyed by module, name and scope; bindings by scope and name.
struct Walk<'c, 'a> {
    ctx: &'c mut TraceContext<'a>,
    reach: Reach,
    seen_decls: BTreeSet<(PathBuf, String, usize)>,
    seen_bindings: BTreeSet<(usize, String)>,
}

impl Walk<'_, '_> {
    /// Collect the names an expression can contribute: declared props and union literals here, and the
    /// sub-expressions the tracer's passes read everywhere else.
    fn expr(&mut self, expr: &TypeExpr, at: Scope<'_>) {
        match expr {
            TypeExpr::Object(props) | TypeExpr::UnionLiterals(props) => {
                self.reach.names.extend(props.iter().cloned());
            }
            TypeExpr::Reference { name, args } => self.reference(name, args, at),
            _ => {
                for child in read_children(expr) {
                    self.expr(child, at);
                }
            }
        }
    }

    /// A named reference: surface names are pruned when the trace asks for it, arguments are read where
    /// they are written, and a parameter of the declaration being read is left to its argument.
    fn reference(&mut self, name: &str, args: &[TypeExpr], at: Scope<'_>) {
        if self.ctx.session.prune_surface && is_surface_type_name(name) {
            return;
        }
        for arg in args {
            self.expr(arg, at);
        }
        if at.skip.iter().any(|param| param.as_str() == name) {
            return;
        }
        if let Some(bound) = at.env.get(name) {
            if self
                .seen_bindings
                .insert((env_key(at.env), name.to_string()))
            {
                self.expr(
                    &bound.expr,
                    Scope {
                        module: &bound.module_path,
                        env: &bound.env,
                        skip: &[],
                    },
                );
            }
            return;
        }
        self.declaration(name, at);
    }

    /// Resolve a named declaration the way the tracer does. A module that fails to load leaves its
    /// names unknown, so the reach is unbounded.
    fn declaration(&mut self, name: &str, at: Scope<'_>) {
        match self.ctx.resolve_declaration(at.module, name) {
            Ok(Some((module, declaration))) => self.visit_decl(&module, &declaration, at.env),
            Ok(None) => {}
            Err(_) => self.reach.unbounded = true,
        }
    }

    /// A declaration's own props, then the references its body makes; its type parameters are skipped.
    fn visit_decl(&mut self, module: &Path, declaration: &TypeDeclaration, env: &TypeEnv) {
        let key = (
            module.to_path_buf(),
            declaration.name().to_string(),
            env_key(env),
        );
        if !self.seen_decls.insert(key) {
            return;
        }
        match declaration {
            TypeDeclaration::Interface(interface) => {
                self.reach.names.extend(interface.props.iter().cloned());
                let at = Scope {
                    module,
                    env,
                    skip: &interface.type_params,
                };
                for parent in &interface.extends {
                    self.expr(parent, at);
                }
            }
            TypeDeclaration::TypeAlias(alias) => {
                let at = Scope {
                    module,
                    env,
                    skip: &alias.type_params,
                };
                self.expr(&alias.expr, at);
            }
        }
    }
}

/// Identity of a scope: bindings are shared behind one pointer, so the address names the scope.
fn env_key(env: &TypeEnv) -> usize {
    Rc::as_ptr(env) as usize
}
