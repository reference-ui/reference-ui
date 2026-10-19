//! Non-host component extraction pins (G0 §D/C8, styling plan S2).
//! A capitalized non-host JSX tag lowers through the same attribute loop as a
//! host, under the systems that render it. A tag whose binding ends at a
//! package that published a system (`acme-ui`, `@reference-ui/lib/primitives`,
//! directly, through a project barrel or a same-file alias) backs under that
//! package's systems this compile composes, never under any other composed
//! system and never as own; a tag from a package not built on Reference UI
//! lowers nothing. Lowercase DOM tags keep today's drop path, a plain tag stays
//! silent, member tags take their root's verdict, and a threaded wrapper
//! lowers its `css` before the non-host gate.

use crate::atom::Backing;
use crate::tests::packages::PackageApp;
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
/// stamped with a non-own backing by the shared attribute loop.
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
    // Standalone, nothing is composed, so the backing names no system: the
    // want resolves but builds no plan.
    assert_eq!(want.backing, Backing::none(), "{want:?}");
    assert!(
        res.style_plans.iter().all(|plan| plan.prop != "color"),
        "nothing composed means no external plan: {:?}",
        res.style_plans
    );
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A member tag takes its root's verdict: `Foo.Bar` is not own.
#[test]
fn member_external_tag_extracts() {
    let res = compile_code(
        "import { Div } from '@reference-ui/react';\
         export const el = <Foo.Bar color=\"red\" />;",
    );
    assert!(
        res.wants
            .iter()
            .any(|w| &*w.prop == "color" && !w.backing.is_own()),
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

/// A threaded wrapper lowers its `css` before the non-host gate, so the
/// threaded want is always own (wrapper-first order, G0 §D).
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
    assert!(threaded.backing.is_own(), "threaded css stays own");
}

/// Compile `src/test.tsx` in a scratch app with installed packages, `upstream`
/// composed, `Button` on the roster as Core sends it.
fn compile_installed(name: &str, code: &str, upstream: &[&str]) -> crate::CompileResult {
    PackageApp::new(name).compile(&[("src/test.tsx", code)], upstream)
}

/// The style plan classes one prop compiled to.
fn plan_classes(res: &crate::CompileResult, prop: &str) -> Vec<String> {
    res.style_plans
        .iter()
        .filter(|plan| plan.prop == prop)
        .flat_map(|plan| plan.declarations.iter().map(|decl| decl.class_name.clone()))
        .collect()
}

/// Probe 1: a primitive-named `Button` from a package renders through that
/// package's runtime, so its style props back the package's system. The same
/// name from `@reference-ui/react` stays an own host.
#[test]
fn package_primitive_name_is_external() {
    let res = compile_installed(
        "ext-primitive-name",
        "import { Button as Own } from '@reference-ui/react';\
         import { Button } from 'acme-ui';\
         export const own = <Own bg=\"red\" />;\
         export const acme = <Button color=\"blue\" />;",
        &["acme"],
    );
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
    assert_eq!(plan_classes(&res, "color"), vec!["acme__c_blue"]);
}

/// No spray: with several systems composed, a package's tag backs under its
/// own system only, never under another composed system.
#[test]
fn package_tag_backs_under_its_system_only() {
    let res = compile_installed(
        "ext-no-spray",
        "import { Badge } from 'acme-ui';\
         export const acme = <Badge color=\"blue\" />;",
        &["reference-ui", "acme", "reference-icons"],
    );
    let want = res
        .wants
        .iter()
        .find(|w| &*w.prop == "color")
        .expect("want");
    assert_eq!(want.backing, Backing::systems(["acme"]));
    assert_eq!(plan_classes(&res, "color"), vec!["acme__c_blue"]);
    assert!(res.stylesheet.contains("/* foreign acme */"));
    assert!(
        !res.stylesheet.contains("/* foreign reference-ui */"),
        "{}",
        res.stylesheet
    );
    assert!(!res.stylesheet.contains("reference-icons__c_blue"));
}

/// Issue #19: lib is a package like any other; `/primitives` included. Lib
/// renders through icons and itself, so it backs under whichever of the two
/// is composed.
#[test]
fn lib_primitive_import_is_external() {
    let res = compile_installed(
        "ext-lib-primitive",
        "import { Button } from '@reference-ui/lib/primitives';\
         export const lib = <Button color=\"blue\" />;",
        &["reference-ui"],
    );
    assert_eq!(plan_classes(&res, "color"), vec!["reference-ui__c_blue"]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A tag from a package not built on Reference UI is not a Reference
/// component: no want, no plan, no diagnostic, whatever is composed.
#[test]
fn foreign_package_tag_lowers_nothing() {
    let res = compile_installed(
        "ext-foreign",
        "import { Div } from '@reference-ui/react';\
         import { Icon } from 'lucide';\
         import { Badge } from 'not-installed';\
         export const a = <Icon color=\"red\" />;\
         export const b = <Badge p=\"1r\" />;\
         export const own = <Div mt=\"2r\" />;",
        &["acme"],
    );
    assert!(
        res.wants.iter().all(|w| &*w.prop == "mt"),
        "only the own want lowers: {:?}",
        res.wants
    );
    assert!(res.style_plans.iter().all(|plan| plan.prop == "mt"));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// Probe 1b: an upstream-published wrapper name imported from a package backs
/// under the package's system, while a same-file declaration spelling the same
/// name keeps the roster match (a `Local` binding), so a consumer's own
/// wrapper stays own.
#[test]
fn published_wrapper_name_follows_its_binding() {
    let app = PackageApp::new("ext-published-wrapper");
    let mut request = app.request(
        &[
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
        ],
        &["acme"],
    );
    request
        .jsx_hosts
        .get_or_insert_with(Vec::new)
        .push("AcmeCard".into());
    let res = compile(&request).expect("compile succeeds");
    assert_eq!(
        plan_classes(&res, "p"),
        vec!["acme__p_1r", "@reference-ui/lib__p_2r"]
    );
}

/// Probe 2: a project barrel re-exporting a package's `Button` carries the
/// package binding to its importers; a barrel re-exporting Reference's
/// `Button` stays own (the identity walk pins both ways).
#[test]
fn barrel_reexport_follows_the_terminal_binding() {
    let res = PackageApp::new("ext-barrel").compile(
        &[
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
        ],
        &["reference-ui"],
    );
    assert_eq!(plan_classes(&res, "color"), vec!["reference-ui__c_blue"]);
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
}

/// Probe 3: a same-file `css` wrapper around a package tag never threads,
/// so the call-site `css` backs under the package's system.
#[test]
fn css_wrapper_around_a_package_tag_is_external() {
    let res = compile_installed(
        "ext-css-wrapper",
        "import { Button } from '@reference-ui/lib/primitives';\
         const Wrap = ({ css }: { css?: object }) => <Button css={css} />;\
         export const el = <Wrap css={{ color: 'blue' }} />;",
        &["reference-ui"],
    );
    let want = res
        .wants
        .iter()
        .find(|w| &*w.prop == "color")
        .expect("call-site css want");
    assert_eq!(want.backing, Backing::systems(["reference-ui"]), "{want:?}");
    assert_eq!(plan_classes(&res, "color"), vec!["reference-ui__c_blue"]);
}

/// A member tag whose root is a package import backs under the package even
/// when the upstream publishes the dotted name as a host.
#[test]
fn package_member_import_is_external() {
    let res = compile_installed(
        "ext-member",
        "import { Overlay } from '@reference-ui/lib';\
         export const el = <Overlay.Content color=\"blue\" />;",
        &["reference-ui"],
    );
    assert_eq!(plan_classes(&res, "color"), vec!["reference-ui__c_blue"]);
}

/// A configured name with no import keeps the own-host verdict, and so
/// does a local alias whose chain ends at an own import.
#[test]
fn unimported_and_own_aliased_hosts_stay_own() {
    let res = compile_installed(
        "ext-own-alias",
        "import { Button as Own } from '@reference-ui/react';\
         const Alias = Own;\
         export const bare = <Button color=\"blue\" />;\
         export const alias = <Alias bg=\"red\" />;",
        &["acme"],
    );
    assert_eq!(
        plan_classes(&res, "color"),
        vec!["@reference-ui/lib__c_blue"]
    );
    assert_eq!(plan_classes(&res, "bg"), vec!["@reference-ui/lib__bg_red"]);
}

/// A local alias of a package import backs under the package too: the chain
/// ends at the package's `Button`, which is never an own host.
#[test]
fn alias_of_package_import_is_external() {
    let res = compile_installed(
        "ext-package-alias",
        "import { Button } from 'acme-ui';\
         const Alias = Button;\
         export const el = <Alias color=\"blue\" />;",
        &["acme"],
    );
    assert_eq!(plan_classes(&res, "color"), vec!["acme__c_blue"]);
}

/// A tag no import binds that a composed upstream publishes (`upstreamHosts`)
/// backs under that upstream only; an unbound tag nobody publishes still backs
/// under every composed system until it lowers under own.
#[test]
fn unbound_tags_back_under_their_publisher_else_every_composed_system() {
    let app = PackageApp::new("ext-unbound");
    let mut request = app.request(
        &[(
            "src/test.tsx",
            "import { Div } from '@reference-ui/react';\
             export const published = <AcmeCard p=\"1r\" />;\
             export const unknown = <Mystery m=\"2r\" />;",
        )],
        &["reference-ui", "acme"],
    );
    request
        .upstream_hosts
        .insert("acme".into(), vec!["AcmeCard".into()]);
    let res = compile(&request).expect("compile succeeds");
    assert_eq!(plan_classes(&res, "p"), vec!["acme__p_1r"]);
    assert_eq!(
        plan_classes(&res, "m"),
        vec!["reference-ui__m_2r", "acme__m_2r"]
    );
}
