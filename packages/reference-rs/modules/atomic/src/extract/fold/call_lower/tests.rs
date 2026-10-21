//! Help text for folded spread lowering: each unknown key, breakpoint, or scalar condition warns.
//! Each warning carries a help line that names the fix, and each case asserts on the located
//! diagnostic and its help so the wording stays pinned. A folded JSX attribute bag keeps unknown
//! props silent while its `css` and `r` keys lower or refuse as their attributes do. Takes source
//! snippets through the public compile entry and emits assertions only.

use crate::atom::AtomValue;
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

/// An unknown folded-spread key suggests like a literal key, userspace.
#[test]
fn folded_spread_unknown_prop_help_suggests() {
    let res = compile_code(
        "import { css } from '@reference-ui/react';\
         function getStyles() { return { colr: 'red' }; }\
         export const cls = css({ ...getStyles() });",
    );
    let hits: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|d| d.code == crate::diagnostics::DiagnosticCode::UnknownProperty)
        .collect();
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "did you mean `color`?".to_string(),
            "remove 'colr' or check its spelling".to_string(),
        ])
    );
}

/// An unknown folded `r` key suggests the closest scale name.
#[test]
fn folded_spread_unknown_breakpoint_help_suggests() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         function getStyles() { return { r: { md2: { p: '1r' } } }; }\
         export const cls = css({ ...getStyles() });",
    );
    let hits: Vec<_> = res
        .compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|d| d.code == crate::diagnostics::DiagnosticCode::UnknownBreakpoint)
        .collect();
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "did you mean `md`?".to_string(),
            "use a breakpoint from the theme".to_string(),
        ])
    );
}

/// A scalar folded condition names its key in the fix.
#[test]
fn folded_spread_scalar_condition_help_names_the_key() {
    let res = compile_logs(
        "import { css } from '@reference-ui/react';\
         function getStyles() { return { _hover: 'red' }; }\
         export const cls = css({ ...getStyles() });",
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

/// Unknown props in a folded JSX attribute bag stay silent: the host owns them.
#[test]
fn folded_jsx_bag_unknown_props_stay_silent() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         function attrs() { return { readOnly: true, onPointerDown: 'press' }; }\
         export const App = () => <Div {...attrs()} />;",
    );
    assert!(unknown_prop_hits(&res).is_empty());
}

/// A folded JSX bag's `css` lowers its style entries, as the css attribute does.
#[test]
fn folded_jsx_bag_css_lowers_its_style_entries() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         function attrs() { return { css: { color: 'red' } }; }\
         export const App = () => <Div {...attrs()} />;",
    );
    assert!(res.wants.iter().any(|want| {
        want.prop.as_ref() == "color"
            && matches!(&want.value, AtomValue::String(text) if text.as_ref() == "red")
    }));
    assert!(unknown_prop_hits(&res).is_empty());
}

/// A scalar `css` or `r` in a folded JSX bag stays silent and mints no `r` want.
#[test]
fn folded_jsx_bag_scalar_css_and_r_stay_silent() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         function attrs() { return { css: 'red', r: 'x' }; }\
         export const App = () => <Div {...attrs()} />;",
    );
    assert!(res.wants.iter().all(|want| want.prop.as_ref() != "r"));
    assert!(unknown_prop_hits(&res).is_empty());
    assert!(compiler_hits(&res, crate::diagnostics::DiagnosticCode::NonObjectJsxStyle).is_empty());
}

/// An unknown `r` key in a folded JSX bag still warns: the r attribute resolves its breakpoints.
#[test]
fn folded_jsx_bag_unknown_breakpoint_still_warns() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         function attrs() { return { r: { md2: { padding: '1r' } } }; }\
         export const App = () => <Div {...attrs()} />;",
    );
    let hits: Vec<_> = res
        .compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|d| d.code == crate::diagnostics::DiagnosticCode::UnknownBreakpoint)
        .collect();
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "did you mean `md`?".to_string(),
            "use a breakpoint from the theme".to_string(),
        ])
    );
}

/// A folded `r` array refuses the way an array `r` attribute refuses.
#[test]
fn folded_jsx_bag_r_array_refuses() {
    let res = compile_logs(
        "import { Div } from '@reference-ui/react';\
         function attrs() { return { r: [{ md: { padding: '1r' } }] }; }\
         export const App = () => <Div {...attrs()} />;",
    );
    let hits = compiler_hits(&res, crate::diagnostics::DiagnosticCode::NonObjectJsxStyle);
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "pass a static style object to 'r' (got array)".to_string()
        ])
    );
}

/// The same folded bag spread into css() keeps style-object semantics and warns for readOnly.
#[test]
fn folded_css_spread_still_warns_for_bag_keys() {
    let res = compile_code(
        "import { css } from '@reference-ui/react';\
         function attrs() { return { readOnly: true }; }\
         export const cls = css({ ...attrs() });",
    );
    let hits = unknown_prop_hits(&res);
    assert_eq!(hits.len(), 1);
    assert_eq!(hits[0].message, "Unknown style property \"readOnly\"");
}

/// Every compiler-channel diagnostic carrying `code`; extract refusals ride that channel.
fn compiler_hits(
    res: &crate::CompileResult,
    code: crate::diagnostics::DiagnosticCode,
) -> Vec<&crate::Diagnostic> {
    res.compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|d| d.code == code)
        .collect()
}

/// Every UnknownProperty diagnostic on the default channel.
fn unknown_prop_hits(res: &crate::CompileResult) -> Vec<&crate::Diagnostic> {
    res.diagnostics
        .iter()
        .filter(|d| d.code == crate::diagnostics::DiagnosticCode::UnknownProperty)
        .collect()
}
