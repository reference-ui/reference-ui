//! Closed pure-helper descriptors: v2's fence, adopted verbatim (SPEC-V2-39).
//!
//! A same-file helper folds only when it lowers to a closed [`PureFn`]
//! descriptor: an arrow or `function` (declaration, expression, or IIFE)
//! with a single-expression body, identifier-only params, and captures that
//! already fold. Lowering fails structurally, returning `None`, on async,
//! generators, rest or destructured params, nested calls, `this`,
//! assignment, methods, spreads, optional links, and every other impure or
//! unknown form — v2's `pure_fn` refuse list (`literal-evaluator.md`
//! §Pure callables). Anything the fence refuses never folds: the call site
//! warns with today's call diagnostic, so the fence cannot silently widen.

use crate::atom::AtomValue;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;
use oxc_ast::ast::{
    ArrowFunctionExpression, Expression, FormalParameters, Function, FunctionBody, Statement,
};

/// A lowered pure helper: param names, per-slot defaults, and the closed body.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PureFn {
    /// Positional param names; body `Param(i)` indexes this list.
    pub params: Vec<Box<str>>,
    /// One slot per param (`None` = required); a default may reference only
    /// earlier params plus closed captures, exactly like v2.
    pub defaults: Vec<Option<PureExpr>>,
    /// The single-expression body with captures baked to values.
    pub body: PureExpr,
}

/// A folded value inside the fence: scalar leaves, an object, or an array.
/// A multi-leaf list is the open-branch union (v2's `Conditional`):
/// passthrough positions fan it out, coercion positions refuse it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FenceValue {
    /// One or more scalar leaves; never empty by construction.
    Leaves(Vec<AtomValue>),
    /// Insertion-ordered entries; duplicate keys keep every value and member
    /// reads take the last, so runtime last-wins agrees with the house rule.
    Object(Vec<(Box<str>, FenceValue)>),
    /// Positional elements; elisions bake to null leaves.
    Array(Vec<FenceValue>),
}

/// The closed body IR. Identifiers that are not params baked to [`PureExpr::Value`]
/// at lower time; every other variant mirrors v2's `OwnedPureExpr` one for one.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PureExpr {
    /// A baked capture: folded leaves, object, or array from scope.
    Value(FenceValue),
    /// A positional param, applied to the folded call arguments.
    Param(usize),
    /// Quasis plus strictly lowered parts; a multi-leaf part refuses.
    Template {
        quasis: Vec<Box<str>>,
        parts: Vec<PureExpr>,
    },
    /// JS `+`, which concatenates on any string side and adds otherwise.
    Concat(Box<PureExpr>, Box<PureExpr>),
    /// Any other binary operator v2's fence admits (no bitwise, no `in`).
    Binary {
        op: FenceBinary,
        left: Box<PureExpr>,
        right: Box<PureExpr>,
    },
    /// `+`, `-`, `!` only — `~` refuses inside the fence, verbatim v2.
    Unary { op: FenceUnary, arg: Box<PureExpr> },
    /// Short-circuiting logical operator over folded operands.
    Logical {
        op: FenceLogical,
        left: Box<PureExpr>,
        right: Box<PureExpr>,
    },
    /// A ternary whose test lowered; eval picks its arm, a failed test refuses.
    Conditional {
        test: Box<PureExpr>,
        consequent: Box<PureExpr>,
        alternate: Box<PureExpr>,
    },
    /// Entries with static or folded-computed keys; no spreads, no methods.
    Object(Vec<(FenceKey, PureExpr)>),
    /// Elements or holes; spreads refuse.
    Array(Vec<FenceArrayElem>),
    /// Static member read over a folded object.
    Member {
        object: Box<PureExpr>,
        prop: Box<str>,
    },
    /// Computed read over a folded object or array.
    Index {
        object: Box<PureExpr>,
        index: Box<PureExpr>,
    },
}

/// A lowered object key: a static spelling or a folded computed expression.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FenceKey {
    /// `primary`, `'primary'`, or a stringified numeric key.
    Static(Box<str>),
    /// `[expr]` with a strictly lowered key expression.
    Computed(PureExpr),
}

/// One lowered array element: a value or an elision hole.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FenceArrayElem {
    /// A strictly lowered element.
    Elem(PureExpr),
    /// An elision hole, which bakes to a null leaf.
    Hole,
}

/// Binary operators the fence admits, mirroring v2's `PureBinaryOp`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FenceBinary {
    Sub,
    Mul,
    Div,
    Rem,
    Exp,
    EqEq,
    NotEq,
    StrictEq,
    StrictNotEq,
    Lt,
    LtEq,
    Gt,
    GtEq,
}

