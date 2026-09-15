//! TYP-FONT-01–03: FontRegistry dump keys and FontProps discrimination.
//! Lib dump keys are authored names (`bold`) whose values are CSS numbers
//! (`700`). FONT-01 emits `'bold': true` and quotes family names. FONT-02
//! mixes those keys into StyleProps via mapped FontProps (`'bold' | 'sans.bold'`,
//! not `'400'`). FONT-03 uses the empty-registry never-guard so StyleProps
//! stays a usable object type instead of collapsing to `never`.

use super::{font_style_dts, font_system, style_dts};
use crate::emit_dts;

/// TYP-FONT-01 — FontRegistry quotes families and dump weight keys, not CSS numbers.
#[test]
fn typ_font_01_emits_font_registry_from_dump_weight_keys() {
    let system = font_system();
    let sans = system.fonts.get("sans").expect("sans family");
    assert!(
        sans.weights.contains_key("bold") && sans.weights.contains_key("normal"),
        "dump weight keys are authored names, not CSS numbers: {:?}",
        sans.weights.keys().collect::<Vec<_>>()
    );
    assert_eq!(sans.weights.get("bold").map(String::as_str), Some("700"));
    assert!(
        !sans.weights.contains_key("700") && !sans.weights.contains_key("400"),
        "CSS numbers are dump values, not keys"
    );

    let dts = emit_dts(&system);
    assert!(
        dts.contains("export interface FontRegistry {"),
        "TYP-FONT-01: missing FontRegistry in:\n{dts}"
    );
    assert!(
        dts.contains("'sans': { 'bold': true; 'normal': true }"),
        "TYP-FONT-01: sans must use dump keys `bold`/`normal` in:\n{dts}"
    );
    assert!(
        dts.contains("'mono': { 'light': true; 'medium': true }"),
        "TYP-FONT-01: mono must use dump keys `light`/`medium` in:\n{dts}"
    );
    assert!(
        !dts.contains("'700': true") && !dts.contains("'400': true"),
        "TYP-FONT-01: must not emit CSS weight values as keys in:\n{dts}"
    );
    assert!(
        !dts.contains("\n  sans:"),
        "TYP-FONT-01: family names must be quoted in:\n{dts}"
    );
}

/// TYP-FONT-02 — populated FontRegistry narrows weight to dump keys + `family.key`.
#[test]
fn typ_font_02_narrows_font_props_to_dump_weight_keys() {
    let dts = font_style_dts();
    assert_contains(
        &dts,
        "TYP-FONT-02",
        &[
            "'sans': { 'bold': true; 'normal': true }",
            "'mono': { 'light': true; 'medium': true }",
            "export type StyleProps = FontProps & {",
            "weight?: StylePropValue<FontWeightValue<TFont>>",
            "font?: StylePropValue<TFont>",
            "`${TFont}.${FontWeightName<TFont>}`",
            "| FontWeightName<TFont>",
            "| ScopedFontWeight<TFont>",
            "[TFont in FontName]",
        ],
    );
    assert_absent(
        &dts,
        "TYP-FONT-02",
        &[
            "'700': true",
            "'400': true",
            "'300': true",
            "'500': true",
            "'sans.400'",
            "'sans.700'",
            "| '700'",
            "| '400'",
            "'sans': { 'bold': true; 'normal': true; 'light'",
        ],
    );
}

/// TYP-FONT-03 — empty FontRegistry keeps font/weight as string and StyleProps usable.
#[test]
fn typ_font_03_falls_back_to_string_when_font_registry_is_empty() {
    let dts = style_dts();
    assert_contains(
        &dts,
        "TYP-FONT-03",
        &[
            "export interface FontRegistry {}",
            "font?: StylePropValue<string>;",
            "weight?: StylePropValue<string>;",
            "export type FontProps = [FontName] extends [never]",
            "? FallbackFontProps",
            ": ScopedFontProps;",
            "export type StyleProps = FontProps & {",
            "color?: StylePropValue<ColorToken | (string & {})>;",
        ],
    );
    assert_absent(
        &dts,
        "TYP-FONT-03",
        &["StyleProps = never", "export type StyleProps = never"],
    );
}

fn assert_contains(dts: &str, label: &str, needles: &[&str]) {
    for needle in needles {
        assert!(
            dts.contains(needle),
            "{label}: missing `{needle}` in:\n{dts}"
        );
    }
}

fn assert_absent(dts: &str, label: &str, needles: &[&str]) {
    for needle in needles {
        assert!(
            !dts.contains(needle),
            "{label}: must not contain `{needle}` in:\n{dts}"
        );
    }
}
