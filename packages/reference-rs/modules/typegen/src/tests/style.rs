//! TYP-STYLE-02/03/04/06: StyleProps narrowing, conditions, dialect mix-in, open keys.
//! STYLE-02 inspects color and spacing keys on a dump that reuses catalog
//! tokens plus `sm`/`md`/`lg` breakpoints. STYLE-03 asserts `StyleConditionKey`
//! on that same emit: named conditions and `@${bp}`, never a bare viewport
//! member (RadiusToken may still contain `'sm'`, so pins read the alias
//! line). STYLE-04 omits raw CSS `font`/`weight`/`container`/`r`, replaces
//! them with dialect `container`/`r`, and intersects `FontProps`. STYLE-05
//! prints recursive SystemStyleObject on this dump; proof is tsc, not these
//! string contains. STYLE-06 pins open keys plus the custom-property index
//! and the `variant`/`colorMode` exclusion. Catalog emit stays token-only.

use super::{catalog_dts, style_dts};
use crate::primitives_vocabulary_json;
use std::collections::BTreeSet;

const COLOR_VALUE: &str = "StylePropValue<ColorToken | (string & {})>";
const SPACING_VALUE: &str = "StylePropValue<SpacingToken | (string & {})>";
const CONTAINER_VALUE: &str = "StylePropValue<string | boolean>";
const RHYTHM_VALUE: &str = "StylePropValue<Record<string | number, StyleProps>>";
const OPEN_VALUE: &str = "StylePropValue<string | number>";
const CUSTOM_PROPERTY_INDEX: &str = "  [K in `--${string}`]?: StylePropValue<string | number>;";
const PROP_VALUE: &str =
    "export type StylePropValue<T> = T | Array<T | null> | { [K in StyleConditionKey]?: T };";
const STYLE_PROPS_HEAD: &str = "export type StyleProps = FontProps & {";

const COLOR_KEYS: &[&str] = &["bg", "background", "backgroundColor", "color"];
const SPACING_KEYS: &[&str] = &[
    "p",
    "padding",
    "mt",
    "marginTop",
    "marginX",
    "marginY",
    "paddingX",
    "paddingY",
];
const OPEN_KEYS: &[&str] = &[
    "display",
    "flexDirection",
    "gap",
    "borderStyle",
    "borderWidth",
    "fontSize",
    "size",
];

/// TYP-STYLE-02 — color and spacing StyleProps keep aliases and the open hatch.
#[test]
fn typ_style_02_narrows_style_props_with_aliases_and_tokens() {
    let dts = style_dts();
    assert!(
        dts.contains(STYLE_PROPS_HEAD),
        "TYP-STYLE-02: missing StyleProps in:\n{dts}"
    );
    for name in COLOR_KEYS {
        assert_prop(&dts, name, COLOR_VALUE);
    }
    for name in SPACING_KEYS {
        assert_prop(&dts, name, SPACING_VALUE);
    }
    assert!(
        dts.contains(PROP_VALUE),
        "TYP-STYLE-02: missing StylePropValue hatch in:\n{dts}"
    );
    assert!(
        !dts.contains("@reference-ui/styled") && !dts.contains("csstype"),
        "TYP-STYLE-02: must not import styled or csstype:\n{dts}"
    );
    let catalog = catalog_dts();
    assert!(
        !catalog.contains("StyleProps")
            && !catalog.contains("StyleConditionKey")
            && !catalog.contains("SystemStyleObject"),
        "TYP-STYLE-02: token catalog must not pick up StyleProps:\n{catalog}"
    );
}

/// TYP-STYLE-03 — StyleConditionKey is named + `@bp`, never a viewport member.
#[test]
fn typ_style_03_filters_viewport_keys_from_style_condition_key() {
    let dts = style_dts();
    let lits = condition_lits(&dts);
    for needle in [
        "'_hover'",
        "'_focusVisible'",
        "'_dark'",
        "'_light'",
        "'@sm'",
        "'@md'",
    ] {
        assert!(
            lits.contains(needle),
            "TYP-STYLE-03: StyleConditionKey missing {needle} in {lits:?}"
        );
    }
    for forbidden in ["'sm'", "'md'", "'lg'", "'smToMd'"] {
        assert!(
            !lits.contains(forbidden),
            "TYP-STYLE-03: StyleConditionKey must not contain viewport member {forbidden}: {lits:?}"
        );
    }
    assert!(
        !canon::is_condition("sm"),
        "TYP-STYLE-03: bare sm is not a condition key"
    );
    assert!(
        dts.contains(PROP_VALUE),
        "TYP-STYLE-03: StylePropValue must allow T, arrays, and condition maps:\n{dts}"
    );
}

fn assert_prop(dts: &str, name: &str, value: &str) {
    let line = format!("  {name}?: {value};");
    assert!(dts.contains(&line), "missing `{line}` in:\n{dts}");
}

