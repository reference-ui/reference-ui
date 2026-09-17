//! Plan parity for wants that arrive through indirection (RS-14).
//! Ternary arms, member access, and identifier spreads already emit wants and
//! utilities; these tests prove they also emit one runtime style plan per
//! want, so the plan index the runtime resolves through never misses a leaf.
//! Each plan must carry declarations naming classes the css map emits.

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
    assert!(res.diagnostics.is_empty());
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
    assert!(res.diagnostics.is_empty());
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
    assert!(res.diagnostics.is_empty());
}
