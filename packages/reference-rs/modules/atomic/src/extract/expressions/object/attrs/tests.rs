//! CSS-object attribute tests: `css()` object, member, and merge-list arguments lowered through the
//! compiler, pinned against their diagnostics and wants. Each case compiles a snippet with a css
//! object argument and asserts on the located warnings, help lines, and emitted declarations. Takes
//! source snippets through the public compile entry and emits assertions only.

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

/// A mutated bag `css` base names the hoist fix with its write phrase.
#[test]
fn bag_mutated_css_help_names_hoist_with_write() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         let styles = { color: 'red' };\
         styles = { color: 'blue' };\
         export const el = <Div {...{ css: styles }} />;",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::MutatedBinding);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("mutated bag carries help");
    assert_eq!(help.len(), 1);
    assert!(
        help[0].starts_with("hoist 'styles' above the style call and stop reassigning it ("),
        "unexpected help: {help:?}"
    );
    assert!(
        help[0].contains("reassigned at"),
        "names the write: {help:?}"
    );
}

/// A non-object bag `css` value names the prop and kind in its fix.
#[test]
fn bag_css_kind_help_names_prop_and_kind() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         declare const getStyles: () => object;\
         export const el = <Div {...{ css: getStyles() }} />;",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectJsxStyle);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("bag css carries help");
    assert_eq!(help.len(), 1);
    assert!(
        help[0].starts_with("pass a static style object to 'css' (got "),
        "unexpected help: {help:?}"
    );
}

/// A dynamic bag merge-list spread names the spread element in its fix.
#[test]
fn bag_css_spread_help_names_spread_element() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         declare const extras: object[];\
         export const el = <Div {...{ css: [...extras] }} />;",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectJsxStyle);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "pass a static style object to 'css' (got spread element)".to_string()
        ])
    );
}
