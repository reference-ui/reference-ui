//! Traced JSX surface expectations: host gating, aliases, and shadows.
//! Pins literal prediction through file-local imports, package-bound tags
//! predicting keys under exactly the systems extraction backs them under (on
//! disk: a published package's composed systems, nothing when none is
//! composed or the package is not built on Reference UI), `css`/condition
//! lowering, spread bags, const-alias chains, and same-file `css` wrappers
//! predicting the block extraction lowers. A tag that does not re-admit as a
//! host (an alias cycle or non-host terminal, a param or `let` rebind over an
//! alias, a shadowed or opaque root) is a project component nobody traces and
//! predicts own keys, exactly as extraction lowers it (styling plan S3).

use super::super::support::{
    analyze_installed, analyze_source, analyze_source_external, analyze_source_hosted,
    dynamic_count, exact_keys,
};
use crate::tests::packages::PackageApp;

const IMPORT: &str = "import { Div } from '@reference-ui/react';";

/// The own key `mt="2r"` predicts.
const OWN_MT: [&str; 1] = [r#"["test",[],"mt","2r",false]"#];

#[test]
fn unbound_component_predicts_own_keys_beside_a_foreign_qualifier() {
    // A component nobody traces or publishes never targets the composed
    // `foreign` system (S3): its keys stay on own, as a host's do.
    let facts = analyze_source_external(&format!(
        "{IMPORT} const el = <BoltIcon color=\"red\" />;"
    ));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"color","red",false]"#.to_string()]
    );
    let facts = analyze_source_external(&format!(
        "{IMPORT} const el = <Div color=\"red\" />;"
    ));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"color","red",false]"#.to_string()]
    );
}

#[test]
fn package_import_predicts_its_system_keys_under_a_configured_name() {
    // Issue #19: `Button` is a configured host, but a package's bundled
    // runtime mints its own systems' classes, so the block targets those
    // systems this compile composes, never another composed one. Lib
    // (`/primitives` included) is a package like any other; the unimported
    // spelling keeps the own-host prediction.
    let app = PackageApp::new("mirror-configured");
    let cases = [
        (
            "@reference-ui/lib/primitives",
            r#"["reference-ui",[],"color","red",false]"#,
        ),
        ("acme-ui", r#"["acme",[],"color","red",false]"#),
    ];
    for (package, key) in cases {
        let facts = analyze_installed(
            &app,
            &format!("import {{ Button }} from '{package}'; const el = <Button color=\"red\" />;"),
            &["Button"],
            &["reference-ui", "acme"],
        );
        assert_eq!(exact_keys(&facts), vec![key.to_string()], "{package}");
    }
    let facts = analyze_source_hosted("const el = <Button color=\"red\" />;", &["Button"]);
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"color","red",false]"#.to_string()]
    );
}

#[test]
fn unbacked_and_foreign_package_tags_predict_nothing() {
    // Nothing composed backs acme (gap 2), and `lucide` and an uninstalled
    // spelling are not built on Reference UI: none of them predicts a key,
    // exactly as extraction lowers none of them under any system.
    let app = PackageApp::new("mirror-unbacked");
    for package in ["acme-ui", "lucide", "not-installed"] {
        let facts = analyze_installed(
            &app,
            &format!("import {{ Button }} from '{package}'; const el = <Button color=\"red\" />;"),
            &["Button"],
            &["reference-ui"],
        );
        assert!(exact_keys(&facts).is_empty(), "{package}: {facts:?}");
    }
}

#[test]
fn alias_of_package_import_predicts_its_system_keys() {
    // The alias chain ends at the package's `Button`: never an own host,
    // exactly as the extract gate's chain end decides.
    let facts = analyze_installed(
        &PackageApp::new("mirror-alias"),
        "import { Button } from 'acme-ui'; const Alias = Button; const el = <Alias color=\"red\" />;",
        &["Button"],
        &["acme"],
    );
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["acme",[],"color","red",false]"#.to_string()]
    );
}

