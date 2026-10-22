//! Condition keys and condition-block values in style objects.
//! A condition key is a pseudo prop, a breakpoint name or a range over the
//! scale's names, or a parent reference; its value must be an object,
//! optionally behind a ternary whose folded test picks the live arm. Scalar
//! condition values refuse exactly like inline conditions everywhere else, so
//! walked and recorded objects diagnose alike.

use oxc_ast::ast::{ConditionalExpression, Expression};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::{walk_style_object, ObjectWalk};
use crate::diagnostics::DiagnosticCode;
use crate::resolve::conditions::pseudoselectors::has_parent_reference;
use base_system::{is_breakpoint_range_key, BreakpointScale};
use canon::is_condition_prop;

pub(crate) fn is_condition_key(key: &str, breakpoints: &BreakpointScale) -> bool {
    is_condition_prop(key)
        || breakpoints.names().iter().any(|n| n == key)
        || is_breakpoint_range_key(key, breakpoints)
        || has_parent_reference(key)
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
    use crate::resolve::conditions::{lower_when, LoweredWhen};
    use crate::{compile, CompileRequest, VirtualSource};
    use base_system::BreakpointScale;

    fn compile_logs(code: &str) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource { path: "test.tsx".into(), content: code.into() }]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    /// The literals typegen prints as `BreakpointKey` for `system`.
    fn typegen_breakpoint_keys(system: &crate::BaseSystem) -> Vec<String> {
        let dts = typegen::emit_dts(system);
        let union = dts
            .lines()
            .find_map(|line| line.strip_prefix("export type BreakpointKey = "))
            .expect("typegen prints BreakpointKey");
        union
            .trim_end_matches(';')
            .split('|')
            .map(|lit| lit.trim().trim_matches(['"', '\''].as_slice()).to_string())
            .collect()
    }

    /// Every `BreakpointKey` typegen prints for the lib fixture (`2xl`
    /// included) is a condition key here, so typed keys never fall to the
    /// unknown-property gate.
    #[test]
    fn typegen_breakpoint_keys_are_condition_keys() {
        let system = crate::BaseSystem::lib_fixture();
        let keys = typegen_breakpoint_keys(system);
        assert!(
            keys.iter().any(|k| k == "2xlOnly") && keys.iter().any(|k| k == "xlTo2xl"),
            "{keys:?}"
        );
        for key in &keys {
            assert!(
                super::is_condition_key(key, system.breakpoints()),
                "{key} is a typed breakpoint key"
            );
        }
    }

    /// Custom scales whose names contain `To`, end in `Down`, or make a
    /// reversed pair: every range key typegen prints must be a condition key
    /// to extract and must lower to a range in resolve. Widths are declared,
    /// so only the name shape can make a printed key fail.
    #[test]
    fn typegen_custom_range_keys_are_read_as_ranges() {
        let scales: [&[(&str, &str)]; 3] = [
            &[("xTo", "600"), ("y", "900")],
            &[("tob", "300"), ("a", "400"), ("aTo", "500"), ("b", "900")],
            &[("sm", "640"), ("wideDown", "1000"), ("lg", "1024")],
        ];
        let disagreements: Vec<String> =
            scales.iter().flat_map(|pairs| refusals_in(pairs)).collect();
        assert!(disagreements.is_empty(), "{}", disagreements.join("\n"));
    }

    /// The printed range keys for one custom scale that extract or resolve refuses.
    fn refusals_in(pairs: &[(&str, &str)]) -> Vec<String> {
        let system = crate::BaseSystem {
            breakpoints: BreakpointScale::from_named_widths(pairs.iter().copied()),
            ..crate::BaseSystem::lib_fixture().clone()
        };
        typegen_breakpoint_keys(&system)
            .into_iter()
            .filter(|key| key.as_str() != "base" && !system.breakpoints().names().contains(key))
            .filter_map(|key| refusal(&key, &system).map(|why| format!("{key} ({pairs:?}): {why}")))
            .collect()
    }

    /// Why extract or resolve refuses a printed key, or `None` when both read it.
    fn refusal(key: &str, system: &crate::BaseSystem) -> Option<&'static str> {
        if !super::is_condition_key(key, system.breakpoints()) {
            Some("extract reads no breakpoint")
        } else if matches!(lower_when(key, system), LoweredWhen::Known(_)) {
            None
        } else {
            Some("resolve does not lower it")
        }
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
