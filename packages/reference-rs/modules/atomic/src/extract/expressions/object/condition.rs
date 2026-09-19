//! Condition keys and condition-block values in style objects.
//! A condition key is a pseudo prop, a breakpoint name or range, or a parent
//! reference; its value must be an object, optionally behind a ternary whose
//! folded test picks the live arm. Scalar condition values refuse exactly
//! like inline conditions everywhere else, so walked and recorded objects
//! diagnose alike.

use oxc_ast::ast::{ConditionalExpression, Expression};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::{walk_style_object, ObjectWalk};
use crate::diagnostics::DiagnosticCode;
use crate::resolve::conditions::pseudoselectors::has_parent_reference;
use base_system::BreakpointScale;
use canon::is_condition_prop;

pub(crate) fn is_condition_key(key: &str, breakpoints: &BreakpointScale) -> bool {
    is_condition_prop(key)
        || breakpoints.names().iter().any(|n| n == key)
        || is_breakpoint_range(key, breakpoints)
        || has_parent_reference(key)
}

fn is_breakpoint_range(key: &str, breakpoints: &BreakpointScale) -> bool {
    if key.ends_with("Down") || key.ends_with("Only") {
        return true;
    }
    if let Some((from, to)) = key.split_once("To") {
        if to.eq_ignore_ascii_case("p") || to.starts_with('p') || to.starts_with('P') {
            return false;
        }
        return breakpoints
            .names()
            .iter()
            .any(|n| n.eq_ignore_ascii_case(from))
            || breakpoints
                .names()
                .iter()
                .any(|n| n.eq_ignore_ascii_case(to));
    }
    false
}

pub(crate) fn handle_condition_value(
    ctx: &mut ObjectWalk<'_>,
    value: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match value {
        Expression::ObjectExpression(inner_obj) => {
            // _hover: { color: 'red' }
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            // _hover: on ? { color: 'red' } : { color: 'blue' }  — both arms
            // lower; a folded test lowers the live arm only and names the dead
            condition_ternary(ctx, cond, when);
        }
        Expression::ParenthesizedExpression(p) => {
            // _hover: ({ color: 'red' })
            handle_condition_value(ctx, &p.expression, when);
        }
        _ => {
            // _hover: 'red'  — not an object
            ctx.warn(
                value.span(),
                DiagnosticCode::NonObjectCondition,
                "Condition block expected object expression",
            );
        }
    }
}

/// Lower a conditional condition value: the live arm when folded, else both.
fn condition_ternary(
    ctx: &mut ObjectWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_condition_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        handle_condition_value(ctx, &cond.consequent, when);
        handle_condition_value(ctx, &cond.alternate, when);
        return;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_condition_dead_arms(ctx, std::slice::from_ref(&arm));
    handle_condition_value(ctx, live, when);
}

/// Report one info diagnostic per arm eliminated from a condition test.
fn emit_condition_dead_arms(ctx: &mut ObjectWalk<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message("in condition block"),
        );
    }
}
