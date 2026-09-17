//! Lowering tests: flatten paths, kebab cssVar, the seven-case light/dark
//! table, font dual-source duplicates, and brace-alias cycle detection.
//! Verifies that valid EvaluatedSystemSpec envelopes lower into indexed tokens
//! and that provenance source attributes are carried onto error diagnostics.

use super::*;

fn spec_json(tokens: &str) -> String {
    format!(
        r#"{{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{tokens},"fonts":{{}},"globalCss":[],"keyframes":{{}},"recipes":{{}},"staticCss":{{}},"provenance":[]}}"#
    )
}

fn spec_json_with_fonts(tokens: &str, fonts: &str) -> String {
    format!(
        r#"{{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{tokens},"fonts":{fonts},"globalCss":[],"keyframes":{{}},"recipes":{{}},"staticCss":{{}},"provenance":[]}}"#
    )
}

#[test]
fn bas_token_01_indexes_five_segment_path() {
    let json = spec_json(
        r#"{"colors":{"ui":{"list":{"definition":{"description":{"foreground":{"light":"{colors.design.text.light}","dark":"{colors.design.text.light}"}}}}}}}"#,
    );
    let system = crate::BaseSystem::from_json(&json).unwrap();
    let key = "colors.ui.list.definition.description.foreground";
    assert!(system.is_token(key));
    assert_eq!(system.token_category(key), Some("colors"));
    assert_eq!(
        system.token_css_var(key),
        Some("--colors-ui-list-definition-description-foreground")
    );
    assert_eq!(system.token_light(key), Some("{colors.design.text.light}"));
}

#[test]
fn bas_token_02_kebabs_category_only() {
    let json = spec_json(
        r##"{"colors":{"n300":{"value":"#d4d4d8"},"myColor":{"value":"red"},"ui":{"kbd":{"shadowMix":{"value":"black"}}}},"fontSizes":{"lg":{"value":"1.125rem"}},"spacing":{"4r":{"value":"1rem"}},"radii":{"md":{"value":"0.4rem"}}}"##,
    );
    let system = crate::BaseSystem::from_json(&json).unwrap();
    assert_eq!(system.token_css_var("colors.n300"), Some("--colors-n300"));
    assert_eq!(
        system.token_css_var("colors.myColor"),
        Some("--colors-myColor")
    );
    assert_eq!(
        system.token_css_var("colors.ui.kbd.shadowMix"),
        Some("--colors-ui-kbd-shadowMix")
    );
    assert_eq!(
        system.token_css_var("fontSizes.lg"),
        Some("--font-sizes-lg")
    );
    assert_eq!(system.token_css_var("spacing.4r"), Some("--spacing-4r"));
    assert_eq!(system.token_css_var("radii.md"), Some("--radii-md"));
}

#[test]
fn bas_token_03_value_leaf_has_no_dark_override() {
    let json = spec_json(r#"{"spacing":{"sm":{"value":"0.5rem"}}}"#);
    let system = crate::BaseSystem::from_json(&json).unwrap();
    assert_eq!(system.token_light("spacing.sm"), Some("0.5rem"));
    assert!(system.token_dark("spacing.sm").is_none());
}

#[test]
fn bas_token_04_resolves_mode_slots() {
    let json = spec_json(
        r#"{"colors":{"onlyValue":{"value":"V"},"onlyLight":{"light":"L"},"onlyDark":{"dark":"D"},"valueDark":{"value":"V","dark":"D"},"valueLight":{"value":"V","light":"L"},"lightDark":{"light":"L","dark":"D"},"allThree":{"value":"V","light":"L","dark":"D"}}}"#,
    );
    let system = crate::BaseSystem::from_json(&json).unwrap();
    assert_eq!(system.token_light("colors.onlyValue"), Some("V"));
    assert!(system.token_dark("colors.onlyValue").is_none());
    assert_eq!(system.token_light("colors.onlyLight"), Some("L"));
    assert!(system.token_dark("colors.onlyLight").is_none());
    assert_eq!(system.token_light("colors.onlyDark"), Some("D"));
    assert!(system.token_dark("colors.onlyDark").is_none());
    assert_eq!(system.token_light("colors.valueDark"), Some("V"));
    assert_eq!(system.token_dark("colors.valueDark"), Some("D"));
    assert_eq!(system.token_light("colors.valueLight"), Some("L"));
    assert_eq!(system.token_dark("colors.valueLight"), Some("V"));
    assert_eq!(system.token_light("colors.lightDark"), Some("L"));
    assert_eq!(system.token_dark("colors.lightDark"), Some("D"));
    assert_eq!(system.token_light("colors.allThree"), Some("L"));
    assert_eq!(system.token_dark("colors.allThree"), Some("D"));
    let equal_json = spec_json(r#"{"colors":{"same":{"light":"X","dark":"X"}}}"#);
    let equal = crate::BaseSystem::from_json(&equal_json).unwrap();
    assert_eq!(equal.token_dark("colors.same"), Some("X"));
}

#[test]
fn bas_token_07_fonts_dual_source_duplicate() {
    let conflicting = spec_json_with_fonts(
        r#"{"fonts":{"sans":{"value":"A"}}}"#,
        r#"{"sans":{"value":"B"}}"#,
    );
    let err = crate::BaseSystem::from_json(&conflicting).unwrap_err();
    assert!(matches!(
        err,
        FromJsonError::DuplicatePath { ref path, .. } if path == "fonts.sans"
    ));
}

#[test]
fn bas_token_08_keeps_brace_aliases_and_detects_cycle() {
    let json = spec_json(
        r##"{"colors":{"brand":{"value":"{colors.blue.600}"},"blue":{"600":{"value":"#2563eb"}}}}"##,
    );
    let system = crate::BaseSystem::from_json(&json).unwrap();
    assert_eq!(
        system.token_light("colors.brand"),
        Some("{colors.blue.600}")
    );
    let cycle_json =
        spec_json(r#"{"colors":{"a":{"value":"{colors.b}"},"b":{"value":"{colors.a}"}}}"#);
    let cycle = crate::BaseSystem::from_json(&cycle_json).unwrap_err();
    assert!(matches!(cycle, FromJsonError::Cycle { .. }));
}

#[test]
fn provenance_source_appears_on_token_diagnostic() {
    let json = r#"{
        "schemaVersion": 1,
        "profile": "reference-ui",
        "name": "test",
        "tokens": {
            "colors": {
                "primary": { "500": "raw-string-leaf" }
            }
        },
        "fonts": {},
        "globalCss": [],
        "keyframes": {},
        "recipes": {},
        "staticCss": {},
        "provenance": [
            {
                "source": "src/tokens/colors.ts",
                "kind": "tokens",
                "keys": ["colors.primary.500"]
            }
        ]
    }"#;
    let err = crate::BaseSystem::from_json(json).unwrap_err();
    let display = err.to_string();
    assert!(
        display.contains("src/tokens/colors.ts"),
        "diagnostic must include provenance source: {display}"
    );
}
