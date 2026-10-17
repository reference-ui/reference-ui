//! JSX tests: style props on host and component tags, spreads, and threaded wrappers, pinned
//! through the compiler's diagnostics and wants. Each case compiles a snippet with a JSX element
//! and asserts on the located warnings, help lines, and emitted declarations. Takes source snippets
//! through the public compile entry and emits assertions only.

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

/// A non-object `css` attr names the prop and the got-kind in its fix.
#[test]
fn jsx_style_kind_help_names_prop_and_kind() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         declare const getStyles: () => object;\
         export const el = <Div css={getStyles()} />;",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectJsxStyle);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("jsx style carries help");
    assert_eq!(help.len(), 1);
    assert!(
        help[0].starts_with("pass a static style object to 'css' (got "),
        "unexpected help: {help:?}"
    );
}

/// A bare weight beside a family resolves the family's scale, not keywords.
#[test]
fn jsx_bare_weight_resolves_against_element_font() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         export const el = <Div font=\"sans\" weight=\"thin\" />;",
    );
    assert!(
        res.stylesheet.contains("font-weight: 200;"),
        "sans thin renders 200, not the 100 keyword: {}",
        res.stylesheet
    );
    let lone = compile_logs(
        "import { Div } from '@reference-ui/react';\
         export const el = <Div weight=\"thin\" />;",
    );
    assert!(
        lone.stylesheet.contains("font-weight: 100;"),
        "family-less thin keeps the keyword: {}",
        lone.stylesheet
    );
}

/// A mutated `css` attr base names the hoist fix with its write phrase.
#[test]
fn jsx_mutated_attr_help_names_hoist_with_write() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         let styles = { color: 'red' };\
         styles = { color: 'blue' };\
         export const el = <Div css={styles} />;",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::MutatedBinding);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("mutated attr carries help");
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
