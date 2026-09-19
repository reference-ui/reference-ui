//! Branching value positions: ternaries, logicals, and responsive shapes.
//! Open ternaries scoop both branches and open logicals scoop both operands,
//! while folded tests and all-literal short-circuits compile only the live
//! value with an info naming the dead arm. Arrays and objects lower through
//! the responsive node, so breakpoint ordering stays in one place.

use oxc_ast::ast::{ConditionalExpression, Expression, LogicalExpression};
use oxc_span::Span;
use smallvec::SmallVec;

use super::{walk_expression, ExpressionWalk};
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticCode;

pub(crate) fn walk_branching(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // bg={on ? 'n300' : 'n100'}
            walk_conditional(ctx, cond, when);
            true
        }
        Expression::LogicalExpression(log) => {
            // bg={isSelected && 'n200'}  /  color={'red' || 'blue'}
            walk_logical(ctx, log, when);
            true
        }
        Expression::ArrayExpression(arr) => {
            // mt={['1r', '2r', '4r']}
            super::super::responsive::walk_array(ctx, arr, when);
            true
        }
        Expression::ObjectExpression(obj) => {
            // width={{ base: '50px', md: '60px' }}
            super::super::responsive::walk_object(ctx, obj, when);
            true
        }
        _ => false,
    }
}

fn walk_conditional(
    ctx: &mut ExpressionWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        // bg={on ? 'n300' : 'n100'}  — both leaves, ignore `on`
        walk_expression(ctx, &cond.consequent, when);
        walk_expression(ctx, &cond.alternate, when);
        return;
    };
    // color={true ? 'white' : 'black'}  — the live arm only, plus an info
    // naming the dead arm; the runtime picks the same arm every time
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_dead_arms(ctx, std::slice::from_ref(&arm));
    walk_expression(ctx, live, when);
}

fn walk_logical(
    ctx: &mut ExpressionWalk<'_>,
    log: &LogicalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_logical(log.operator, &log.left, &log.right, ctx.scopes);
    if let Some(value) = fold.value {
        // color={'red' || 'blue'}  — the picked operand only, no dead atom
        emit_dead_arms(ctx, &fold.dead_arms);
        push_folded_want(ctx, &value, when, log.span);
        return;
    }
    // border={false && '1px solid'}  — guards skip, the rest walks both
    if !is_guard_expression(&log.left) {
        walk_expression(ctx, &log.left, when);
    }
    if !is_guard_expression(&log.right) {
        walk_expression(ctx, &log.right, when);
    }
}

/// Report one info diagnostic per eliminated dead arm at this prop.
pub(crate) fn emit_dead_arms(ctx: &mut ExpressionWalk<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        let prop = ctx.prop;
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message(&format!("for prop '{prop}'")),
        );
    }
}

/// Push one folded value, honoring the `!important` suffix on strings.
pub(crate) fn push_folded_want(
    ctx: &mut ExpressionWalk<'_>,
    value: &AtomValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    if let AtomValue::String(text) = value {
        let (clean, important) = super::super::literal::split_important_flag(text);
        ctx.push_want(
            AtomValue::String(clean.into()),
            when.clone(),
            important,
            Some(span),
        );
        return;
    }
    ctx.push_want(value.clone(), when.clone(), false, Some(span));
}

pub(crate) fn is_guard_expression(expr: &Expression<'_>) -> bool {
    // false && '1px solid'  /  null && '2px solid'  /  (a === b) && 'n200'
    matches!(
        expr,
        Expression::BooleanLiteral(_)
            | Expression::BinaryExpression(_)
            | Expression::NullLiteral(_)
    ) || is_undefined_or_null_ident(expr)
}

fn is_undefined_or_null_ident(expr: &Expression<'_>) -> bool {
    // undefined && 'n200'
    if let Expression::Identifier(ident) = expr {
        ident.name == "undefined" || ident.name == "null"
    } else {
        false
    }
}
