//! CSS-argument tests: `css()` object, whole-object, member, ternary, and merge-list arguments
//! pinned through the compiler's diagnostics and wants. Each case compiles a snippet with a `css()`
//! call and asserts on the located warnings, help lines, and emitted declarations. Takes source
//! snippets through the public compile entry and emits assertions only.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_logs(code: &str) -> crate::CompileResult {
    compile_files_logs(&[("test.tsx", code)])
}

fn compile_files_logs(files: &[(&str, &str)]) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(
            files
                .iter()
                .map(|(path, content)| VirtualSource {
                    path: path.to_string(),
                    content: content.to_string(),
                })
                .collect(),
        ),
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

/// A bare weight beside a family in one call resolves the family's scale.
#[test]
fn css_bare_weight_resolves_against_object_font() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         export const cls = css({ font: 'mono', weight: 'normal' });",
    );
    assert!(
        res.stylesheet.contains("font-weight: 393;"),
        "mono normal renders 393, not the 400 keyword: {}",
        res.stylesheet
    );
}

/// A non-object arg names the site and the got-kind in its fix.
#[test]
fn css_arg_kind_help_names_site_and_kind() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const getStyles: () => object;\
         export const cls = css(getStyles());",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectCssArg);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("css arg carries help");
    assert_eq!(help.len(), 1);
    assert!(
        help[0].starts_with("pass a static style object as css() argument 1 (got "),
        "unexpected help: {help:?}"
    );
}

/// A spread arg names the spread element in its fix.
#[test]
fn css_spread_arg_help_names_spread_element() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         declare const args: object[];\
         export const cls = css(...args);",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectCssArg);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "pass a static style object as css() argument 1 (got spread element)".to_string()
        ])
    );
}

/// A mutated arg base names the hoist fix with its write phrase.
#[test]
fn css_mutated_arg_help_names_hoist_with_write() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         let styles = { color: 'red' };\
         styles = { color: 'blue' };\
         export const cls = css(styles);",
    );
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::MutatedBinding);
    assert_eq!(hits.len(), 1);
    let help = hits[0].help.clone().expect("mutated arg carries help");
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

/// An unreadable origin spread names the origin spread in its fix.
#[test]
fn import_residue_help_names_the_origin_spread() {
    let res = compile_files_logs(&[
        (
            "/v/src/a.ts",
            "import { b } from './b'\nexport const a = { ...b, padding: '4px' }",
        ),
        (
            "/v/src/b.ts",
            "import { a } from './a'\nexport const b = { ...a, margin: '2px' }",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { a } from './a'\nexport const x = css(a)",
        ),
    ]);
    let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::UnfoldableSpread);
    assert_eq!(hits.len(), 1);
    assert!(
        hits[0].message.contains("could not be read (cycle "),
        "unexpected message: {}",
        hits[0].message
    );
    let help = hits[0].help.clone().expect("residue marker carries help");
    assert_eq!(help.len(), 1);
    assert!(
        help[0].starts_with("define '")
            && help[0].ends_with("' as a static style object or inline it"),
        "unexpected help: {help:?}"
    );
}
