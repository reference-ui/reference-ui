//! TYP-STRICT-01–05: open hatch vs strict SystemStyleObject wrappers.
//! `emit_dts` stays open-mode so goldens keep `Token | (string & {})`.
//! `emit_dts_with` wraps `BaseSystemStyleObject` in declaration order.
//! Unknown strict names are skipped; duplicates keep the first occurrence.
//! Radius keys come from canon (`borderRadius` and *Radius properties), never
//! Panda `rounded*`. Spacing strict is printed here even though core's spacing
//! wrapper is null.

use super::{style_dts, style_dts_with};
use crate::{emit_dts, emit_dts_with, EmitOptions};

const COLOR_HATCH: &str = "color?: StylePropValue<ColorToken | (string & {})>;";
const SPACING_HATCH: &str = "p?: StylePropValue<SpacingToken | (string & {})>;";
const RADIUS_HATCH: &str = "borderRadius?: StylePropValue<RadiusToken | (string & {})>;";
const COLOR_WRAP: &str =
    "export type SystemStyleObject = StrictColorProps<BaseSystemStyleObject> & {";
const RADII_WRAP: &str =
    "export type SystemStyleObject = StrictRadiiProps<BaseSystemStyleObject> & {";
const SPACING_WRAP: &str =
    "export type SystemStyleObject = StrictSpacingProps<BaseSystemStyleObject> & {";
const COLORS_RADII_WRAP: &str =
    "export type SystemStyleObject = StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>> & {";
const ALL_WRAP: &str = "export type SystemStyleObject = StrictSpacingProps<StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>> & {";
const COLOR_WRAPPER: &str =
    "export type StrictColorProps<P> = Omit<P, ColorPropKeys> & SafeColorProps;";
const RADII_WRAPPER: &str =
    "export type StrictRadiiProps<P> = Omit<P, RadiiPropKeys> & SafeRadiiProps;";
const SPACING_WRAPPER: &str =
    "export type StrictSpacingProps<P> = Omit<P, SpacingPropKeys> & SafeSpacingProps;";

/// TYP-STRICT-01 — strict colors wrap SystemStyleObject; keywords stay, hatch does not.
#[test]
fn typ_strict_01_restricts_colors_to_tokens_and_keywords() {
    let dts = style_dts_with(&["colors"]);
    assert!(
        dts.contains(COLOR_WRAP) && dts.contains(COLOR_WRAPPER),
        "TYP-STRICT-01: missing StrictColorProps wrap in:\n{dts}"
    );
    assert!(
        dts.contains("| 'white'")
            && dts.contains("| 'black'")
            && dts.contains("| 'inherit'")
            && dts.contains("| 'currentColor'")
            && dts.contains("| 'transparent'"),
        "TYP-STRICT-01: missing StrictColorValue keywords in:\n{dts}"
    );
    assert!(
        dts.contains(COLOR_HATCH),
        "TYP-STRICT-01: StyleProps stays open; wrap is on SystemStyleObject:\n{dts}"
    );
    assert!(
        !dts.contains("StrictRadiiProps") && !dts.contains("StrictSpacingProps"),
        "TYP-STRICT-01: colors-only must not wrap radii or spacing:\n{dts}"
    );
}

/// TYP-STRICT-02 — strict radii use canon keys; no Panda rounded*.
#[test]
fn typ_strict_02_restricts_radii_to_tokens_and_keywords() {
    let dts = style_dts_with(&["radii"]);
    assert!(
        dts.contains(RADII_WRAP) && dts.contains(RADII_WRAPPER),
        "TYP-STRICT-02: missing StrictRadiiProps wrap in:\n{dts}"
    );
    assert!(
        dts.contains("| 'none'")
            && dts.contains("| 'inherit'")
            && dts.contains("| 'initial'")
            && dts.contains("| 'revert'"),
        "TYP-STRICT-02: missing StrictRadiusValue keywords in:\n{dts}"
    );
    assert_prop(
        &dts,
        "borderRadius",
        "StylePropValue<RadiusToken | (string & {})>",
    );
    assert_prop(
        &dts,
        "borderTopLeftRadius",
        "StylePropValue<RadiusToken | (string & {})>",
    );
    assert!(
        !canon::is_known_style_prop("rounded") && !canon::is_known_style_prop("roundedTop"),
        "TYP-STRICT-02: canon refuses Panda rounded* aliases"
    );
    assert!(
        !dts.contains("rounded?:")
            && !dts.contains("| 'rounded'")
            && !dts.contains("| 'roundedTop'"),
        "TYP-STRICT-02: must not invent Panda rounded* keys:\n{dts}"
    );
}

