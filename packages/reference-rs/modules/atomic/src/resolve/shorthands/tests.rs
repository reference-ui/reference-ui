//! Shorthand resolution tripwires, forbidden table assertions, and unknown property gates.
//! Validates that shorthand decomposition strictly queries canon for longhand property definitions.
//! Ensures no private hardcoded property slices or split-brain dictionary tables exist in atomic.

use crate::atom::AtomValue;
use super::expand_shorthand;

#[test]
fn test_atomic_shorthand_tripwire() {
    let border_props = ["border", "borderTop", "borderBottom", "outline"];
    for prop in border_props {
        let canon_prop = canon::resolve_canonical_prop(prop);
        let canon_longhands = canon::native_longhands_for_prop(canon_prop)
            .unwrap_or_else(|| panic!("canon must define longhands for {canon_prop}"));
        let expanded = expand_shorthand(prop, &AtomValue::String("1px solid red".into()))
            .unwrap_or_else(|| panic!("expand_shorthand failed for {prop}"));
        let emitted_names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
        assert_eq!(
            emitted_names, canon_longhands,
            "Emitted longhands for '{prop}' must match canon longhands"
        );
    }

    let dimensional_props = ["padding", "margin", "inset"];
    for prop in dimensional_props {
        let canon_prop = canon::resolve_canonical_prop(prop);
        let canon_longhands = canon::native_longhands_for_prop(canon_prop)
            .unwrap_or_else(|| panic!("canon must define longhands for {canon_prop}"));
        let expanded = expand_shorthand(prop, &AtomValue::String("1px 2px 3px 4px".into()))
            .unwrap_or_else(|| panic!("expand_shorthand failed for {prop}"));
        let emitted_names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
        assert_eq!(
            emitted_names, canon_longhands,
            "Emitted longhands for '{prop}' must match canon longhands"
        );
    }
}

#[test]
fn test_forbidden_private_property_tables() {
    let border_src = include_str!("border.rs");
    let dimensional_src = include_str!("dimensional.rs");
    let tokens_src = include_str!("../tokens/mod.rs");

    assert!(
        !border_src.contains("BORDER_CONFIGS"),
        "border.rs must not contain BORDER_CONFIGS"
    );
    assert!(
        !border_src.contains("BorderProps"),
        "border.rs must not contain BorderProps"
    );
    assert!(
        !dimensional_src.contains("DIMENSIONAL_CONFIGS"),
        "dimensional.rs must not contain DIMENSIONAL_CONFIGS"
    );
    assert!(
        !dimensional_src.contains("DimensionalProps"),
        "dimensional.rs must not contain DimensionalProps"
    );

    assert!(
        !border_src.contains("&[(&str"),
        "border.rs must not define static property tuple slices"
    );
    assert!(
        !dimensional_src.contains("&[(&str"),
        "dimensional.rs must not define static property tuple slices"
    );

    assert!(
        !tokens_src.contains("\"accentColor\""),
        "tokens/mod.rs must not contain hardcoded accentColor"
    );
    assert!(
        !tokens_src.contains("matches!(prop,"),
        "tokens/mod.rs must not contain hardcoded matches on prop"
    );
}

#[test]
fn test_unknown_props_refuse_compilation() {
    use crate::atom::Want;
    use crate::resolve::resolve_want;

    for unknown in &["fooBar", "invalidProp", "onClick", "unknownStyle", "dataTest"] {
        let want = Want::new(*unknown, AtomValue::String("10px".into()));
        let atoms = resolve_want(&want);
        assert!(
            atoms.is_empty(),
            "Unknown property '{unknown}' must return empty atoms but got: {atoms:?}"
        );
    }
}

#[test]
fn test_dimensional_shorthand_token_counts() {
    assert!(expand_shorthand("padding", &AtomValue::String("10px".into())).is_none());
    assert!(expand_shorthand("p", &AtomValue::String("1r".into())).is_none());
    assert!(expand_shorthand("m", &AtomValue::String("2r".into())).is_none());

    let two = expand_shorthand("padding", &AtomValue::String("10px 20px".into()))
        .expect("padding 2 tokens should expand");
    assert_eq!(two.len(), 4);
    assert_eq!(two[0].0.as_ref(), "paddingTop");
    assert_eq!(two[0].1.class_name_str(), "10px");
    assert_eq!(two[1].0.as_ref(), "paddingRight");
    assert_eq!(two[1].1.class_name_str(), "20px");
    assert_eq!(two[2].0.as_ref(), "paddingBottom");
    assert_eq!(two[2].1.class_name_str(), "10px");
    assert_eq!(two[3].0.as_ref(), "paddingLeft");
    assert_eq!(two[3].1.class_name_str(), "20px");
}

#[test]
fn test_border_zero_and_whole_values() {
    let zero = expand_shorthand("border", &AtomValue::String("0".into()))
        .expect("border 0 should expand to width 0px");
    assert_eq!(zero.len(), 1);
    assert_eq!(zero[0].0.as_ref(), "borderWidth");
    assert_eq!(zero[0].1.class_name_str(), "0px");

    let whole = expand_shorthand("border", &AtomValue::String("none".into()))
        .expect("border none should pass through");
    assert_eq!(whole.len(), 1);
    assert_eq!(whole[0].0.as_ref(), "border");
    assert_eq!(whole[0].1.class_name_str(), "none");
}
