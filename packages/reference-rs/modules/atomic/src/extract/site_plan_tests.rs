//! Plan parity for wants that arrive through indirection (RS-14, RS-37).
//! Ternary arms, member access, and identifier spreads already emit wants and
//! utilities; these tests prove they also emit one runtime style plan per
//! want, so the plan index the runtime resolves through never misses a leaf.
//! RS-37 extends the suite to values bound through a const ternary or logical,
//! top-level or nested in a component body. Each plan must carry declarations
//! naming classes the css map emits.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// Assert exactly `count` unknown-color diagnostics and nothing else: bare
/// non-token values on color props warn since Forge Slice 1 (§11).
fn assert_unknown_colors(res: &crate::CompileResult, count: usize) {
    assert_eq!(res.diagnostics.len(), count);
    assert!(res
        .diagnostics
        .iter()
        .all(|d| d.message.contains("neither a color token")));
}

fn plan_values(res: &crate::CompileResult, prop: &str) -> Vec<String> {
    res.runtime
        .style_plans
        .iter()
        .filter(|plan| plan.prop == prop)
        .filter_map(|plan| plan.value.as_str().map(str::to_string))
        .collect()
}

fn assert_plans_point_at_sheet(res: &crate::CompileResult, prop: &str) {
    let emitted: Vec<&str> = res
        .css
        .iter()
        .flat_map(|css| css.classes.values().map(String::as_str))
        .collect();
    let mut seen = 0;
    for plan in res
        .runtime
        .style_plans
        .iter()
        .filter(|plan| plan.prop == prop)
    {
        assert!(
            !plan.declarations.is_empty(),
            "plan ({prop}, {}) carries declarations",
            plan.value
        );
        for decl in &plan.declarations {
            assert!(
                emitted.contains(&decl.class_name.as_str()),
                "plan class {} is an emitted utility",
                decl.class_name
            );
        }
        seen += 1;
    }
    assert!(seen > 0, "expected at least one {prop} plan");
}

#[test]
fn test_ternary_arms_emit_one_plan_per_arm() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        export const cls = css({ color: flag ? 'cherry' : 'ocean' });
        "#,
    );
    assert_eq!(res.wants.len(), 2);
    let mut plans = plan_values(&res, "color");
    plans.sort();
    assert_eq!(plans, vec!["cherry".to_string(), "ocean".to_string()]);
    assert_plans_point_at_sheet(&res, "color");
    assert_unknown_colors(&res, 2);
}

#[test]
fn test_member_access_emits_plan() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const theme = { primary: 'cherry' };
        export const cls = css({ color: theme.primary });
        "#,
    );
    assert_eq!(res.wants.len(), 1);
    assert_eq!(plan_values(&res, "color"), vec!["cherry".to_string()]);
    assert_plans_point_at_sheet(&res, "color");
    assert_unknown_colors(&res, 1);
}

#[test]
fn test_identifier_spread_emits_plan_beside_sibling() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const rest = { mt: 'gap' };
        export const cls = css({ color: 'cherry', ...rest });
        "#,
    );
    assert_eq!(res.wants.len(), 2);
    assert_eq!(plan_values(&res, "color"), vec!["cherry".to_string()]);
    assert_eq!(plan_values(&res, "mt"), vec!["gap".to_string()]);
    assert_plans_point_at_sheet(&res, "color");
    assert_plans_point_at_sheet(&res, "mt");
    assert_unknown_colors(&res, 1);
}

#[test]
fn test_function_const_ternary_emits_one_plan_per_arm() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        export function Shell({ theme }: { theme: string }) {
          const isDark = theme === 'dark';
          const subtleBorder = isDark ? 'gray.800' : 'gray.200';
          return <Div borderBottom="1px solid" borderBottomColor={subtleBorder} />;
        }
        "#,
    );
    let mut wants: Vec<String> = res
        .wants
        .iter()
        .filter(|w| w.prop.as_ref() == "borderBottomColor")
        .map(|w| w.value.class_name_str().to_string())
        .collect();
    wants.sort();
    assert_eq!(wants, vec!["gray.200".to_string(), "gray.800".to_string()]);
    let mut plans = plan_values(&res, "borderBottomColor");
    plans.sort();
    assert_eq!(plans, vec!["gray.200".to_string(), "gray.800".to_string()]);
    assert_plans_point_at_sheet(&res, "borderBottomColor");
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_top_level_const_ternary_emits_one_plan_per_arm() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const tone = flag ? 'cherry' : 'ocean';
        export const cls = css({ color: tone });
        "#,
    );
    assert_eq!(res.wants.len(), 2);
    let mut plans = plan_values(&res, "color");
    plans.sort();
    assert_eq!(plans, vec!["cherry".to_string(), "ocean".to_string()]);
    assert_plans_point_at_sheet(&res, "color");
    assert_unknown_colors(&res, 2);
}