#[test]
fn unbound_component_predicts_own_keys_standalone() {
    // Standalone, the component lowers under own like any project code.
    let facts = analyze_source(&format!(
        "{IMPORT} const el = <BoltIcon color=\"red\" />;"
    ));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"color","red",false]"#.to_string()]
    );
    assert_eq!(dynamic_count(&facts), 0);
}

#[test]
fn traced_hosts_predict_literal_attrs() {
    let facts = analyze_source(&format!("{IMPORT} const el = <Div mt=\"2r\" />;"));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"mt","2r",false]"#.to_string()]
    );
    let facts = analyze_source(&format!("{IMPORT} const el = <Div mt={{'2r'}} />;"));
    assert_eq!(exact_keys(&facts).len(), 1);
    let facts = analyze_source(&format!("{IMPORT} const el = <Div truncate />;"));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"truncate",true,false]"#.to_string()]
    );
}

#[test]
fn css_and_condition_blocks_walk() {
    let facts = analyze_source(&format!(
        "{IMPORT} const el = <Div css={{{{ color: 'red' }}}} />;"
    ));
    assert_eq!(exact_keys(&facts).len(), 1);
    let facts = analyze_source(&format!(
        "{IMPORT} const el = <Div _hover={{{{ color: 'red' }}}} />;"
    ));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",["_hover"],"color","red",false]"#.to_string()]
    );
    let facts = analyze_source(&format!("{IMPORT} const el = <Div r={{{{ md: 'x' }}}} />;"));
    assert!(exact_keys(&facts).is_empty());
    assert_eq!(dynamic_count(&facts), 1);
}

#[test]
fn native_style_and_unknown_tags_emit_nothing() {
    let facts = analyze_source("const el = <div style={{ padding: '99px' }}>x</div>;");
    assert!(facts.is_empty());
    let facts = analyze_source(&format!(
        "{IMPORT} const el = <Div style={{{{ padding: '99px' }}}} />;"
    ));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!("{IMPORT} const el = <span mt=\"2r\" />;"));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!(
        "{IMPORT} const el = <Div id=\"x\" data-y={{1}} />;"
    ));
    assert!(facts.is_empty());
}

#[test]
fn css_and_jsx_surfaces_predict_identical_keys() {
    let css = analyze_source("import { css } from '@reference-ui/react'; css({ mt: '2r' })");
    let jsx = analyze_source(&format!("{IMPORT} const el = <Div mt=\"2r\" />;"));
    assert_eq!(exact_keys(&css), exact_keys(&jsx));
    assert_eq!(exact_keys(&jsx).len(), 1);
}

#[test]
fn spread_bags_walk_entries_as_attrs() {
    let facts = analyze_source(&format!(
        "{IMPORT} const el = <Div {{...{{ mt: '2r' }}}} />;"
    ));
    assert_eq!(exact_keys(&facts).len(), 1);
    let facts = analyze_source(&format!("{IMPORT} const el = <Div {{...bag}} />;"));
    assert!(exact_keys(&facts).is_empty());
    assert_eq!(dynamic_count(&facts), 1);
}

#[test]
fn bound_member_root_through_const_object_predicts() {
    // `NS.Panel` re-admits through its const literal; the twin matches no
    // host, so it is a component nobody traces and predicts own too.
    let facts = analyze_source("import { Div, NSPanel } from '@reference-ui/react'; const NS = { Panel: Div }; const Other = { Panel: Div }; const el = <NS.Panel mt=\"2r\" />; const twin = <Other.Panel p=\"4r\" />;");
    assert_eq!(
        exact_keys(&facts),
        vec![
            r#"["test",[],"mt","2r",false]"#.to_string(),
            r#"["test",[],"p","4r",false]"#.to_string()
        ]
    );
}

#[test]
fn opaque_member_root_rebinding_predicts_own() {
    // `const Tabs = Other` is opaque: no const literal re-admits a host, so
    // the tag is a project component and predicts own.
    let facts = analyze_source("import { Div } from '@reference-ui/react'; const Tabs = Other; const el = <Tabs.Panel mt=\"2r\" />;");
    assert_eq!(exact_keys(&facts), OWN_MT);
}

