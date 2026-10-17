//! Entry-lowering tests: a recorded const entry lowered as if spread, pinned through the compiler's
//! diagnostics and wants. Each case compiles a snippet that spreads or passes a const object and
//! asserts on the located warnings, help lines, and emitted declarations. Takes source snippets
//! through the public compile entry and emits assertions only.

use crate::diagnostics::DiagnosticSeverity;
use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: code.into(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

fn compile_logs(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: code.into(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

fn channel_for(
    res: &crate::CompileResult,
    code: crate::diagnostics::DiagnosticCode,
) -> Vec<crate::Diagnostic> {
    res.compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|diag| diag.code == code)
        .cloned()
        .collect()
}

/// Const leaves split `!important` like inline literals: stripped, flagged, silent (S5-2).
#[test]
fn const_leaf_important_suffix_mints_flagged_and_silent() {
    let res = compile_code(
        "import { css } from '@reference-ui/styled';\
         const trigger = { borderBottomColor: 'transparent !important', \
         _hover: { color: 'red !important' } };\
         export const cls = css({ ...trigger });",
    );
    let site: Vec<_> = res
        .wants
        .iter()
        .filter(|w| w.origin.as_deref() != Some(crate::extract::harvest::HARVEST_ORIGIN))
        .collect();
    assert_eq!(site.len(), 2);
    for (prop, value) in [("borderBottomColor", "transparent"), ("color", "red")] {
        let want = site.iter().find(|w| &*w.prop == prop).expect("leaf mints");
        assert_eq!(want.value.to_string(), value);
        assert!(want.important);
    }
    let hover = site
        .iter()
        .find(|w| &*w.prop == "color")
        .expect("leaf mints");
    assert_eq!(hover.when.as_slice(), &["_hover".into()]);
    let loud: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|d| !matches!(d.severity, DiagnosticSeverity::Info))
        .collect();
    assert!(loud.is_empty(), "unexpected diagnostics: {loud:?}");
    assert!(res
        .stylesheet
        .contains("border-bottom-color: transparent !important;"));
    assert!(res.stylesheet.contains("color: red !important;"));
}

fn site_wants(res: &crate::CompileResult) -> Vec<&crate::Want> {
    res.wants
        .iter()
        .filter(|w| w.origin.as_deref() != Some(crate::extract::harvest::HARVEST_ORIGIN))
        .collect()
}

fn assert_color_splits(code: &str) -> crate::CompileResult {
    let res = compile_code(code);
    let site = site_wants(&res);
    let want = site
        .iter()
        .find(|w| &*w.prop == "color")
        .expect("leaf mints");
    assert_eq!(want.value.to_string(), "red");
    assert!(want.important);
    res
}

const IMPORT: &str = "import { css } from '@reference-ui/styled';";

/// Const-identifier `!` splits like the identical inline literal: stripped,
/// flagged, and silent — the stripped color clears `UnknownColor` (D pin).
#[test]
fn identifier_const_important_splits_and_clears_unknown_color() {
    let res = assert_color_splits(&format!(
        "{IMPORT} const c = 'red !important'; export const cls = css({{ color: c }});"
    ));
    assert!(
        res.diagnostics
            .iter()
            .all(|d| d.code != crate::diagnostics::DiagnosticCode::UnknownColor),
        "stripped color warns nothing: {:?}",
        res.diagnostics
    );
}

/// Static-member `!` splits like the identical inline literal (D pin).
#[test]
fn static_member_const_important_splits_like_inline() {
    assert_color_splits(&format!(
        "{IMPORT} const theme = {{ primary: 'red !important' }};\
         export const cls = css({{ color: theme.primary }});"
    ));
}

/// Computed-member `!` splits like the identical inline literal (D pin).
#[test]
fn computed_member_const_important_splits_like_inline() {
    assert_color_splits(&format!(
        "{IMPORT} const colors = {{ red: 'red !important' }};\
         export const cls = css({{ color: colors['red'] }});"
    ));
}

/// Optional-chain `!` splits like the identical inline literal (D pin).
#[test]
fn chain_const_important_splits_like_inline() {
    assert_color_splits(&format!(
        "{IMPORT} const theme = {{ primary: 'red !important' }};\
         export const cls = css({{ color: theme?.primary }});"
    ));
}

/// Spliced const-array slots split `!` exactly like the inline array (D pin).
#[test]
fn const_array_slot_important_splits_like_inline() {
    let spliced = compile_code(&format!(
        "{IMPORT} const sizes = ['1r!', '2r']; export const cls = css({{ mt: [...sizes] }});"
    ));
    let inline = compile_code(&format!(
        "{IMPORT} export const cls = css({{ mt: ['1r!', '2r'] }});"
    ));
    let shape = |res: &crate::CompileResult| {
        site_wants(res)
            .iter()
            .map(|w| {
                (
                    w.prop.to_string(),
                    w.value.to_string(),
                    w.important,
                    w.when.iter().map(|c| c.to_string()).collect::<Vec<_>>(),
                )
            })
            .collect::<Vec<_>>()
    };
    assert_eq!(shape(&spliced), shape(&inline));
    let site = site_wants(&spliced);
    let slot = site
        .iter()
        .find(|w| w.value.to_string() == "1r")
        .expect("slot mints");
    assert!(slot.important);
    assert_eq!(
        serde_json::to_value(&spliced.style_plans).expect("plans serialize"),
        serde_json::to_value(&inline.style_plans).expect("plans serialize"),
        "spliced and inline arrays plan identically"
    );
}

/// An unlowerable spread entry names its key and const in the fix.
#[test]
fn unfoldable_object_prop_help_names_key_and_const() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const pick: () => string;\
         const theme = { color: pick() };\
         export const cls = css({ ...theme });",
    );
    let hits = channel_for(
        &res,
        crate::diagnostics::DiagnosticCode::UnfoldableObjectProp,
    );
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "give 'color' of 'theme' a static value or drop it from the spread".to_string()
        ])
    );
}

