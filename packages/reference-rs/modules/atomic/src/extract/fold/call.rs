//! Fenced pure-helper call folding, shared by both extraction walkers.
//!
//! `fold_pure_call` resolves a call's callee to a lowered [`PureFn`]
//! descriptor — a same-file binding or an inline IIFE — folds every
//! argument, binds params with defaults, and evaluates the closed body.
//! Arguments fold in authored position through `call_args` and
//! `call_object`; the outcome is a [`CallFold`] both walkers lower.
//! Spread args, optional calls, member callees, and unknown callees refuse
//! the whole call with today's call diagnostic.

use oxc_ast::ast::{CallExpression, Expression};
use oxc_span::Span;

use super::call_args::ArgFold;
use super::fence::{FenceValue, PureFn};
use super::fence_eval::eval_expr;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// A folded call: the value, plus the refused argument fragments left behind.
/// Refusals surface only when the call folds; a refused call warns once at
/// the call site instead, so one call never emits a diagnostic pile-up.
pub struct CallFold {
    /// The folded result, or None when the call refused.
    pub value: Option<FenceValue>,
    /// Dropped members, arms, and slots, warned by the want walker.
    pub refusals: Vec<CallRefusal>,
    /// The residue subject when the callee baked a dropped dynamic arm
    /// (Ph4 residue channel); the want walker diagnoses it beside the
    /// folded value. Bound callees name the callee, IIFEs name the entry.
    pub residue: Option<Box<str>>,
}

/// One refused fragment of a folded call's arguments.
pub struct CallRefusal {
    span: Span,
    detail: Box<str>,
}

impl CallRefusal {
    /// One refused fragment at its span.
    pub(crate) fn new(span: Span, detail: &str) -> Self {
        CallRefusal {
            span,
            detail: detail.into(),
        }
    }

    /// The diagnostic text at one style prop in value position.
    pub fn message_for_value(&self, prop: &str) -> String {
        format!(
            "Dynamic non-literal {} in call argument for prop '{prop}'",
            self.detail
        )
    }

    /// The diagnostic text in spread position, where no prop is in scope.
    pub fn message_for_spread(&self) -> String {
        format!(
            "Dynamic non-literal {} in call argument; keeping sibling properties",
            self.detail
        )
    }

    /// The offending fragment's span.
    pub fn span(&self) -> Span {
        self.span
    }
}

/// Fold one call expression against the pure-helper fence.
pub fn fold_pure_call(call: &CallExpression<'_>, scoped: Scoped<'_>) -> CallFold {
    let mut fold = ArgFold::new(scoped);
    let residue = call_callee_residue(scoped, &call.callee);
    let value = apply_call(&mut fold, scoped, call);
    CallFold {
        value,
        refusals: fold.take_refusals(),
        residue,
    }
}

/// The residue subject when the callee baked a dropped dynamic arm.
/// Bound callees carry the attach-time flag and name the callee; inline
/// IIFEs scan their own body and name the entry read.
fn call_callee_residue(scoped: Scoped<'_>, callee: &Expression<'_>) -> Option<Box<str>> {
    let mut callee = callee;
    while let Some(inner) = unwrap_wrapper_target(callee) {
        callee = inner;
    }
    match callee {
        Expression::Identifier(ident) => {
            let name = ident.name.as_str();
            if scoped.pure_fn(name).is_some_and(|func| func.residue) {
                Some(format!("call to '{name}'").into_boxed_str())
            } else {
                None
            }
        }
        Expression::ArrowFunctionExpression(_)
        | Expression::FunctionExpression(_) => {
            super::residue::expr_entry_residue(callee, scoped)
                .map(|path| format!("property '{path}'").into_boxed_str())
        }
        _ => None,
    }
}

/// Fold a call: resolve the callee, fold every argument, bind, apply.
fn apply_call(
    fold: &mut ArgFold,
    scoped: Scoped<'_>,
    call: &CallExpression<'_>,
) -> Option<FenceValue> {
    if call.optional {
        return None;
    }
    let callee = resolve_callee(scoped, &call.callee)?;
    let descriptor = callee.descriptor();
    let mut folded = Vec::with_capacity(call.arguments.len());
    for arg in &call.arguments {
        folded.push(fold.fold_arg(arg.as_expression()?)?);
    }
    let bound = bind_params(descriptor, &folded)?;
    eval_expr(&descriptor.body, &bound)
}

/// Bind folded arguments to params, evaluating defaults against earlier ones.
/// A missing required argument refuses; extra arguments are ignored.
fn bind_params(descriptor: &PureFn, folded: &[FenceValue]) -> Option<Vec<FenceValue>> {
    let mut bound = Vec::with_capacity(descriptor.params.len());
    for index in 0..descriptor.params.len() {
        if let Some(arg) = folded.get(index) {
            bound.push(arg.clone());
        } else if let Some(Some(default)) = descriptor.defaults.get(index) {
            bound.push(eval_expr(default, &bound)?);
        } else {
            return None;
        }
    }
    Some(bound)
}

/// Resolve a callee through wrappers: a bound descriptor, or an inline IIFE.
fn resolve_callee<'a>(scoped: Scoped<'a>, callee: &Expression<'_>) -> Option<Callee<'a>> {
    let mut callee = callee;
    while let Some(inner) = unwrap_wrapper_target(callee) {
        callee = inner;
    }
    match callee {
        Expression::Identifier(ident) => {
            let func = scoped.pure_fn(ident.name.as_str())?;
            Some(Callee::Bound(func))
        }
        Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => {
            let func = super::fence::lower_callable_expr(callee, scoped)?;
            Some(Callee::Inline(func))
        }
        _ => None,
    }
}

/// A resolved callee: a table-bound descriptor or an inline IIFE lowering.
enum Callee<'a> {
    Bound(&'a PureFn),
    Inline(PureFn),
}

impl Callee<'_> {
    /// The descriptor either variant carries.
    fn descriptor(&self) -> &PureFn {
        match self {
            Callee::Bound(func) => func,
            Callee::Inline(func) => func,
        }
    }
}
