//! Expansion guard for the tracer: stops a recursive generic before it overflows the stack.
//! Every declaration expansion enters the guard with its pass, declaration and type arguments scoped to the
//! caller (bound parameters substituted by what they denote), and leaves it when the expansion returns.
//! An expansion already on the stack is a repeat and is refused silently, since repeating it adds no names
//! (`Loop<T> = T | Loop<T>`, mutually recursive aliases). A stack past `MAX_DEPTH`, an argument past
//! `MAX_ARG_NODES` or a session past `MAX_EXPANSIONS` is a cut: the names that expansion would add are lost,
//! so the session keeps the first cut for the report. A refused expansion contributes no names either way.

use std::path::{Path, PathBuf};

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

/// Which limit refused an expansion, so the warning can say which one it hit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CutReason {
    /// The stack already held `MAX_DEPTH` expansions.
    Depth,
    /// The scoped arguments outgrew `MAX_ARG_NODES`.
    Argument,
    /// The session already performed `MAX_EXPANSIONS` expansions.
    Budget,
}

/// The first expansion a limit refused in one trace: the declaration it would have expanded and
/// the module that declares it. Only the first is kept; later cuts of the same walk say the same thing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GuardCut {
    pub reason: CutReason,
    pub name: String,
    pub module: PathBuf,
}

/// The guard's answer for one expansion request.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Entry {
    /// Pushed: the caller runs the expansion and calls `leave` once it returns.
    Run,
    /// The same expansion is already in progress, so it adds no names and nothing is lost.
    Repeat,
    /// A limit refused it: the props it would add go untraced, so the session records the cut.
    Cut(CutReason),
}

/// One declaration expansion in progress, compared name first so most misses stay cheap.
#[derive(Debug, PartialEq, Eq)]
struct Expansion {
    name: String,
    pass: TracePass,
    args: Vec<TypeExpr>,
    module_path: PathBuf,
}

/// The declaration a pass is about to expand, with the arguments written at the use site.
pub(super) struct ExpansionSite<'a> {
    pub pass: TracePass,
    pub module_path: &'a Path,
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
    /// Push the expansion and return `Run`, or say why it must not run. Every `Run` is paired with one
    /// `leave` after the expansion returns. The repeat check comes before the limits, so a repeat stays
    /// silent even past the depth cap; an argument list past its budget cannot equal one on the stack,
    /// so checking it first never hides a repeat.
    pub(super) fn enter(&mut self, site: &ExpansionSite<'_>) -> Entry {
        let Some(args) = scoped_args(site.args, site.env) else {
            return Entry::Cut(CutReason::Argument);
        };
        let expansion = Expansion {
            name: site.name.to_string(),
            pass: site.pass,
            args,
            module_path: site.module_path.to_path_buf(),
        };
        if self.stack.contains(&expansion) {
            return Entry::Repeat;
        }
        if self.stack.len() >= MAX_DEPTH {
            return Entry::Cut(CutReason::Depth);
        }
        if self.expansions >= MAX_EXPANSIONS {
            return Entry::Cut(CutReason::Budget);
        }
        self.expansions += 1;
        self.stack.push(expansion);
        Entry::Run
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

#[cfg(test)]
mod tests {
    use super::*;

    fn site<'a>(name: &'a str, args: &'a [TypeExpr], env: &'a TypeEnv) -> ExpansionSite<'a> {
        ExpansionSite {
            pass: TracePass::Props,
            module_path: Path::new("/decl.ts"),
            name,
            args,
            env,
        }
    }

    fn names_up_to_depth_cap() -> Vec<String> {
        (0..=MAX_DEPTH)
            .map(|index| format!("Decl{index}"))
            .collect()
    }

    #[test]
    fn expansions_run_until_the_depth_cap_then_cut() {
        let env = TypeEnv::default();
        let names = names_up_to_depth_cap();
        let mut guard = ExpansionGuard::default();
        for name in &names[..MAX_DEPTH] {
            assert_eq!(guard.enter(&site(name, &[], &env)), Entry::Run);
        }
        assert_eq!(
            guard.enter(&site(&names[MAX_DEPTH], &[], &env)),
            Entry::Cut(CutReason::Depth)
        );
    }

    #[test]
    fn a_repeat_at_the_depth_cap_stays_a_silent_repeat() {
        let env = TypeEnv::default();
        let names = names_up_to_depth_cap();
        let mut guard = ExpansionGuard::default();
        for name in &names[..MAX_DEPTH] {
            guard.enter(&site(name, &[], &env));
        }
        assert_eq!(guard.enter(&site(&names[0], &[], &env)), Entry::Repeat);
    }

    #[test]
    fn an_exhausted_session_budget_cuts_new_expansions() {
        let env = TypeEnv::default();
        let mut guard = ExpansionGuard {
            expansions: MAX_EXPANSIONS,
            ..ExpansionGuard::default()
        };
        assert_eq!(
            guard.enter(&site("Fresh", &[], &env)),
            Entry::Cut(CutReason::Budget)
        );
    }

    #[test]
    fn an_argument_past_its_node_budget_cuts_before_anything_is_pushed() {
        let env = TypeEnv::default();
        let args = vec![TypeExpr::Unknown; MAX_ARG_NODES + 1];
        let mut guard = ExpansionGuard::default();
        assert_eq!(
            guard.enter(&site("Wide", &args, &env)),
            Entry::Cut(CutReason::Argument)
        );
        assert!(guard.stack.is_empty());
    }

    #[test]
    fn run_pushes_and_leave_pops() {
        let env = TypeEnv::default();
        let mut guard = ExpansionGuard::default();
        assert_eq!(guard.enter(&site("Once", &[], &env)), Entry::Run);
        assert_eq!(guard.stack.len(), 1);
        guard.leave();
        assert!(guard.stack.is_empty());
        assert_eq!(guard.expansions, 1);
    }
}
