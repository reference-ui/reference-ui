//! Same-file wrapper-prop threading for JSX style blocks (smoke #9).
//! A `css` value passed as `css={const}` to a same-file wrapper that
//! forwards its `css` param into a host (`<Div css={css}>`) must emit
//! exactly as if the const were inlined at the host. The control pins
//! the direct identifier form (already supported); the threading case
//! mirrors `ReferenceMemberList.tsx` (`as` cast, const spread, wrapper).

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

fn emitted_classes(res: &crate::CompileResult) -> Vec<&str> {
    res.css
        .iter()
        .flat_map(|css| css.classes.values().map(String::as_str))
        .collect()
}

fn has_last_child_utility(res: &crate::CompileResult) -> bool {
    emitted_classes(res)
        .iter()
        .any(|class| class.ends_with("[&_>_:last-child]:bd-b-w_0"))
}

fn has_last_child_borderless(res: &crate::CompileResult) -> bool {
    res.wants.iter().any(|w| {
        &*w.prop == "borderBottomWidth"
            && w.value.to_string() == "0"
            && w.when.iter().any(|when| &**when == "& > :last-child")
    })
}

/// Direct `css={const}` with an `as` cast emits (control: already works).
#[test]
fn test_direct_css_identifier_with_as_cast_emits() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        const memberRowsCss = {
            '& > :last-child': { borderBottomWidth: '0' },
        } as Record<string, unknown>;
        export const el = <Div css={memberRowsCss} />;
        "#,
    );
    assert!(
        has_last_child_borderless(&res),
        "direct css={{const}} emits the last-child want: {:?}",
        res.wants
            .iter()
            .map(|w| (&w.prop, w.value.to_string()))
            .collect::<Vec<_>>()
    );
    assert!(
        has_last_child_utility(&res),
        "direct css={{const}} mints the last-child utility: {:?}",
        emitted_classes(&res)
    );
}

/// `css={const}` threaded through a same-file wrapper prop emits.
#[test]
fn test_wrapper_prop_threading_emits() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        const memberRowsCss = {
            '& > :last-child': { borderBottomWidth: '0' },
        } as Record<string, unknown>;
        const declaredMemberRowsCss = {
            borderTopWidth: '1px',
            ...memberRowsCss,
        } as Record<string, unknown>;
        function ReferenceMemberRows({ members, css }: { members: unknown[]; css?: Record<string, unknown> }) {
            return <Div css={css}>{members.length}</Div>;
        }
        export function ReferenceMemberList({ members }: { members: unknown[] }) {
            return <ReferenceMemberRows members={members} css={declaredMemberRowsCss} />;
        }
        "#,
    );
    assert!(
        has_last_child_borderless(&res),
        "threaded css={{const}} emits the last-child want: {:?}",
        res.wants
            .iter()
            .map(|w| (&w.prop, w.value.to_string()))
            .collect::<Vec<_>>()
    );
    assert!(
        has_last_child_utility(&res),
        "threaded css={{const}} mints the last-child utility: {:?}",
        emitted_classes(&res)
    );
    assert!(
        res.wants
            .iter()
            .any(|w| &*w.prop == "borderTopWidth" && w.value.to_string() == "1px"),
        "threaded spread const keeps its own declarations"
    );
}

/// Arrow-component wrappers thread exactly like declarations.
#[test]
fn test_arrow_wrapper_prop_threading_emits() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        const memberRowsCss = {
            '& > :last-child': { borderBottomWidth: '0' },
        } as Record<string, unknown>;
        const ReferenceMemberRows = ({ css }: { css?: Record<string, unknown> }) => (
            <Div css={css}>rows</Div>
        );
        export const el = <ReferenceMemberRows css={memberRowsCss} />;
        "#,
    );
    assert!(
        has_last_child_borderless(&res),
        "arrow-threaded css={{const}} emits the last-child want"
    );
    assert!(has_last_child_utility(&res), "arrow-threaded css mints the utility");
}

/// A same-file component that never forwards `css` stays silent: the
/// wrapper fallback must not turn unknown tags into style positions.
#[test]
fn test_non_forwarding_wrapper_stays_silent() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        const shared = { color: 'red' };
        function Widget({ css }: { css?: Record<string, unknown> }) {
            return <Div>static</Div>;
        }
        export const el = <Widget css={shared} />;
        "#,
    );
    assert!(
        res.wants.is_empty(),
        "non-forwarding wrapper extracts nothing: {:?}",
        res.wants
            .iter()
            .map(|w| (&w.prop, w.value.to_string()))
            .collect::<Vec<_>>()
    );
}
