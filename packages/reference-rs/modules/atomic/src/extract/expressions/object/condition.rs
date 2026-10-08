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
    key: &str,
) {
    match value {
        Expression::ObjectExpression(inner_obj) => {
            // _hover: { color: 'red' }
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            // _hover: on ? { color: 'red' } : { color: 'blue' }  — both arms
            // lower; a folded test lowers the live arm only and names the dead
            condition_ternary(ctx, cond, when, key);
        }
        Expression::ParenthesizedExpression(p) => {
            // _hover: ({ color: 'red' })
            handle_condition_value(ctx, &p.expression, when, key);
        }
        _ => {
            // _hover: 'red'  — not an object
            ctx.warn_help(
                value.span(),
                DiagnosticCode::NonObjectCondition,
                "Condition block expected object expression",
                vec![format!("give condition '{key}' a style object")],
            );
        }
    }
}

/// Lower a conditional condition value: the live arm when folded, else both.
fn condition_ternary(
    ctx: &mut ObjectWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
    key: &str,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_condition_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        handle_condition_value(ctx, &cond.consequent, when, key);
        handle_condition_value(ctx, &cond.alternate, when, key);
        return;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_condition_dead_arms(ctx, std::slice::from_ref(&arm));
    handle_condition_value(ctx, live, when, key);
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

#[cfg(test)]
mod tests {
    use crate::{compile, CompileRequest, VirtualSource};

    fn compile_logs(code: &str) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource { path: "test.tsx".into(), content: code.into() }]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    /// A scalar condition block names the condition key in its fix.
    #[test]
    fn scalar_condition_help_names_the_condition_key() {
        let res = compile_logs(
            "import { css } from '@reference-ui/react';\
             export const cls = css({ _hover: 'red' });",
        );
        let hits: Vec<_> = res
            .compiler_diagnostics
            .as_deref()
            .expect("compiler channel requested")
            .iter()
            .filter(|d| d.code == crate::diagnostics::DiagnosticCode::NonObjectCondition)
            .collect();
        assert_eq!(hits.len(), 1);
        assert_eq!(
            hits[0].help,
            Some(vec!["give condition '_hover' a style object".to_string()])
        );
    }
}
