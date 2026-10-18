//! External-component extraction pins for the fan-out contract (G0 §D/C8).
//! A capitalized non-host JSX tag is an external component: its style props
//! flow through the same attribute loop as a host, stamped `external`, so the
//! consumer sheet can back the foreign class. Lowercase DOM tags keep today's
//! drop path, a plain tag stays silent, member tags take their root's verdict,
//! and a threaded wrapper lowers its `css` before the external gate. A
//! host name whose binding ends at an installed package (`acme-ui`,
//! `@reference-ui/lib/primitives`, directly or through a project barrel) is
//! external too: that package's bundled runtime mints its own qualifier, so
//! an own-host verdict would back the wrong class.

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
        res.wants.iter().any(|w| &*w.prop == "color" && w.external),
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

/// Compile these files with `Button`, `Overlay.Content` and `AcmeCard` on
/// the `jsxHosts` roster under one upstream. Core sends an upstream's
/// published names apart, in `upstreamHosts` (pinned in
/// `hosts::upstream_tests`); listing them here pins that provenance alone
/// makes a package-bound tag external, whatever the roster says.
fn compile_hosted_files(files: &[(&str, &str)]) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(
            files
                .iter()
                .map(|(path, content)| VirtualSource {
                    path: (*path).into(),
                    content: (*content).into(),
                })
                .collect(),
        ),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        jsx_hosts: Some(vec![
            "Button".into(),
            "Overlay.Content".into(),
            "AcmeCard".into(),
        ]),
        upstream_systems: vec!["upstream".into()],
        logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// One hosted file, as `test.tsx`.
fn compile_hosted(code: &str) -> crate::CompileResult {
    compile_hosted_files(&[("test.tsx", code)])
}

/// The style plan classes one prop compiled to.
fn plan_classes(res: &crate::CompileResult, prop: &str) -> Vec<String> {
    res.style_plans
        .iter()
        .filter(|plan| plan.prop == prop)
        .flat_map(|plan| plan.declarations.iter().map(|decl| decl.class_name.clone()))
        .collect()
}

/// Probe 1: a primitive-named `Button` from any installed package renders
/// through that package's runtime, so its style props back the upstream
/// class. The same name from `@reference-ui/react` stays an own host.
#[test]
fn package_primitive_name_is_external() {
    let res = compile_hosted(
        "import { Button as Own } from '@reference-ui/react';\
         import { Button } from 'acme-ui';\
         export const own = <Own bg=\"red\" />;\
         export const acme = <Button color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
}

/// Issue #19: lib is a package like any other; `/primitives` included.
#[test]
fn lib_primitive_import_is_external() {
    let res = compile_hosted(
        "import { Button } from '@reference-ui/lib/primitives';\
         export const lib = <Button color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// Probe 1b: an upstream-published wrapper name imported from a package is
/// external, while a same-file declaration spelling the same name keeps the
/// roster match (a `Local` binding), so a consumer's own wrapper stays own.
#[test]
fn published_wrapper_name_follows_its_binding() {
    let res = compile_hosted_files(&[
        (
            "src/acme.tsx",
            "import { AcmeCard } from 'acme-ui';\
             export const acme = <AcmeCard p=\"1r\" />;",
        ),
        (
            "src/local.tsx",
            "import { Div } from '@reference-ui/react';\
             function AcmeCard(props: object) { return <Div {...props} />; }\
             export const local = <AcmeCard p=\"2r\" />;",
        ),
    ]);
    assert_eq!(
        plan_classes(&res, "p"),
        vec!["upstream__p_1r", "@reference-ui/lib__p_2r"]
    );
}

/// Probe 2: a project barrel re-exporting a package's `Button` carries the
/// package binding to its importers; a barrel re-exporting Reference's
/// `Button` stays own (the identity walk pins both ways).
#[test]
fn barrel_reexport_follows_the_terminal_binding() {
    let res = compile_hosted_files(&[
        (
            "src/ui/index.ts",
            "export { Button } from '@reference-ui/lib/primitives';",
        ),
        (
            "src/own/index.ts",
            "export { Button } from '@reference-ui/react';",
        ),
        (
            "src/main.tsx",
            "import { Button } from './ui';\
             export const el = <Button color=\"blue\" />;",
        ),
        (
            "src/page.tsx",
            "import { Button } from './own';\
             export const el = <Button bg=\"red\" />;",
        ),
    ]);
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
}

/// Probe 3: a same-file `css` wrapper around a package tag never threads,
/// so the call-site `css` is an external want backing the upstream class.
#[test]
fn css_wrapper_around_a_package_tag_is_external() {
    let res = compile_hosted(
        "import { Button } from '@reference-ui/lib/primitives';\
         const Wrap = ({ css }: { css?: object }) => <Button css={css} />;\
         export const el = <Wrap css={{ color: 'blue' }} />;",
    );
    let want = res
        .wants
        .iter()
        .find(|w| &*w.prop == "color")
        .expect("call-site css want");
    assert!(want.external, "the wrapper's css is external: {want:?}");
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
}

/// A member tag whose root is a package import is external even when the
/// upstream publishes the dotted name as a host.
#[test]
fn package_member_import_is_external() {
    let res = compile_hosted(
        "import { Overlay } from '@reference-ui/lib';\
         export const el = <Overlay.Content color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
}

/// A configured name with no import keeps the own-host verdict, and so
/// does a local alias whose chain ends at an own import.
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

/// A local alias of a package import is external too: the chain ends at the
/// package's `Button`, which is never an own host.
#[test]
fn alias_of_package_import_is_external() {
    let res = compile_hosted(
        "import { Button } from 'acme-ui';\
         const Alias = Button;\
         export const el = <Alias color=\"blue\" />;",
    );
    assert_eq!(plan_classes(&res, "color"), vec!["upstream__c_blue"]);
}
