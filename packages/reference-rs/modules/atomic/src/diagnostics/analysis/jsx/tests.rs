//! Traced JSX surface expectations: host gating, aliases, and shadows.
//! Pins literal prediction through file-local imports, `css`/condition
//! lowering, spread bags, const-alias chains with their cycle/non-host
//! refusals, and shadowed tags staying silent — including params and
//! `let` rebinds over an alias name, mirroring the extract gate.

use super::super::support::{analyze_source, dynamic_count, exact_keys};

const IMPORT: &str = "import { Div } from '@reference-ui/react';";

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
    // `NS.Panel` re-admits through its const literal; the twin stays silent.
    let facts = analyze_source("import { Div, NSPanel } from '@reference-ui/react'; const NS = { Panel: Div }; const Other = { Panel: Div }; const el = <NS.Panel mt=\"2r\" />; const twin = <Other.Panel p=\"4r\" />;");
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"mt","2r",false]"#.to_string()]
    );
}

#[test]
fn opaque_member_root_rebinding_predicts_nothing() {
    // `const Tabs = Other` is opaque: no const literal, no prediction.
    let facts = analyze_source("import { Div } from '@reference-ui/react'; const Tabs = Other; const el = <Tabs.Panel mt=\"2r\" />;");
    assert!(facts.is_empty());
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
fn alias_cycle_and_non_host_predict_nothing() {
    let facts = analyze_source(&format!(
        "{IMPORT} const A = B; const B = A; const el = <A mt=\"2r\" />;"
    ));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!(
        "{IMPORT} const X = Other; const el = <X mt=\"2r\" />;"
    ));
    assert!(facts.is_empty());
}

#[test]
fn param_shadow_over_alias_predicts_nothing() {
    // Mirrors the extract gate's `test_param_shadow_over_alias_stays_silent`:
    // the param is the innermost binding, so the flat edge stays unread.
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; function f(IconShell) {{ return <IconShell mt=\"2r\" />; }}"
    ));
    assert!(facts.is_empty());
}

#[test]
fn rebind_shadow_over_alias_predicts_nothing() {
    // `let` and function rebinds veto like params.
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; function f() {{ let IconShell = Other; return <IconShell mt=\"2r\" />; }}"
    ));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!(
        "{IMPORT} const IconShell = Div; function f() {{ function IconShell() {{}} return <IconShell mt=\"2r\" />; }}"
    ));
    assert!(facts.is_empty());
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
fn instantiation_alias_predicts_nothing() {
    // `const X = Div<T>` peels in neither path: the shared `peel` leaves
    // the instantiation wrapped, so no edge is recorded and both stay silent.
    let facts = analyze_source(&format!(
        "{IMPORT} const X = Div<T>; const el = <X mt=\"2r\" />;"
    ));
    assert!(facts.is_empty());
}

#[test]
fn shadowed_and_variant_attrs_emit_nothing() {
    let facts = analyze_source(&format!(
        "{IMPORT} function f(Div) {{ return <Div mt=\"2r\" />; }}"
    ));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!("{IMPORT} const el = <Div variant=\"primary\" />;"));
    assert!(facts.is_empty());
    let facts = analyze_source(&format!("{IMPORT} const el = <Div colorMode=\"dark\" />;"));
    assert!(facts.is_empty());
}