/// An unlowerable responsive sub-entry names the dotted key in the fix.
#[test]
fn unfoldable_responsive_sub_help_names_dotted_key() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const pick: () => string;\
         const theme = { padding: { md: pick() } };\
         export const cls = css({ ...theme });",
    );
    let hits = channel_for(
        &res,
        crate::diagnostics::DiagnosticCode::UnfoldableObjectProp,
    );
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "give 'padding.md' of 'theme' a static value or drop it from the spread".to_string()
        ])
    );
}

/// A dropped union arm beside kept leaves names key and const in the fix.
#[test]
fn partial_object_prop_help_names_key_and_const() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const flag: boolean;\
         declare const run: () => string;\
         const theme = { color: flag ? 'white' : run() };\
         export const cls = css({ ...theme });",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::PartialObjectProp);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "make the dynamic arm of 'color' of 'theme' static or drop it".to_string()
        ])
    );
}

/// A scalar recorded condition names its key in the fix.
#[test]
fn recorded_scalar_condition_help_names_the_key() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         const theme = { _hover: 'red' };\
         export const cls = css({ ...theme });",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectCondition);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec!["give condition '_hover' a style object".to_string()])
    );
}

/// The plan carries the stripped key the runtime queries, with no orphan
/// rule under an unqueryable class (D pin).
#[test]
fn identifier_const_important_plan_key_is_runtime_queryable() {
    let res = compile_code(&format!(
        "{IMPORT} const c = 'red !important'; export const cls = css({{ color: c }});"
    ));
    let plans = serde_json::to_value(&res.style_plans).expect("plans serialize");
    let rows = plans.as_array().expect("plans array");
    assert!(
        rows.iter().any(|row| {
            row.get("prop").and_then(|p| p.as_str()) == Some("color")
                && row.get("value").and_then(|v| v.as_str()) == Some("red")
                && row.get("important").and_then(|i| i.as_bool()) == Some(true)
        }),
        "plan carries the stripped key the runtime queries (got {plans})"
    );
    assert!(
        !res.stylesheet.contains("c_red_\\!important"),
        "no orphan rule under an unqueryable class"
    );
}
