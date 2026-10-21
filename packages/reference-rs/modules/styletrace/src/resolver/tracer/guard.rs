//! Expansion guard for the tracer: stops a recursive generic before it overflows the stack.
//! Every declaration expansion enters the guard with its pass, declaration and type arguments scoped to the
//! caller (bound parameters substituted by what they denote), and leaves it when the expansion returns.
//! An expansion already on the stack is refused, since repeating it adds no names (`Loop<T> = T | Loop<T>`,
//! mutually recursive aliases); a stack past `MAX_DEPTH`, an argument past `MAX_ARG_NODES` or a session past
//! `MAX_EXPANSIONS` is refused too, so growing arguments stop. A refused expansion contributes no names,
//! like any reference the tracer cannot resolve.

use crate::resolver::model::{BoundTypeExpr, TypeEnv, TypeExpr};

/// Deepest chain of nested declaration expansions; real type graphs stay far below it.
const MAX_DEPTH: usize = 64;
/// Largest scoped argument list, in nodes; only a recursively growing argument reaches it.
const MAX_ARG_NODES: usize = 512;
/// Declaration expansions one trace session may perform, so a recursion that fans out with
/// growing arguments (never repeating, each branch stopped only at `MAX_DEPTH`) ends quickly.
/// A real `ref sync` session in reference-lib peaks near 64 expansions at depth 9.
const MAX_EXPANSIONS: usize = 5_000;

/// Which tracer pass an expansion belongs to: the same declaration answers each differently.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum TracePass {
    Props,
    Literals,
}

/// One declaration expansion in progress, compared name first so most misses stay cheap.
#[derive(Debug, PartialEq, Eq)]
struct Expansion {
    name: String,
    pass: TracePass,
    args: Vec<TypeExpr>,
    module_path: std::path::PathBuf,
}

/// The declaration a pass is about to expand, with the arguments written at the use site.
pub(super) struct ExpansionSite<'a> {
    pub pass: TracePass,
    pub module_path: &'a std::path::Path,
    pub name: &'a str,
    pub args: &'a [TypeExpr],
    pub env: &'a TypeEnv,
}

/// Session-wide stack of expansions in progress plus the running expansion count.
#[derive(Debug, Default)]
pub(super) struct ExpansionGuard {
    stack: Vec<Expansion>,
    expansions: usize,
}

impl ExpansionGuard {
    /// Push the expansion and return true, or return false when it must not run.
    /// Every true must be paired with one `leave` after the expansion returns.
    pub(super) fn enter(&mut self, site: &ExpansionSite<'_>) -> bool {
        if self.stack.len() >= MAX_DEPTH || self.expansions >= MAX_EXPANSIONS {
            return false;
        }
        let Some(args) = scoped_args(site.args, site.env) else {
            return false;
        };
        let expansion = Expansion {
            name: site.name.to_string(),
            pass: site.pass,
            args,
            module_path: site.module_path.to_path_buf(),
        };
        if self.stack.contains(&expansion) {
            return false;
        }
        self.expansions += 1;
        self.stack.push(expansion);
        true
    }

    pub(super) fn leave(&mut self) {
        self.stack.pop();
    }
}

/// The arguments with every bound parameter replaced by what it denotes in its own scope,
/// so `Loop<T>` reached again through a fresh binding of `T` compares equal. `None` when
/// the substituted list outgrows `MAX_ARG_NODES`.
fn scoped_args(args: &[TypeExpr], env: &TypeEnv) -> Option<Vec<TypeExpr>> {
    let mut scoped = args.to_vec();
    let mut budget = MAX_ARG_NODES;
    for arg in &mut scoped {
        scope_expr(arg, env, &mut budget)?;
    }
    Some(scoped)
}

/// Substitute bound parameters in place; a binding always points at an older scope, so it ends.
fn scope_expr(expr: &mut TypeExpr, env: &TypeEnv, budget: &mut usize) -> Option<()> {
    *budget = budget.checked_sub(1)?;
    if let Some(bound) = bound_parameter(expr, env) {
        *expr = bound.expr.clone();
        return scope_expr(expr, &bound.env, budget);
    }
    for child in children_mut(expr) {
        scope_expr(child, env, budget)?;
    }
    Some(())
}

/// The binding a bare reference names, if it is a type parameter in scope.
fn bound_parameter<'a>(expr: &TypeExpr, env: &'a TypeEnv) -> Option<&'a BoundTypeExpr> {
    match expr {
        TypeExpr::Reference { name, args } if args.is_empty() => env.get(name),
        _ => None,
    }
}

fn children_mut(expr: &mut TypeExpr) -> Vec<&mut TypeExpr> {
    match expr {
        TypeExpr::Reference { args: nested, .. }
        | TypeExpr::Intersection(nested)
        | TypeExpr::Union(nested) => nested.iter_mut().collect(),
        TypeExpr::IndexedAccess {
            object: left,
            index: right,
        }
        | TypeExpr::Mapped {
            key_source: left,
            value_type: right,
        }
        | TypeExpr::Conditional {
            true_type: left,
            false_type: right,
        } => vec![left.as_mut(), right.as_mut()],
        TypeExpr::Keyof(target) => vec![target.as_mut()],
        TypeExpr::Unknown | TypeExpr::Object(_) | TypeExpr::UnionLiterals(_) => Vec::new(),
    }
}