#[test]
fn test_function_const_literal_emits_plan() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        export function Card() {
          const edge = 'gray.800';
          return <Div borderBottomColor={edge} />;
        }
        "#,
    );
    assert_eq!(res.wants.len(), 1);
    assert_eq!(
        plan_values(&res, "borderBottomColor"),
        vec!["gray.800".to_string()]
    );
    assert_plans_point_at_sheet(&res, "borderBottomColor");
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_const_logical_emits_nonguard_leaf() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const tone = flag && 'cherry';
        export const cls = css({ color: tone });
        "#,
    );
    assert_eq!(res.wants.len(), 1);
    assert_eq!(plan_values(&res, "color"), vec!["cherry".to_string()]);
    assert_plans_point_at_sheet(&res, "color");
    assert_unknown_colors(&res, 1);
}

#[test]
fn test_tabs_selected_guard_keeps_both_indicator_arms() {
    // Tabs Tab: `const isSelected = context ? context.value === value : false`
    // gates `borderBottom={isSelected ? '3px solid' : '3px solid transparent'}`.
    // The binding has one dynamic arm and one literal arm, so the test stays
    // open and both arms must emit plans (no white indicator otherwise).
    let res = compile_code(
        r#"
        import { Button } from '@reference-ui/react';
        export const Tab = ({ value }) => {
          const context = useTabsContext();
          const isSelected = context ? context.value === value : false;
          return <Button borderBottom={isSelected ? '3px solid' : '3px solid transparent'} />;
        };
        "#,
    );
    let mut plans = plan_values(&res, "borderBottom");
    plans.sort();
    assert_eq!(
        plans,
        vec![
            "3px solid".to_string(),
            "3px solid transparent".to_string()
        ]
    );
    assert_plans_point_at_sheet(&res, "borderBottom");
}

#[test]
fn test_disabled_coalesce_guard_keeps_both_arms() {
    // Tabs Tab: `const isDisabled = disabledProp ?? context?.disabled ?? false`
    // gates `cursor={isDisabled ? 'not-allowed' : 'pointer'}`. Every operand
    // but the `false` is dynamic, so the test stays open and both arms emit.
    let res = compile_code(
        r#"
        import { Button } from '@reference-ui/react';
        export const Tab = ({ value, disabledProp }) => {
          const context = useTabsContext();
          const isDisabled = disabledProp ?? context?.disabled ?? false;
          return <Button cursor={isDisabled ? 'not-allowed' : 'pointer'} />;
        };
        "#,
    );
    let mut plans = plan_values(&res, "cursor");
    plans.sort();
    assert_eq!(
        plans,
        vec!["not-allowed".to_string(), "pointer".to_string()]
    );
    assert_plans_point_at_sheet(&res, "cursor");
}

#[test]
fn test_negated_partial_guard_keeps_both_arms() {
    // `!isSelected` over a partially static binding must not fold on the
    // kept leaf: the unary sees the dropped arm and the test stays open.
    let res = compile_code(
        r#"
        import { Button } from '@reference-ui/react';
        export const Tab = ({ value }) => {
          const context = useTabsContext();
          const isSelected = context ? context.value === value : false;
          return <Button cursor={!isSelected ? 'not-allowed' : 'pointer'} />;
        };
        "#,
    );
    let mut plans = plan_values(&res, "cursor");
    plans.sort();
    assert_eq!(
        plans,
        vec!["not-allowed".to_string(), "pointer".to_string()]
    );
    assert_plans_point_at_sheet(&res, "cursor");
}

#[test]
fn test_partial_guard_gates_css_object_arms() {
    // A partially static binding gating whole css() objects keeps both
    // blocks: the arg test stays open exactly like a style-prop test.
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const context = useTabsContext();
        const isSelected = context ? context.value === value : false;
        export const cls = css(
          isSelected ? { borderBottom: '3px solid' } : { borderBottom: '3px solid transparent' },
        );
        "#,
    );
    let mut plans = plan_values(&res, "borderBottom");
    plans.sort();
    assert_eq!(
        plans,
        vec![
            "3px solid".to_string(),
            "3px solid transparent".to_string()
        ]
    );
    assert_plans_point_at_sheet(&res, "borderBottom");
}

#[test]
fn test_partial_member_guard_keeps_both_arms() {
    // A member read over a partially static entry (`{ sel: c ? dyn : false }`)
    // keeps its leaves for values but never folds a test on them.
    let res = compile_code(
        r#"
        import { Button } from '@reference-ui/react';
        export const Tab = ({ value }) => {
          const context = useTabsContext();
          const part = { sel: context ? context.value === value : false };
          return <Button cursor={part.sel ? 'not-allowed' : 'pointer'} />;
        };
        "#,
    );
    let mut plans = plan_values(&res, "cursor");
    plans.sort();
    assert_eq!(
        plans,
        vec!["not-allowed".to_string(), "pointer".to_string()]
    );
    assert_plans_point_at_sheet(&res, "cursor");
}

#[test]
fn test_const_nested_ternary_scoops_every_arm() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const tone = a ? 'cherry' : b ? 'ocean' : 'moss';
        export const cls = css({ color: tone });
        "#,
    );
    assert_eq!(res.wants.len(), 3);
    let mut plans = plan_values(&res, "color");
    plans.sort();
    assert_eq!(
        plans,
        vec![
            "cherry".to_string(),
            "moss".to_string(),
            "ocean".to_string()
        ]
    );
    assert_plans_point_at_sheet(&res, "color");
    assert_unknown_colors(&res, 3);
}
