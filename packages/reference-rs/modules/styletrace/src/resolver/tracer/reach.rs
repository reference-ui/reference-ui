//! Static reach of a refused expansion: the prop names it could add, found without expanding it.
//! The walk follows the references the tracer would, from the refused declaration, its arguments
//! and the bindings in scope, reading each declaration and binding once per scope.
//! The reach of a binding is memoised for the session, keyed by the scope that binds it, and a cut shares
//! it as a part rather than copying its names, so a cut costs its own body and arguments, not the chain above.
//! It ends on recursive generics whose arguments grow: each declaration is read once per scope, and the
//! scopes are only the bindings the trace already holds, so no new scope is ever made.
//! A cut is lossless when every reached name is already traced; a declaration that fails to load
//! makes the reach unbounded, which counts as lossy.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use rustc_hash::{FxHashMap, FxHashSet};

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::{TypeDeclaration, TypeEnv, TypeExpr};

use super::context::{is_surface_type_name, TraceContext};

/// What one refused expansion could contribute: the names its own walk read, the shared reach of each
/// binding it read through the session memo, and whether any declaration in it failed to load.
#[derive(Debug, Default, Clone)]
pub struct Reach {
    names: BTreeSet<String>,
    parts: Vec<Rc<Reach>>,
    unbounded: bool,
}

impl Reach {
    /// Fold a repeat of the same cut into this one: the cut loses names when any refusal does.
    pub fn absorb(&mut self, other: Reach) {
        self.unbounded |= other.unbounded;
        self.names.extend(other.names);
        self.parts.extend(other.parts);
    }

    /// True when the refused expansion could add no name the trace does not already hold. A part shared
    /// by several walks is checked once, so the check costs the size of the reach, not of each walk.
    pub fn covered_by(&self, traced: &BTreeSet<String>) -> bool {
        let mut checked = FxHashSet::default();
        self.covered_within(traced, &mut checked)
    }

    fn covered_within(
        &self,
        traced: &BTreeSet<String>,
        checked: &mut FxHashSet<*const Reach>,
    ) -> bool {
        if self.unbounded || !self.names.is_subset(traced) {
            return false;
        }
        for part in &self.parts {
            if checked.insert(Rc::as_ptr(part)) && !part.covered_within(traced, checked) {
                return false;
            }
        }
        true
    }
}

/// Session-wide memo: what each bound parameter's argument reaches, and how each named declaration resolves.
/// A binding's reach depends only on its argument and the scope that wrote it, so each binding is walked once
/// per trace, and a declaration resolves once for every walk that names it. The memo holds each scope it is
/// keyed on, so a scope's address cannot be reused by another scope while the memo lives.
#[derive(Default)]
pub struct ReachMemo {
    bindings: FxHashMap<usize, FxHashMap<String, MemoEntry>>,
    decls: FxHashMap<PathBuf, FxHashMap<String, Option<Rc<ResolvedDecl>>>>,
}

/// A named declaration as the walk resolves it: the module that declares it, and the declaration.
type ResolvedDecl = (PathBuf, TypeDeclaration);

struct MemoEntry {
    _scope: TypeEnv,
    reach: Rc<Reach>,
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
    let mut walk = Walk::new(ctx);
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

/// One reach walk. A declaration is read once per walk and scope. Both keys are addresses of values that
/// outlive the walk (memoised declarations and scopes, or the refused declaration held by the caller).
struct Walk<'c, 'a> {
    ctx: &'c mut TraceContext<'a>,
    reach: Reach,
    seen_decls: FxHashSet<(usize, usize)>,
}

impl<'c, 'a> Walk<'c, 'a> {
    fn new(ctx: &'c mut TraceContext<'a>) -> Self {
        Self {
            ctx,
            reach: Reach::default(),
            seen_decls: FxHashSet::default(),
        }
    }
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
    /// they are written, and a parameter of the declaration being read is left to its argument. A name the
    /// scope binds shares that binding's memoised reach.
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
        if at.env.contains_key(name) {
            let part = self.binding_reach(at.env, name);
            self.reach.parts.push(part);
            return;
        }
        self.declaration(name, at);
    }

    /// The memoised reach of the argument that `name` binds in `scope`. The first request walks the argument
    /// in its own scope from a fresh declaration set, so the memo holds the argument's whole reach.
    fn binding_reach(&mut self, scope: &TypeEnv, name: &str) -> Rc<Reach> {
        let scope_key = env_key(scope);
        if let Some(entry) = self
            .ctx
            .session
            .reach_memo
            .bindings
            .get(&scope_key)
            .and_then(|names| names.get(name))
        {
            return Rc::clone(&entry.reach);
        }
        let Some(bound) = scope.get(name) else {
            return Rc::new(Reach::default());
        };
        let at = Scope {
            module: &bound.module_path,
            env: &bound.env,
            skip: &[],
        };
        let reach = Rc::new(walk_fresh(self.ctx, &bound.expr, at));
        self.ctx
            .session
            .reach_memo
            .bindings
            .entry(scope_key)
            .or_default()
            .insert(
                name.to_string(),
                MemoEntry {
                    _scope: Rc::clone(scope),
                    reach: Rc::clone(&reach),
                },
            );
        reach
    }

    /// Resolve a named declaration the way the tracer does. A module that fails to load leaves its
    /// names unknown, so the reach is unbounded.
    fn declaration(&mut self, name: &str, at: Scope<'_>) {
        match self.resolved(at.module, name) {
            Ok(Some(found)) => {
                let (module, declaration) = &*found;
                self.visit_decl(module, declaration, at.env);
            }
            Ok(None) => {}
            Err(_) => self.reach.unbounded = true,
        }
    }

    /// The declaration `name` names from `module`, resolved once per session. A resolution is fixed by the
    /// module graph, so every walk that names it shares one copy instead of cloning its own.
    fn resolved(
        &mut self,
        module: &Path,
        name: &str,
    ) -> Result<Option<Rc<ResolvedDecl>>, StyleTraceError> {
        if let Some(known) = self
            .ctx
            .session
            .reach_memo
            .decls
            .get(module)
            .and_then(|names| names.get(name))
        {
            return Ok(known.clone());
        }
        let resolved = self.ctx.resolve_declaration(module, name)?.map(Rc::new);
        self.ctx
            .session
            .reach_memo
            .decls
            .entry(module.to_path_buf())
            .or_default()
            .insert(name.to_string(), resolved.clone());
        Ok(resolved)
    }

    /// A declaration's own props, then the references its body makes; its type parameters are skipped.
    fn visit_decl(&mut self, module: &Path, declaration: &TypeDeclaration, env: &TypeEnv) {
        let key = (declaration as *const TypeDeclaration as usize, env_key(env));
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

/// Walk one expression from a fresh declaration set, so the reach it returns is complete on its own.
fn walk_fresh(ctx: &mut TraceContext<'_>, expr: &TypeExpr, at: Scope<'_>) -> Reach {
    let mut walk = Walk::new(ctx);
    walk.expr(expr, at);
    walk.reach
}

/// Identity of a scope: bindings are shared behind one pointer, so the address names the scope.
fn env_key(env: &TypeEnv) -> usize {
    Rc::as_ptr(env) as usize
}
