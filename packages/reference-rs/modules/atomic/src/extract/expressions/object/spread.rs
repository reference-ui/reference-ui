//! Spread arguments in style objects: inline, const, member, call, and branching.
//! A spread unpacks whatever static object its argument names — an inline
//! literal, a recorded const, a nested member path, or a folded pure-call
//! return — lowering entries exactly as if written in place. Conditional and
//! logical spreads lower every live arm; anything else warns once with its
//! siblings kept, naming the write when the base was mutated.

use oxc_ast::ast::{ConditionalExpression, Expression, SpreadElement};
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::{lower_const_object, walk_style_object, ObjectWalk};
use crate::diagnostics::DiagnosticCode;

pub(crate) fn handle_spread_property(
    ctx: &mut ObjectWalk<'_>,
    spread: &SpreadElement<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // ...{ margin: '10px' }
    walk_spread_argument(ctx, &spread.argument, when);
}

/// Unpack a spread argument: inline objects, identifier local consts, or warn.
pub fn walk_spread_argument(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if walk_spread_value(ctx, expr, when) {
        return;
    }
    if walk_spread_branching(ctx, expr, when) {
        return;
    }
    // ...maybeFn()
    ctx.warn(
        expr.span(),
        DiagnosticCode::UnfoldableSpread,
        "Dynamic object spread encountered in style object; keeping sibling properties",
    );
}

fn walk_spread_value(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ObjectExpression(inner_obj) => {
            // ...{ margin: '10px' }
            walk_style_object(ctx, inner_obj, when);
            true
        }
        Expression::Identifier(ident) => {
            // ...base  after  const base = { mt: '2r' }
            unpack_local_const_object(ctx, ident.name.as_str(), when, ident.span);
            true
        }
        Expression::ParenthesizedExpression(p) => {
            // ...({ margin: '10px' })
            walk_spread_argument(ctx, &p.expression, when);
            true
        }
        Expression::StaticMemberExpression(mem) => {
            // ...styles.hover  — member-hop spread over a nested const object
            unpack_member_const_object(ctx, mem, when);
            true
        }
        Expression::CallExpression(call) => {
            // ...getStyles()  — the folded object lowers exactly as if spread
            spread_pure_call(ctx, call, when);
            true
        }
        _ => false,
    }
}

/// Spread a pure-helper call: a folded object lowers entry by entry with
/// plans, refused fragments warn, and anything else warns the generic
/// spread diagnostic — naming the write for a reassigned callee.
fn spread_pure_call(
    ctx: &mut ObjectWalk<'_>,
    call: &oxc_ast::ast::CallExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_pure_call(call, ctx.scopes);
    if let Some(crate::extract::fold::FenceValue::Object(entries)) = fold.value {
        for refusal in &fold.refusals {
            ctx.warn(
                refusal.span(),
                DiagnosticCode::DynamicExpression,
                refusal.message_for_spread(),
            );
        }
        emit_spread_residue(ctx, call.span, fold.residue.as_deref());
        crate::extract::fold::lower_call_spread(ctx, &entries, when, call.span);
        return;
    }
    if fold.value.is_some() {
        // ...sizes()  — a spread needs an object, not leaves or an array
        ctx.warn(
            call.span,
            DiagnosticCode::UnfoldableSpread,
            "Dynamic object spread encountered in style object; keeping sibling properties",
        );
        return;
    }
    let mut callee = &call.callee;
    while let Some(inner) = crate::extract::expressions::walk::unwrap_wrapper_target(callee) {
        callee = inner;
    }
    if let Expression::Identifier(ident) = callee {
        if let Some(write) = ctx.scopes.mutation(ident.name.as_str()) {
            ctx.warn(
                call.span,
                DiagnosticCode::MutatedBinding,
                format!(
                    "Dynamic mutated binding '{}' spread in style object ({}; keeping sibling properties)",
                    ident.name.as_str(),
                    write.write_phrase()
                ),
            );
            return;
        }
    }
    // ...maybeFn()  — dynamic, warn, keep siblings
    ctx.warn(
        call.span,
        DiagnosticCode::UnfoldableSpread,
        "Dynamic object spread encountered in style object; keeping sibling properties",
    );
}

/// Warn when a spread call's callee baked a dropped dynamic arm (Ph4
/// residue channel). Runs only for folded object spreads, beside the refusals.
fn emit_spread_residue(ctx: &mut ObjectWalk<'_>, span: Span, residue: Option<&str>) {
    if let Some(subject) = residue {
        ctx.warn(
            span,
            DiagnosticCode::PartialObjectProp,
            format!("{subject} drops a dynamic arm with no static style value"),
        );
    }
}

/// Unpack a member-hop spread over its nested entries, or diagnose the miss.
///
/// A miss names the write when the root is mutated, else warns the generic
/// spread diagnostic — the same vocabulary as identifier spreads.
fn unpack_member_const_object(
    ctx: &mut ObjectWalk<'_>,
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(obj) = crate::extract::fold::member_path_object(mem, ctx.scopes) {
        let name = crate::extract::fold::member_path_text(mem);
        lower_const_object(ctx, &name, obj, when, mem.span);
        return;
    }
    // ...styles.missing  — not a recorded object; a rootless base warns generic
    let root = crate::extract::fold::member_root_name(mem).unwrap_or("");
    spread_miss_warn(ctx, root, mem.span);
}

fn walk_spread_branching(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // ...(on ? { padding: '10px' } : { gap: '8px' })  — both arms
            // lower; a folded test lowers the live arm only and names the dead
            spread_conditional(ctx, cond, when);
            true
        }
        Expression::LogicalExpression(log) => {
            // ...(unk && { padding: '10px' })  /  ...(unk || { margin: '20px' })
            walk_spread_argument(ctx, &log.left, when);
            walk_spread_argument(ctx, &log.right, when);
            true
        }
        _ => false,
    }
}

/// Lower a conditional spread: the live arm when the test folds, else both.
fn spread_conditional(
    ctx: &mut ObjectWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_spread_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        walk_spread_argument(ctx, &cond.consequent, when);
        walk_spread_argument(ctx, &cond.alternate, when);
        return;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_spread_dead_arms(ctx, std::slice::from_ref(&arm));
    walk_spread_argument(ctx, live, when);
}

/// Report one info diagnostic per arm eliminated from a spread test.
fn emit_spread_dead_arms(ctx: &mut ObjectWalk<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message("in style object spread"),
        );
    }
}

/// Warn on an unresolvable spread, naming the write when the name is mutated.
fn spread_miss_warn(ctx: &mut ObjectWalk<'_>, name: &str, span: Span) {
    if let Some(write) = ctx.scopes.mutation(name) {
        // css({ ...palette })  after  palette.color = 'blue'
        ctx.warn(
            span,
            DiagnosticCode::MutatedBinding,
            format!(
                "Dynamic mutated binding '{name}' spread in style object ({}; keeping sibling properties)",
                write.write_phrase()
            ),
        );
        return;
    }
    ctx.warn(
        span,
        DiagnosticCode::UnfoldableSpread,
        "Dynamic object spread encountered in style object; keeping sibling properties",
    );
}

fn unpack_local_const_object(
    ctx: &mut ObjectWalk<'_>,
    name: &str,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    let Some(obj) = ctx.scopes.object(name) else {
        // ...unknown  — not a file-top const object
        spread_miss_warn(ctx, name, span);
        return;
    };
    lower_const_object(ctx, name, obj, when, span);
}
