//! Lowering tests: flatten paths, kebab cssVar, the seven-case light/dark
//! table, font dual-source duplicates, and brace-alias cycle detection.

use super::*;

#[test]
fn bas_token_01_indexes_five_segment_path() {
    let system = crate::BaseSystem::from_json(
        r#"{"tokens":{"colors":{"ui":{"list":{"definition":{"description":{"foreground":{"light":"{colors.design.text.light}","dark":"{colors.design.text.light}"}}}}}}}}"#,
    )
    .unwrap();
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
    let system = crate::BaseSystem::from_json(
        r##"{"tokens":{"colors":{"n300":{"value":"#d4d4d8"},"myColor":{"value":"red"},"ui":{"kbd":{"shadowMix":{"value":"black"}}}},"fontSizes":{"lg":{"value":"1.125rem"}},"spacing":{"4r":{"value":"1rem"}},"radii":{"md":{"value":"0.4rem"}}}}"##,
    )
    .unwrap();
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
    let system =
        crate::BaseSystem::from_json(r#"{"tokens":{"spacing":{"sm":{"value":"0.5rem"}}}}"#)
            .unwrap();
    assert_eq!(system.token_light("spacing.sm"), Some("0.5rem"));
    assert!(system.token_dark("spacing.sm").is_none());
}

#[test]
fn bas_token_04_resolves_mode_slots() {
    let system = crate::BaseSystem::from_json(
        r#"{"tokens":{"colors":{"onlyValue":{"value":"V"},"onlyLight":{"light":"L"},"onlyDark":{"dark":"D"},"valueDark":{"value":"V","dark":"D"},"valueLight":{"value":"V","light":"L"},"lightDark":{"light":"L","dark":"D"},"allThree":{"value":"V","light":"L","dark":"D"}}}}"#,
    )
    .unwrap();
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
    let equal =
        crate::BaseSystem::from_json(r#"{"tokens":{"colors":{"same":{"light":"X","dark":"X"}}}}"#)
            .unwrap();
    assert_eq!(equal.token_dark("colors.same"), Some("X"));
}

#[test]
fn bas_token_07_fonts_dual_source_duplicate() {
    let conflicting = crate::BaseSystem::from_json(
        r#"{"tokens":{"fonts":{"sans":{"value":"A"}}},"fonts":{"sans":{"value":"B"}}}"#,
    )
    .unwrap_err();
    assert!(matches!(
        conflicting,
        FromJsonError::DuplicatePath { path } if path == "fonts.sans"
    ));
    let same = crate::BaseSystem::from_json(
        r#"{"tokens":{"fonts":{"sans":{"value":"A"}}},"fonts":{"sans":{"value":"A"}}}"#,
    )
    .unwrap_err();
    assert!(matches!(
        same,
        FromJsonError::DuplicatePath { path } if path == "fonts.sans"
    ));
}

#[test]
fn bas_token_08_keeps_brace_aliases_and_detects_cycle() {
    let system = crate::BaseSystem::from_json(
        r##"{"tokens":{"colors":{"brand":{"value":"{colors.blue.600}"},"blue":{"600":{"value":"#2563eb"}}}}}"##,
    )
    .unwrap();
    assert_eq!(
        system.token_light("colors.brand"),
        Some("{colors.blue.600}")
    );
    let cycle = crate::BaseSystem::from_json(
        r#"{"tokens":{"colors":{"a":{"value":"{colors.b}"},"b":{"value":"{colors.a}"}}}}"#,
    )
    .unwrap_err();
    assert!(matches!(cycle, FromJsonError::Cycle { .. }));
}
