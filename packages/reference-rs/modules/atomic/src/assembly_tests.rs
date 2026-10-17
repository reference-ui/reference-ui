//! Assembly tests: the composed-system qualifier list and the own/external plan partition.
//! Each case compiles one virtual file against the lib fixture with the proof channel on,
//! then reads plans, the css map, the atom count, and diagnostics off the result.
//! Qualifier cases pin the own-first, deduped, minus-own list `finish` hands the plan builder.

use super::qualifiers_for;
use crate::diagnostics::DiagnosticCode;
use crate::{compile, BaseSystem, CompileRequest, VirtualSource};

#[test]
fn qualifiers_are_own_first_deduped_and_minus_own() {
    let upstream = vec![
        "@reference-ui/lib".to_string(),
        "bench".to_string(),
        "@reference-ui/lib".to_string(),
        "own".to_string(),
    ];
    assert_eq!(
        qualifiers_for("own", &upstream),
        vec!["own", "@reference-ui/lib", "bench"]
    );
}

#[test]
fn qualifiers_solo_own_when_standalone() {
    assert_eq!(qualifiers_for("own", &[]), vec!["own"]);
}

fn compile_props(upstream: Vec<String>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: "import { Div } from '@reference-ui/react';\
                      export const a = <Div mt=\"2r\" />;\
                      export const b = <BoltIcon color=\"red\" />;"
                .into(),
        }]),
        base_system: BaseSystem::lib_fixture().clone(),
        upstream_systems: upstream,
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

fn compile_code(code: &str, upstream: Vec<String>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: code.into(),
        }]),
        base_system: BaseSystem::lib_fixture().clone(),
        upstream_systems: upstream,
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

#[test]
fn external_decl_expands_one_plan_per_foreign_qualifier() {
    let res = compile_props(vec!["@reference-ui/icons".to_string()]);
    // Own declaration keeps exactly one plan on the own system.
    let own: Vec<_> = res
        .style_plans
        .iter()
        .filter(|plan| plan.prop == "mt")
        .collect();
    assert_eq!(own.len(), 1, "{:?}", res.style_plans);
    assert_eq!(own[0].system, "@reference-ui/lib");
    // External declaration takes one plan on the foreign qualifier.
    let external: Vec<_> = res
        .style_plans
        .iter()
        .filter(|plan| plan.prop == "color")
        .collect();
    assert_eq!(external.len(), 1, "{:?}", res.style_plans);
    assert_eq!(external[0].system, "@reference-ui/icons");
    assert_eq!(
        external[0].declarations[0].class_name,
        "@reference-ui/icons__c_red"
    );
    // The proof css map stays own-only: the external class is not indexed.
    let css = res.css.expect("proof css map");
    assert_eq!(
        css.classes.get("color:red"),
        None,
        "external atom stays out of the own css map"
    );
    // atom_count counts both partitions.
    assert_eq!(res.atom_count, 2);
}

#[test]
fn external_decl_needs_a_foreign_qualifier_to_plan() {
    let res = compile_props(Vec::new());
    assert!(
        res.style_plans.iter().all(|plan| plan.prop != "color"),
        "no foreign qualifier means no external plan: {:?}",
        res.style_plans
    );
    // The external atom still resolves and counts.
    assert_eq!(res.atom_count, 2);
}

/// A covered external expectation is silent: analysis predicts the
/// foreign-qualified key and the foreign plan backs it, so the join
/// proves nothing absent.
#[test]
fn covered_external_expectation_is_silent() {
    let res = compile_props(vec!["@reference-ui/icons".to_string()]);
    assert!(
        res.diagnostics.is_empty(),
        "covered external key stays silent: {:?}",
        res.diagnostics
    );
    assert!(
        res.style_plans
            .iter()
            .any(|plan| plan.prop == "color" && plan.system == "@reference-ui/icons"),
        "the foreign plan is present: {:?}",
        res.style_plans
    );
}

/// A missing external key warns once: the external rejection joins the
/// foreign-qualified expectation (no double-warn from a causeless miss).
#[test]
fn missing_external_key_warns_once() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         export const el = <BoltIcon _nope={{ color: 'red' }} />;",
        vec!["@reference-ui/icons".to_string()],
    );
    let misses: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|diag| {
            matches!(
                diag.code,
                DiagnosticCode::UnknownCondition | DiagnosticCode::MissingStylePlan
            )
        })
        .collect();
    assert_eq!(
        misses.len(),
        1,
        "exactly one miss warning, not a double-warn: {:?}",
        res.diagnostics
    );
    assert_eq!(misses[0].code, DiagnosticCode::UnknownCondition);
}
