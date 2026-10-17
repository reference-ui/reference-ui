//! Spread-lowering tests: object, identifier, member, and call spreads pinned through the
//! compiler's diagnostics and emitted declarations. Each case compiles a snippet that spreads a
//! style source and asserts on the located warnings, help lines, and wants the spread produced.
//! Takes source snippets through the public compile entry and emits assertions only.

use crate::{compile, CompileRequest, VirtualSource};

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

/// An unresolvable spread names the base in its define-or-inline fix.
#[test]
fn unknown_spread_help_names_the_base() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const unknown: object;\
         export const cls = css({ ...unknown });",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::UnfoldableSpread);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "define 'unknown' as a static style object or inline it".to_string()
        ])
    );
}

/// A mutated spread base names the hoist fix with its write phrase.
#[test]
fn mutated_spread_help_names_hoist_with_write() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         let palette = { color: 'red' };\
         palette = { color: 'blue' };\
         export const cls = css({ ...palette });",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::MutatedBinding);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("mutated spread carries help");
    assert_eq!(help.len(), 1);
    assert!(
        help[0].starts_with("hoist 'palette' above the style call and stop reassigning it ("),
        "unexpected help: {help:?}"
    );
    assert!(
        help[0].contains("reassigned at"),
        "names the write: {help:?}"
    );
}

/// A refused call fragment inside a folded spread carries the hoist fix.
#[test]
fn spread_call_refusal_help_names_the_hoist_fix() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const flag: boolean;\
         declare const dyn: string;\
         function getStyles(n) { return { color: n }; }\
         export const cls = css({ ...getStyles(flag ? 'red' : dyn) });",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::DynamicExpression);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "hoist the expression into a static literal or variant".to_string()
        ])
    );
}