/// TYP-STRICT-03 — strict spacing wrap; StyleProps keeps the open hatch.
#[test]
fn typ_strict_03_restricts_spacing_to_tokens_and_keywords() {
    let dts = style_dts_with(&["spacing"]);
    assert!(
        dts.contains(SPACING_WRAP) && dts.contains(SPACING_WRAPPER),
        "TYP-STRICT-03: missing StrictSpacingProps wrap in:\n{dts}"
    );
    assert!(
        dts.contains("| 0") && dts.contains("| '0'") && dts.contains("| 'auto'"),
        "TYP-STRICT-03: missing StrictSpacingValue keywords in:\n{dts}"
    );
    assert!(
        dts.contains(SPACING_HATCH),
        "TYP-STRICT-03: StyleProps stays open; wrap is on SystemStyleObject:\n{dts}"
    );
    assert!(
        !dts.contains("gap?:"),
        "TYP-STRICT-03: StyleProps still omits gap (STYLE-02 box spacing only):\n{dts}"
    );
}

/// TYP-STRICT-04 — emit_dts is open-mode; color, radius, and spacing keep the hatch.
#[test]
fn typ_strict_04_open_mode_keeps_escape_hatch() {
    let dts = style_dts();
    assert!(
        dts.contains(COLOR_HATCH) && dts.contains(SPACING_HATCH) && dts.contains(RADIUS_HATCH),
        "TYP-STRICT-04: open StyleProps must keep the hatch:\n{dts}"
    );
    assert!(
        !dts.contains("StrictColorProps")
            && !dts.contains("BaseSystemStyleObject")
            && dts.contains("export type SystemStyleObject = StyleProps & {"),
        "TYP-STRICT-04: open emit must not wrap SystemStyleObject:\n{dts}"
    );
    let system = super::style_system();
    assert_eq!(
        emit_dts(&system),
        emit_dts_with(&system, &EmitOptions::default()),
        "TYP-STRICT-04: emit_dts must match empty-strict emit_dts_with"
    );
    assert_eq!(
        dts,
        style_dts_with(&[]),
        "TYP-STRICT-04: empty strict list is open mode"
    );
}

/// TYP-STRICT-05 — wrappers compose in declaration order; unknown/dup names skip.
#[test]
fn typ_strict_05_composes_wrappers_in_declaration_order() {
    let colors_radii = style_dts_with(&["colors", "radii"]);
    assert!(
        colors_radii.contains(COLORS_RADII_WRAP)
            && colors_radii.contains(COLOR_WRAPPER)
            && colors_radii.contains(RADII_WRAPPER),
        "TYP-STRICT-05: expected StrictRadiiProps<StrictColorProps<…>> in:\n{colors_radii}"
    );
    assert_eq!(
        style_dts_with(&["colors", "radii", "colors"]),
        colors_radii,
        "TYP-STRICT-05: duplicate colors must be ignored"
    );
    assert_eq!(
        style_dts_with(&["colors", "nope", "radii", "fonts"]),
        colors_radii,
        "TYP-STRICT-05: unknown names must be skipped"
    );
    let all = style_dts_with(&["colors", "radii", "spacing"]);
    assert!(
        all.contains(ALL_WRAP),
        "TYP-STRICT-05: spacing joins in declaration order:\n{all}"
    );
}

fn assert_prop(dts: &str, name: &str, value: &str) {
    let line = format!("  {name}?: {value};");
    assert!(dts.contains(&line), "missing `{line}` in:\n{dts}");
}