/// Unary operators the fence admits, mirroring v2's `PureUnaryOp`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FenceUnary {
    Plus,
    Minus,
    Not,
}

/// Logical operators the fence admits, mirroring v2's `PureLogicalOp`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FenceLogical {
    And,
    Or,
    Coalesce,
}

/// Lowering session: the helper's param names plus scope lookup for captures.
pub(crate) struct LowerCtx<'a> {
    /// Param names in order; identifiers resolve against these before scope.
    pub params: Vec<Box<str>>,
    /// Scope lookup at the helper's declaration scope for baking captures.
    pub scoped: Scoped<'a>,
}

/// Lower an initializer through wrappers to a pure descriptor, if it is one.
/// Only direct arrow and function initializers lower — aliases (`const g =
/// f`) never do, verbatim v2 (`pure_helper_local_alias_does_not_fold`).
pub(crate) fn lower_callable_expr(init: &Expression<'_>, scoped: Scoped<'_>) -> Option<PureFn> {
    let mut init = init;
    while let Some(inner) = unwrap_wrapper_target(init) {
        init = inner;
    }
    match init {
        Expression::ArrowFunctionExpression(arrow) => lower_arrow(arrow, scoped),
        Expression::FunctionExpression(func) => lower_function(func, scoped),
        _ => None,
    }
}

/// Lower an arrow to a descriptor, refusing async arrows outright.
pub(crate) fn lower_arrow(
    arrow: &ArrowFunctionExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<PureFn> {
    if arrow.r#async {
        return None;
    }
    lower_callable(&arrow.params, &arrow.body, arrow.expression, scoped)
}

/// Lower a function to a descriptor, refusing async functions and generators.
pub(crate) fn lower_function(func: &Function<'_>, scoped: Scoped<'_>) -> Option<PureFn> {
    if func.r#async || func.generator {
        return None;
    }
    let body = func.body.as_ref()?;
    lower_callable(&func.params, body, false, scoped)
}

/// Lower params plus the single-expression body to a descriptor.
fn lower_callable(
    params: &FormalParameters<'_>,
    body: &FunctionBody<'_>,
    is_expression_arrow: bool,
    scoped: Scoped<'_>,
) -> Option<PureFn> {
    let (names, defaults) = lower_params(params, scoped)?;
    let body_expr = body_expression(body, is_expression_arrow)?;
    let ctx = LowerCtx {
        params: names.clone(),
        scoped,
    };
    let lowered = super::fence_lower::lower_expr(body_expr, &ctx)?;
    Some(PureFn {
        params: names,
        defaults,
        body: lowered,
    })
}

/// Lower params to names plus per-slot defaults. Rest params and
/// destructured patterns refuse; each default sees only earlier params.
fn lower_params(
    params: &FormalParameters<'_>,
    scoped: Scoped<'_>,
) -> Option<(Vec<Box<str>>, Vec<Option<PureExpr>>)> {
    if params.rest.is_some() {
        return None;
    }
    let names = param_names(params)?;
    let mut defaults = Vec::with_capacity(names.len());
    for (index, item) in params.items.iter().enumerate() {
        let Some(init) = item.initializer.as_ref() else {
            defaults.push(None);
            continue;
        };
        let ctx = LowerCtx {
            params: names[..index].to_vec(),
            scoped,
        };
        defaults.push(Some(super::fence_lower::lower_expr(init, &ctx)?));
    }
    Some((names, defaults))
}

/// Identifier-only param names, or None for destructured patterns.
fn param_names(params: &FormalParameters<'_>) -> Option<Vec<Box<str>>> {
    let mut names = Vec::with_capacity(params.items.len());
    for item in &params.items {
        match &item.pattern {
            oxc_ast::ast::BindingPattern::BindingIdentifier(id) => {
                names.push(id.name.as_str().into());
            }
            _ => return None,
        }
    }
    Some(names)
}

/// The single-expression body: an expression arrow's value, or a block with
/// exactly one `return` and nothing else. Directives are ignored, verbatim v2.
fn body_expression<'a>(
    body: &'a FunctionBody<'a>,
    is_expression_arrow: bool,
) -> Option<&'a Expression<'a>> {
    if is_expression_arrow {
        let [Statement::ExpressionStatement(stmt)] = body.statements.as_slice() else {
            return None;
        };
        return Some(&stmt.expression);
    }
    let [Statement::ReturnStatement(ret)] = body.statements.as_slice() else {
        return None;
    };
    ret.argument.as_ref()
}
