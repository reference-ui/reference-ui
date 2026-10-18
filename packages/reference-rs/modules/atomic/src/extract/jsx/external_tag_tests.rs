//! External-component extraction pins for the fan-out contract (G0 §D/C8).
//! A capitalized non-host JSX tag is an external component: its style props
//! flow through the same attribute loop as a host, stamped `external`, so the
//! consumer sheet can back the foreign class. Lowercase DOM tags keep today's
//! drop path, a plain tag stays silent, member tags take their root's verdict,
//! and a threaded wrapper lowers its `css` before the external gate. A
//! configured host name imported from a foreign-runtime package
//! (`@reference-ui/lib/primitives`) is external too: its runtime mints the
//! upstream qualifier, so an own-host verdict would back the wrong class.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
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

/// A capitalized non-host tag extracts a want and an authored plan, both
/// stamped external by the shared attribute loop.
#[test]
fn external_tag_extracts_want_and_authored() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         export const el = <BoltIcon color=\"red\" />;",
    );
    let want = res
        .wants
        .iter()
        .find(|w| &*w.prop == "color")
        .expect("external want on <BoltIcon>");
    assert!(want.external, "the want is stamped external: {want:?}");
    // Without upstream systems there is no foreign qualifier to place the
    // external declaration under, so it resolves but builds no plan (T03
    // partition). The plan-per-foreign-qualifier shape is pinned in
    // `assembly::tests` with an upstream system present.
    assert!(
        res.style_plans.iter().all(|plan| plan.prop != "color"),
        "no foreign qualifier means no external plan: {:?}",
        res.style_plans
    );
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A member tag takes its root's verdict: `Foo.Bar` is external.
#[test]
fn member_external_tag_extracts() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         export const el = <Foo.Bar color=\"red\" />;",
    );
    assert!(
        res.wants
            .iter()
            .any(|w| &*w.prop == "color" && w.external),
        "member external tag extracts: {:?}",
        res.wants
    );
}

/// A lowercase non-host tag keeps today's drop path — silent under a resolved
/// host graph.
#[test]
fn lowercase_non_host_tag_is_dropped_silently() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         export const el = <div color=\"red\" />;",
    );
    assert!(res.wants.is_empty(), "no external wants for a DOM tag");
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A plain external tag carries no style props — silent, no want.
#[test]
fn plain_external_tag_stays_silent() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         export const el = <BoltIcon />;",
    );
    assert!(res.wants.is_empty(), "no wants from a plain tag");
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A threaded wrapper lowers its `css` before the external gate, so the
/// threaded want is never stamped external (wrapper-first order, G0 §D).
#[test]
fn threaded_wrapper_css_is_not_external() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         const memberRowsCss = { '& > :last-child': { borderBottomWidth: '0' } } as Record<string, unknown>;\
         const ReferenceMemberRows = ({ css }: { css?: Record<string, unknown> }) => (<Div css={css}>rows</Div>);\
         export const el = <ReferenceMemberRows css={memberRowsCss} />;",
    );
    let threaded = res
        .wants
        .iter()
        .find(|w| &*w.prop == "borderBottomWidth")
        .expect("threaded last-child want emitted");
    assert!(!threaded.external, "threaded css stays non-external");
}

/// Compile one file with `Button` and `Overlay.Content` configured as hosts
/// (the primitive roster and an upstream's `jsxElements`) under one upstream.
fn compile_hosted(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: code.into(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        jsx_hosts: Some(vec!["Button".into(), "Overlay.Content".into()]),
        upstream_systems: vec!["upstream".into()],
        logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// The style plan classes one prop compiled to.
fn plan_classes(res: &crate::CompileResult, prop: &str) -> Vec<String> {
    res.style_plans
        .iter()
        .filter(|plan| plan.prop == prop)
        .flat_map(|plan| plan.declarations.iter().map(|decl| decl.class_name.clone()))
        .collect()
}

/// Issue #19: `Button` from `@reference-ui/lib/primitives` renders through
/// lib's runtime, so its style props back the upstream-qualified class it
/// mints. The same name from `@reference-ui/react` stays an own host.
#[test]
fn foreign_runtime_primitive_import_is_external() {
    let res = compile_hosted(
        "import { Button as Own } from '@reference-ui/react';\
         import { Button } from '@reference-ui/lib/primitives';\
         export const own = <Own bg=\"red\" />;\
         export const lib = <Button color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A member tag whose root is a foreign-runtime import is external even when
/// the upstream publishes the dotted name as a host.
#[test]
fn foreign_runtime_member_import_is_external() {
    let res = compile_hosted(
        "import { Overlay } from '@reference-ui/lib';\
         export const el = <Overlay.Content color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
}

/// A configured name with no foreign import keeps the own-host verdict, and
/// so does a local alias whose chain ends at an own import.
#[test]
fn unimported_and_own_aliased_hosts_stay_own() {
    let res = compile_hosted(
        "import { Button as Own } from '@reference-ui/react';\
         const Alias = Own;\
         export const bare = <Button color=\"blue\" />;\
         export const alias = <Alias bg=\"red\" />;",
    );
    assert_eq!(
        plan_classes(&res, "color"),
        vec!["@reference-ui/lib__c_blue"]
    );
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
}

/// A local alias of a foreign-runtime import is external too: the chain ends
/// at lib's `Button`, which is never an own host.
#[test]
fn alias_of_foreign_runtime_import_is_external() {
    let res = compile_hosted(
        "import { Button } from '@reference-ui/lib/primitives';\
         const Alias = Button;\
         export const el = <Alias color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
}
