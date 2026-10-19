//! Project and unbound component pins (styling plan S3).
//! A capitalized tag no host admits and no package renders is decided by its
//! binding, never its spelling: an unbound name a composed upstream publishes
//! backs under that upstream, and any other project or unbound component lowers
//! under own, standalone or with several systems composed, so nothing sprays it
//! across the composed systems and the sheet prints no foreign group for it.
//! Each compile carries the proof channel, so an empty diagnostic list also
//! proves the analysis mirror predicted the same own keys.

use crate::atom::Backing;
use crate::tests::packages::PackageApp;
use crate::{compile, CompileResult};

/// The style plan classes one prop compiled to.
fn plan_classes(res: &CompileResult, prop: &str) -> Vec<String> {
    res.style_plans
        .iter()
        .filter(|plan| plan.prop == prop)
        .flat_map(|plan| plan.declarations.iter().map(|decl| decl.class_name.clone()))
        .collect()
}

/// The backing of the first want on `prop`.
fn backing_of(res: &CompileResult, prop: &str) -> Backing {
    res.wants
        .iter()
        .find(|w| &*w.prop == prop)
        .map(|w| w.backing.clone())
        .unwrap_or_else(|| panic!("a want on `{prop}`: {:?}", res.wants))
}

/// An unbound component nobody publishes lowers under own standalone, and a
/// member tag takes its root's verdict.
#[test]
fn unbound_components_lower_under_own_standalone() {
    let res = PackageApp::new("untraced-standalone").compile(
        &[(
            "src/test.tsx",
            "import { Div } from '@reference-ui/react';\
             export const el = <BoltIcon color=\"red\" />;\
             export const member = <Foo.Bar m=\"2r\" />;",
        )],
        &[],
    );
    assert_eq!(backing_of(&res, "color"), Backing::Own);
    assert_eq!(backing_of(&res, "m"), Backing::Own);
    assert_eq!(plan_classes(&res, "color"), vec!["@reference-ui/lib__c_red"]);
    assert_eq!(plan_classes(&res, "m"), vec!["@reference-ui/lib__m_2r"]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// A tag no import binds that a composed upstream publishes (`upstreamHosts`)
/// backs under that upstream only; an unbound tag nobody publishes lowers
/// under own, never under the composed systems.
#[test]
fn unbound_tags_back_under_their_publisher_else_own() {
    let app = PackageApp::new("untraced-unbound");
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
    assert_eq!(plan_classes(&res, "m"), vec!["@reference-ui/lib__m_2r"]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}

/// No spray for project code: a same-file component and an imported project
/// component that nobody traces back under own with several systems
/// composed, and the sheet prints no foreign group for them.
#[test]
fn untraced_project_tags_back_under_own_not_the_composed_systems() {
    let res = PackageApp::new("untraced-local").compile(
        &[
            (
                "src/panel.tsx",
                "export function Panel(props: object) { return <section {...props} />; }",
            ),
            (
                "src/test.tsx",
                "import { Panel } from './panel';\
                 function Card(props: object) { return <article {...props} />; }\
                 export const card = <Card color=\"blue\" />;\
                 export const panel = <Panel m=\"2r\" />;",
            ),
        ],
        &["reference-ui", "acme", "reference-icons"],
    );
    assert!(
        res.wants.iter().all(|w| w.backing.is_own()),
        "{:?}",
        res.wants
    );
    assert_eq!(plan_classes(&res, "color"), vec!["@reference-ui/lib__c_blue"]);
    assert_eq!(plan_classes(&res, "m"), vec!["@reference-ui/lib__m_2r"]);
    assert!(!res.stylesheet.contains("/* foreign"), "{}", res.stylesheet);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
}
