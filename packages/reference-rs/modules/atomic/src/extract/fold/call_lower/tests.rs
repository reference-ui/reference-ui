//! Help text for folded spread lowering: an unknown prop, an unknown breakpoint, or a scalar
//! condition inside a folded spread each warns with a help line that names the fix. Each case
//! compiles a snippet with the compiler channel on and asserts on the located diagnostic and its
//! help, so the wording the author sees stays pinned. Takes source snippets through the public
//! compile entry and emits assertions only.

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
