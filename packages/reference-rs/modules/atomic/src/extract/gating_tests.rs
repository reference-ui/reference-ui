//! Cargo tests for import-bound `css()` and styletrace-gated JSX extract.
//! Virtual sources have no disk graph; these cases prove fail-closed callee
//! shadowing and skipping untraced PascalCase once a Reference host is in
//! scope. Seam stations `ATM-SITE-07` / `08` / `10` are the committed proof.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

#[test]
fn test_shadowed_css_param_is_not_an_extract_site() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        css({ color: 'blue' });
        function f(css) { css({ color: 'red' }); }
        "#,
    );
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "blue"));
    assert!(!res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "red"));
}

#[test]
fn test_unknown_css_is_not_an_extract_site() {
    let res = compile_code(
        r#"
        function f(css) { css({ color: 'red' }); }
        const localCss = (styles) => styles;
        localCss({ mt: '2r' });
        "#,
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_const_aliased_recipe_still_extracts() {
    let res = compile_code(
        r#"
        import { cva } from 'src/system/css';
        const __reference_ui_recipe = cva;
        const button = __reference_ui_recipe({
            className: 'neutralized',
            base: { fontWeight: 'bold' },
        });
        button();
        "#,
    );
    assert!(res.diagnostics.is_empty());
    assert!(res
        .runtime
        .recipes
        .keys()
        .any(|key| key.ends_with("__neutralized")));
    assert!(res.stylesheet.contains("@layer recipes {"));
}

#[test]
fn test_const_aliased_css_still_extracts() {
    let res = compile_code(
        r#"
        import { css } from 'src/system/css';
        const __reference_ui_css = css;
        const card = __reference_ui_css({ color: 'blue' });
        "#,
    );
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "blue"));
}

#[test]
fn test_hostless_styles_emit_missing_graph_error() {
    let res = compile_code(
        r#"
        export const App = () => (
            <>
                <Foo mt="4r" />
                <Bar color="red" />
            </>
        );
        "#,
    );
    assert!(res.wants.is_empty());
    assert!(res.style_plans.is_empty());
    assert_eq!(res.diagnostics.len(), 1);
    let diag = &res.diagnostics[0];
    assert_eq!(diag.severity, crate::diagnostics::DiagnosticSeverity::Error);
    assert!(
        diag.message.contains("missing primitive graph"),
        "{}",
        diag.message
    );
    assert!(diag.message.contains("<Foo>"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("test.tsx"));
    assert_eq!(diag.line, Some(4));
    assert!(diag.column.is_some());
}

#[test]
fn test_empty_project_compiles_clean() {
    let req = CompileRequest {
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    let res = compile(&req).expect("compile succeeds");
    assert!(res.wants.is_empty());
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_styleless_hostless_file_stays_silent() {
    let res = compile_code(
        r#"
        export const App = () => (
            <div id="root">
                <Foo>hi</Foo>
            </div>
        );
        "#,
    );
    assert!(res.wants.is_empty());
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_untraced_tag_is_skipped_when_a_host_is_known() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        function Foo() { return <div />; }
        export const App = () => (
            <>
                <Div mt="2r" />
                <Foo color="red" />
            </>
        );
        "#,
    );
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "mt" && w.value.to_string() == "2r"));
    assert!(!res.wants.iter().any(|w| &*w.prop == "color"));
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_jsx_host_union_matches_merged_set() {
    // The borrowed host union answers exactly the merged set's queries:
    // membership from either side, empty only when both sides are empty.
    use crate::extract::JsxHosts;
    use rustc_hash::FxHashSet;

    let local: FxHashSet<String> = ["Div".to_string()].into_iter().collect();
    let global: FxHashSet<String> = ["Box".to_string()].into_iter().collect();
    let empty: FxHashSet<String> = FxHashSet::default();
    let union = JsxHosts {
        local: &local,
        global: &global,
    };
    assert!(union.contains("Div"));
    assert!(union.contains("Box"));
    assert!(!union.contains("Foo"));
    assert!(!union.is_empty());
    assert!(JsxHosts {
        local: &empty,
        global: &empty,
    }
    .is_empty());
    assert!(!JsxHosts {
        local: &local,
        global: &empty,
    }
    .is_empty());
    assert!(!JsxHosts {
        local: &empty,
        global: &global,
    }
    .is_empty());
}
