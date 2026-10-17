//! Unit tests for static CSS lowering: wildcard expansion over token categories, the
//! radius and spacing property sets, condition-prefixed keys, and the unknown-property
//! and near-miss diagnostics. Each test builds a small `BaseSystem` fixture in place and
//! asserts on the wants, authored declarations and diagnostics that `append_static_css`
//! emits. Compiled only under `cfg(test)` as the `static_css::tests` child module.

use super::*;
use base_system::TokenLeaf;

fn test_system() -> BaseSystem {
    let mut system = BaseSystem::default();
    for (path, light, dark) in [
        ("n100", "#f4f4f5", "#18181b"),
        ("n200", "#e4e4e7", "#27272a"),
        ("n300", "#d4d4d8", "#3f3f46"),
    ] {
        system.tokens.insert_leaf(TokenLeaf {
            category: "colors",
            path,
            light,
            dark,
        });
    }
    system.tokens.insert_leaf(TokenLeaf {
        category: "radii",
        path: "md",
        light: "0.4rem",
        dark: "0.4rem",
    });
    system
}

#[test]
fn wildcard_enumerates_color_tokens() {
    let mut system = test_system();
    system.static_css.insert("color".into(), vec!["*".into()]);
    let mut wants = Vec::new();
    append_wants(&system, &mut wants);
    assert_eq!(wants.len(), 3);
    assert!(wants.iter().any(|w| w.value.class_name_str() == "n100"));
}

#[test]
fn wildcard_enumerates_radii_tokens() {
    let mut system = test_system();
    system
        .static_css
        .insert("borderRadius".into(), vec!["*".into()]);
    let mut wants = Vec::new();
    append_wants(&system, &mut wants);
    assert_eq!(wants.len(), 1);
    assert_eq!(wants[0].value.class_name_str(), "md");
}

#[test]
fn wildcard_mirrors_radius_longhands() {
    for prop in [
        "borderRadius",
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderBottomLeftRadius",
        "borderBottomRightRadius",
        "borderStartStartRadius",
        "borderStartEndRadius",
        "borderEndStartRadius",
        "borderEndEndRadius",
        "borderTopRadius",
        "borderBottomRadius",
        "borderLeftRadius",
        "borderRightRadius",
    ] {
        assert_eq!(wildcard_category(prop), Some("radii"), "{prop}");
    }
    assert_eq!(wildcard_category("display"), None);
}

#[test]
fn condition_prefixed_static_css_retains_condition() {
    let mut system = test_system();
    system
        .static_css
        .insert("_hover:color".into(), vec!["n100".into()]);
    let mut wants = Vec::new();
    let mut authored = Vec::new();
    let mut diagnostics = Vec::new();
    let mut ctx = StaticCssContext {
        system: &system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
    };
    append_static_css(&mut ctx);
    assert_eq!(wants.len(), 1);
    assert_eq!(wants[0].when.as_slice(), &["_hover".into()]);
    assert_eq!(authored[0].when, vec!["_hover".to_string()]);
}

#[test]
fn unknown_property_emits_diagnostic() {
    let mut system = test_system();
    system
        .static_css
        .insert("unknownProp".into(), vec!["val".into()]);
    let mut wants = Vec::new();
    let mut authored = Vec::new();
    let mut diagnostics = Vec::new();
    let mut ctx = StaticCssContext {
        system: &system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
    };
    append_static_css(&mut ctx);
    assert!(wants.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert!(diagnostics[0].message.contains("unknownProp"));
    assert!(
        diagnostics[0]
            .help
            .as_ref()
            .is_some_and(|help| help
                .iter()
                .any(|line| line == "remove 'unknownProp' or check its spelling"))
    );
}

#[test]
fn near_miss_property_suggests_and_wildcard_names_its_prop() {
    let mut system = test_system();
    system.static_css.insert("colr".into(), vec!["n100".into()]);
    system.static_css.insert("display".into(), vec!["*".into()]);
    let mut wants = Vec::new();
    let mut authored = Vec::new();
    let mut diagnostics = Vec::new();
    let mut ctx = StaticCssContext {
        system: &system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
    };
    append_static_css(&mut ctx);
    assert_eq!(diagnostics.len(), 2);
    assert_eq!(
        diagnostics[0].help,
        Some(vec![
            "did you mean `color`?".to_string(),
            "remove 'colr' or check its spelling".to_string(),
        ])
    );
    assert_eq!(
        diagnostics[1].help,
        Some(vec![
            "'display' has no token category; list concrete values instead of '*'"
                .to_string()
        ])
    );
}
