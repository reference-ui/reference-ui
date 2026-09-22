//! Shorthand resolution tripwires, forbidden table assertions, and unknown property gates.
//! Validates that shorthand decomposition strictly queries canon for longhand property definitions.
//! Ensures no private hardcoded property slices or split-brain dictionary tables exist in atomic.

use super::expand_shorthand;
use crate::atom::AtomValue;

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

    let pair_props = [
        "borderTopRadius",
        "borderRightRadius",
        "borderBottomRadius",
        "borderLeftRadius",
        "borderStartRadius",
        "borderEndRadius",
    ];
    for prop in pair_props {
        let canon_prop = canon::resolve_canonical_prop(prop);
        let canon_longhands = canon::native_longhands_for_prop(canon_prop)
            .unwrap_or_else(|| panic!("canon must define longhands for {canon_prop}"));
        let expanded = expand_shorthand(prop, &AtomValue::String("2r".into()))
            .unwrap_or_else(|| panic!("expand_shorthand failed for {prop}"));
        let emitted_names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
        assert_eq!(
            emitted_names, canon_longhands,
            "Emitted longhands for '{prop}' must match canon longhands"
        );
        assert!(
            expanded.iter().all(|(_, v)| v.class_name_str() == "2r"),
            "Pair '{prop}' must copy one value to both corners"
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

    for unknown in &[
        "fooBar",
        "invalidProp",
        "onClick",
        "unknownStyle",
        "dataTest",
    ] {
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
fn test_real_radius_properties_never_expand() {
    for prop in [
        "borderRadius",
        "borderTopLeftRadius",
        "borderStartStartRadius",
    ] {
        assert!(
            expand_shorthand(prop, &AtomValue::String("2r".into())).is_none(),
            "Real property '{prop}' must pass through, never expand"
        );
    }
}

#[test]
fn test_border_width_style_color_permutations() {
    // Core battery: all six orders lower to the same three longhands.
    let orders = [
        "1px solid red",
        "solid 1px red",
        "red 1px solid",
        "red solid 1px",
        "solid red 1px",
        "1px red solid",
    ];
    for order in orders {
        let expanded = expand_shorthand("border", &AtomValue::String(order.into()))
            .unwrap_or_else(|| panic!("border '{order}' should expand"));
        let names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
        assert_eq!(names, vec!["borderWidth", "borderStyle", "borderColor"]);
        assert_eq!(expanded[0].1.class_name_str(), "1px");
        assert_eq!(expanded[1].1.class_name_str(), "solid");
        assert_eq!(expanded[2].1.class_name_str(), "red");
    }
}

#[test]
fn test_border_extra_width_token_drops() {
    // Core battery: '1px 2px solid' keeps width+style; the extra width
    // never falls through to color.
    let expanded = expand_shorthand("border", &AtomValue::String("1px 2px solid".into()))
        .expect("border '1px 2px solid' should expand");
    let names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
    assert_eq!(names, vec!["borderWidth", "borderStyle"]);
    assert_eq!(expanded[0].1.class_name_str(), "1px");
    assert_eq!(expanded[1].1.class_name_str(), "solid");
}

#[test]
fn test_border_repeat_style_token_drops() {
    // 'solid dashed 1px': the first style wins and the repeat drops
    // instead of becoming a color.
    let expanded = expand_shorthand("border", &AtomValue::String("solid dashed 1px".into()))
        .expect("border 'solid dashed 1px' should expand");
    let names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
    assert_eq!(names, vec!["borderWidth", "borderStyle"]);
    assert_eq!(expanded[0].1.class_name_str(), "1px");
    assert_eq!(expanded[1].1.class_name_str(), "solid");
}

#[test]
fn test_outline_none_keeps_accessible_ring() {
    // Core battery: outline noneValue convention — transparent ring plus
    // offset for high-contrast mode, never bare none.
    let expanded = expand_shorthand("outline", &AtomValue::String("none".into()))
        .expect("outline 'none' should expand to the accessible ring");
    let names: Vec<&str> = expanded.iter().map(|(p, _)| p.as_ref()).collect();
    assert_eq!(names, vec!["outline", "outlineOffset"]);
    assert_eq!(expanded[0].1.class_name_str(), "2px solid transparent");
    assert_eq!(expanded[1].1.class_name_str(), "2px");
}

#[test]
fn test_border_none_stays_bare() {
    // Only outline carries the accessible convention; border 'none' passes through.
    let expanded = expand_shorthand("borderBottom", &AtomValue::String("none".into()))
        .expect("borderBottom 'none' should pass through");
    assert_eq!(expanded.len(), 1);
    assert_eq!(expanded[0].0.as_ref(), "borderBottom");
    assert_eq!(expanded[0].1.class_name_str(), "none");
}

#[test]
fn test_flex_single_keywords_emit_panda_triples() {
    // Panda flex utility values (RS-39): exact, case-sensitive, trim-tolerant.
    for (input, triple) in [
        ("1", "1 1 0%"),
        ("auto", "1 1 auto"),
        ("initial", "0 1 auto"),
        ("none", "none"),
    ] {
        let expanded = expand_shorthand("flex", &AtomValue::String(input.into()))
            .unwrap_or_else(|| panic!("flex '{input}' should map to its triple"));
        assert_eq!(expanded.len(), 1);
        assert_eq!(expanded[0].0.as_ref(), "flex");
        assert_eq!(expanded[0].1.class_name_str(), triple);
    }
    let numeric = expand_shorthand("flex", &AtomValue::Number("1".into()))
        .expect("numeric flex 1 should map to its triple");
    assert_eq!(numeric[0].1.class_name_str(), "1 1 0%");
}

#[test]
fn test_flex_other_values_pass_through_raw() {
    // No values-map hit: Panda emits the authored value untouched.
    for input in [
        "0 0 auto", "1 1 0%", "2 30px", "2", "0", "1 1", "inherit", "AUTO", "None",
    ] {
        assert!(
            expand_shorthand("flex", &AtomValue::String(input.into())).is_none(),
            "flex '{input}' must pass through raw, never decompose"
        );
    }
}

#[test]
fn test_border_gate_rejects_non_border_trios() {
    // RS-39 family gate: len-3 trios of other families never classify as
    // border, even when fed straight into the border pass.
    for (prop, val) in [
        ("flex", "1 1 0%"),
        ("columns", "100px 3"),
        ("lineClamp", "2"),
        ("caret", "red"),
        ("listStyle", "square inside"),
        ("gridTemplate", "1fr 1fr"),
    ] {
        assert!(
            super::border::expand_border_shorthand(prop, val).is_none(),
            "'{prop}' must never route through border decomposition"
        );
    }
}

#[test]
fn test_border_gate_keeps_rule_shorthands() {
    // columnRule/rowRule genuinely are width/style/color and stay pinned.
    let column = expand_shorthand("columnRule", &AtomValue::String("1px solid red".into()))
        .expect("columnRule should still decompose");
    let names: Vec<&str> = column.iter().map(|(p, _)| p.as_ref()).collect();
    assert_eq!(
        names,
        vec!["columnRuleWidth", "columnRuleStyle", "columnRuleColor"]
    );
    let row = expand_shorthand("rowRule", &AtomValue::String("1px solid red".into()))
        .expect("rowRule should still decompose");
    let names: Vec<&str> = row.iter().map(|(p, _)| p.as_ref()).collect();
    assert_eq!(names, vec!["rowRuleWidth", "rowRuleStyle", "rowRuleColor"]);
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

#[test]
fn no_alias_chain_contract() {
    // longhands_for_canon skips native_longhands_for_prop's re-resolve: sound
    // only because resolve_alias is single-step. Fails loudly on regen drift.
    for alias in canon::ALIASES {
        assert!(
            canon::resolve_alias(alias.canonical).is_none(),
            "alias target '{}' must never itself be an alias",
            alias.canonical
        );
    }
}

#[test]
fn trio_prefilter_table_contract() {
    // Every border-family trio owner must pass maybe_border_family; the
    // count pins the table shape so regen drift fails loudly, never silently.
    let mut owners = 0;
    for prop in canon::CANONICAL_PROPERTIES {
        if super::border::is_border_family(prop.longhands) {
            owners += 1;
            assert!(
                super::border::maybe_border_family(prop.name),
                "trio owner '{}' must pass the pre-filter",
                prop.name
            );
        }
    }
    assert_eq!(owners, 12, "trio owner count drifted — re-derive the filter");
}

#[test]
fn longhands_for_canon_matches_native_lookup() {
    // The shared probe must agree with native_longhands_for_prop on every
    // canonical name and every alias, or the hoist is unsound.
    for prop in canon::CANONICAL_PROPERTIES {
        assert_eq!(
            super::longhands_for_canon(prop.name),
            canon::native_longhands_for_prop(prop.name),
            "probe mismatch for '{}'",
            prop.name
        );
    }
    for alias in canon::ALIASES {
        let canon = canon::resolve_canonical_prop(alias.alias);
        assert_eq!(
            super::longhands_for_canon(canon),
            canon::native_longhands_for_prop(alias.alias),
            "probe mismatch for alias '{}'",
            alias.alias
        );
    }
}