fn condition_lits(dts: &str) -> BTreeSet<&str> {
    let prefix = "export type StyleConditionKey = ";
    let start = dts
        .find(prefix)
        .unwrap_or_else(|| panic!("TYP-STYLE-03: missing StyleConditionKey in:\n{dts}"));
    let rest = &dts[start + prefix.len()..];
    let end = rest
        .find(";\n")
        .or_else(|| rest.find(';'))
        .unwrap_or_else(|| panic!("TYP-STYLE-03: unterminated StyleConditionKey in:\n{dts}"));
    rest[..end].split(" | ").map(str::trim).collect()
}

/// TYP-STYLE-04 — dialect container/r + FontProps; no raw CSS font/weight/container/r keys.
#[test]
fn typ_style_04_layers_dialect_props_and_omits_conflicting_css() {
    let dts = style_dts();
    assert!(
        dts.contains(STYLE_PROPS_HEAD),
        "TYP-STYLE-04: StyleProps must intersect FontProps in:\n{dts}"
    );
    assert_prop(&dts, "container", CONTAINER_VALUE);
    assert_prop(&dts, "r", RHYTHM_VALUE);
    let fields = style_props_fields(&dts);
    assert!(
        !fields.contains("font?:") && !fields.contains("weight?:"),
        "TYP-STYLE-04: StyleProps object must not redeclare font/weight; they come from FontProps:\n{fields}"
    );
    assert!(
        dts.contains("export type FontProps = [FontName] extends [never]")
            && dts.contains("? FallbackFontProps")
            && dts.contains(": ScopedFontProps;"),
        "TYP-STYLE-04: missing FontProps never-guard in:\n{dts}"
    );
    assert!(
        !dts.contains("@reference-ui/styled") && !dts.contains("csstype"),
        "TYP-STYLE-04: must not import styled or csstype:\n{dts}"
    );
    let catalog = catalog_dts();
    assert!(
        !catalog.contains("container?:")
            && !catalog.contains("FontProps")
            && !catalog.contains("SystemStyleObject"),
        "TYP-STYLE-04: token catalog must stay token-only:\n{catalog}"
    );
}

/// TYP-STYLE-06 — open keys take string-or-number; custom-property index; no primitive metadata.
#[test]
fn typ_style_06_emits_open_keys_and_custom_property_index() {
    let dts = style_dts();
    for name in OPEN_KEYS {
        assert_prop(&dts, name, OPEN_VALUE);
    }
    assert!(
        dts.contains(CUSTOM_PROPERTY_INDEX),
        "TYP-STYLE-06: missing custom-property index in:\n{dts}"
    );
    let fields = style_props_fields(&dts);
    for forbidden in ["variant?:", "colorMode?:"] {
        assert!(
            !fields.contains(forbidden),
            "TYP-STYLE-06: StyleProps must not declare primitive metadata {forbidden}:\n{fields}"
        );
    }
}

/// TYP-VOCAB-00 — the napi vocabulary reads the same PropDefs the printer prints.
#[test]
fn typ_vocab_00_vocabulary_matches_printed_style_props() {
    let json = primitives_vocabulary_json().expect("vocabulary serializes");
    let vocab: serde_json::Value =
        serde_json::from_str(&json).expect("vocabulary is valid JSON");
    let props = vocab["props"].as_array().expect("props is an array");
    let names: BTreeSet<&str> = props
        .iter()
        .map(|name| name.as_str().expect("prop is a string"))
        .collect();
    for present in ["bg", "color", "container", "p", "r", "size"] {
        assert!(
            names.contains(present),
            "TYP-VOCAB-00: vocabulary missing {present} in:\n{json}"
        );
    }
    for absent in ["variant", "colorMode", "font", "weight"] {
        assert!(
            !names.contains(absent),
            "TYP-VOCAB-00: vocabulary must not carry {absent} in:\n{json}"
        );
    }
    assert_eq!(
        vocab["domains"]["container"].as_str(),
        Some("container"),
        "TYP-VOCAB-00: container domain in:\n{json}"
    );
    assert_eq!(
        vocab["domains"]["r"].as_str(),
        Some("rhythm"),
        "TYP-VOCAB-00: r domain in:\n{json}"
    );
    assert_eq!(
        vocab["aliases"]["bg"].as_str(),
        Some("background"),
        "TYP-VOCAB-00: bg alias in:\n{json}"
    );
    let dts = style_dts();
    assert!(
        dts.contains("  container?: StylePropValue<string | boolean>;"),
        "TYP-VOCAB-00: printer and vocabulary disagree on container in:\n{dts}"
    );
}

fn style_props_fields(dts: &str) -> &str {
    let start = dts
        .find(STYLE_PROPS_HEAD)
        .unwrap_or_else(|| panic!("TYP-STYLE-04: missing StyleProps in:\n{dts}"));
    let rest = &dts[start + STYLE_PROPS_HEAD.len()..];
    let end = rest
        .find("\n};")
        .unwrap_or_else(|| panic!("TYP-STYLE-04: unterminated StyleProps in:\n{dts}"));
    &rest[..end]
}