#[test]
fn const_alias_of_host_predicts() {
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; const el = <IconShell mt=\"2r\" />;"
    ));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"mt","2r",false]"#.to_string()]
    );
    let facts = analyze_source(&format!(
        "{IMPORT} const A = Div; const B = A; const el = <B mt=\"2r\" />;"
    ));
    assert_eq!(exact_keys(&facts).len(), 1);
}

#[test]
fn alias_cycle_and_non_host_predict_own() {
    // Neither re-admits a host; each is a project component, so own.
    let facts = analyze_source(&format!(
        "{IMPORT} const A = B; const B = A; const el = <A mt=\"2r\" />;"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
    let facts = analyze_source(&format!(
        "{IMPORT} const X = Other; const el = <X mt=\"2r\" />;"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
}

#[test]
fn param_shadow_over_alias_predicts_own() {
    // Mirrors the extract gate's `test_param_shadow_over_alias_is_not_a_host`:
    // the param is the innermost binding, so the flat edge stays unread and
    // the tag predicts own as a project component.
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; function f(IconShell) {{ return <IconShell mt=\"2r\" />; }}"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
}

#[test]
fn rebind_shadow_over_alias_predicts_own() {
    // `let` and function rebinds veto the alias like params.
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; function f() {{ let IconShell = Other; return <IconShell mt=\"2r\" />; }}"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; function f() {{ function IconShell() {{}} return <IconShell mt=\"2r\" />; }}"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
}

#[test]
fn inner_const_alias_readmits_under_outer_param() {
    // Innermost-wins: the inner const — not the outer param — decides.
    let facts = analyze_source(&format!(
        "{IMPORT} function f(X) {{ function g() {{ const X = Div; return <X mt=\"2r\" />; }} }}"
    ));
    assert_eq!(exact_keys(&facts).len(), 1);
    let facts = analyze_source(&format!(
        "{IMPORT} function f() {{ const Shell = Div; return <Shell mt=\"2r\" />; }}"
    ));
    assert_eq!(exact_keys(&facts).len(), 1);
}

#[test]
fn instantiation_alias_predicts_own() {
    // `const X = Div<T>` peels in neither path: the shared `peel` leaves
    // the instantiation wrapped, so no edge is recorded and both read `X`
    // as a project component.
    let facts = analyze_source(&format!(
        "{IMPORT} const X = Div<T>; const el = <X mt=\"2r\" />;"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
}

#[test]
fn shadowed_tags_predict_own_and_variant_attrs_emit_nothing() {
    // A param shadowing `Div` is a project component: own, as extraction.
    let facts = analyze_source(&format!(
        "{IMPORT} function f(Div) {{ return <Div mt=\"2r\" />; }}"
    ));
    assert_eq!(exact_keys(&facts), OWN_MT);
    let facts = analyze_source(&format!("{IMPORT} const el = <Div variant=\"primary\" />;"));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!("{IMPORT} const el = <Div colorMode=\"dark\" />;"));
    assert!(facts.is_empty());
}

#[test]
fn threaded_css_wrapper_predicts_own_keys_under_a_foreign_qualifier() {
    // Extraction lowers a same-file wrapper's call-site `css` as if written
    // on the host it forwards into, never external; the wrapper's sibling
    // attributes are its own and predict nothing (ATM-SITE-98's `OwnWrap`).
    let facts = analyze_source_external(&format!(
        "{IMPORT} const Wrap = ({{ css }}: {{ css?: object }}) => <Div css={{css}} />;\
         const el = <Wrap color=\"blue\" css={{{{ bg: 'red' }}}} />;"
    ));
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"bg","red",false]"#.to_string()]
    );
}

#[test]
fn css_wrapper_around_a_package_tag_predicts_its_system_keys() {
    // A wrapper forwarding into a package-bound tag never threads, so its
    // call-site `css` targets the package's systems, as extraction lowers it.
    let facts = analyze_installed(
        &PackageApp::new("mirror-wrapper"),
        "import { Button } from 'acme-ui';\
         const Wrap = ({ css }: { css?: object }) => <Button css={css} />;\
         const el = <Wrap css={{ bg: 'red' }} />;",
        &["Button"],
        &["reference-ui", "acme"],
    );
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["acme",[],"bg","red",false]"#.to_string()]
    );
}
