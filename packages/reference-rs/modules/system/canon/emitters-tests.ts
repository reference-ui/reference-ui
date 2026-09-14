/**
 * Test code emitter for Reference UI Rust canon modules.
 * Generates unit test assertions verifying element membership, alias resolution,
 * condition matching, and rejection of hallucinated components.
 * Emitted as tests.rs inside crate::canon.
 */

function emitPrimitiveTests(): string {
  return `#[test]
fn test_real_primitives_match() {
    assert!(is_reference_primitive("Div"));
    assert!(is_reference_primitive("Span"));
    assert!(is_reference_primitive("Button"));
    assert!(is_reference_primitive("P"));
    assert!(is_reference_primitive("A"));
    assert!(is_reference_primitive("Obj"));
    assert!(is_reference_primitive("Var"));
    assert!(is_reference_primitive("Section"));
    assert!(is_reference_primitive("Nav"));
    assert!(is_reference_primitive("Header"));
    assert!(is_reference_primitive("Footer"));
    assert!(is_reference_primitive("Main"));
}

#[test]
fn test_lowercase_html_tags_match() {
    assert!(is_html_tag("div"));
    assert!(is_html_tag("span"));
    assert!(is_html_tag("object"));
    assert!(is_html_tag("var"));
    assert!(is_html_tag("button"));
    assert!(is_html_tag("p"));
    assert!(is_reference_primitive("div"));
}

#[test]
fn test_hallucinated_primitives_fail() {
    assert!(!is_reference_primitive("Box"));
    assert!(!is_reference_primitive("Flex"));
    assert!(!is_reference_primitive("Stack"));
    assert!(!is_reference_primitive("Center"));
    assert!(!is_reference_primitive("Spacer"));
    assert!(!is_reference_primitive("Badge"));
    assert!(!is_reference_primitive("Card"));
    assert!(!is_reference_primitive("Tabs"));
    assert!(!is_reference_primitive("Tab"));
    assert!(!is_reference_primitive("Image"));
    assert!(!is_reference_primitive("Portal"));
    assert!(!is_reference_primitive("AspectRatio"));
    assert!(!is_reference_primitive("Grid"));
}`;
}

function emitStylePropTests(): string {
  return `#[test]
fn test_style_props_match() {
    assert!(is_known_style_prop("r"));
    assert!(is_known_style_prop("container"));
    assert!(is_known_style_prop("colorMode"));
    assert!(is_known_style_prop("variant"));
    assert!(is_known_style_prop("font"));
    assert!(is_known_style_prop("weight"));
    assert!(is_known_style_prop("m"));
    assert!(is_known_style_prop("mt"));
    assert!(is_known_style_prop("p"));
    assert!(is_known_style_prop("pt"));
    assert!(is_known_style_prop("bg"));
    assert!(is_known_style_prop("rounded"));
    assert!(is_known_style_prop("borderX"));
    assert!(is_known_style_prop("color"));
    assert!(is_known_style_prop("display"));
    assert!(is_known_style_prop("--custom-token"));
}

#[test]
fn test_non_style_attributes_fail() {
    assert!(!is_known_style_prop("onClick"));
    assert!(!is_known_style_prop("id"));
    assert!(!is_known_style_prop("className"));
    assert!(!is_known_style_prop("children"));
    assert!(!is_known_style_prop("href"));
    assert!(!is_known_style_prop("aria-label"));
    assert!(!is_known_style_prop("data-testid"));
}`;
}

function emitConditionAndConversionTests(): string {
  return `#[test]
fn test_conditions_and_breakpoints() {
    assert!(is_condition_prop("base"));
    assert!(is_condition_prop("sm"));
    assert!(is_condition_prop("md"));
    assert!(is_condition_prop("lg"));
    assert!(is_condition_prop("xl"));
    assert!(is_condition_prop("2xl"));

    assert!(is_condition_prop("_hover"));
    assert!(is_condition_prop("_focusVisible"));
    assert!(is_condition_prop("_dark"));
    assert!(is_condition_prop("&:hover"));
    assert!(is_condition_prop("@media (min-width: 600px)"));

    assert!(!is_condition_prop("hover"));
    assert!(!is_condition_prop("focus"));
}

#[test]
fn test_resolve_canonical_prop() {
    assert_eq!(resolve_canonical_prop("mt"), "marginTop");
    assert_eq!(resolve_canonical_prop("p"), "padding");
    assert_eq!(resolve_canonical_prop("bg"), "background");
    assert_eq!(resolve_canonical_prop("c"), "color");
    assert_eq!(resolve_canonical_prop("color"), "color");
}

#[test]
fn test_class_prefix_for_prop() {
    assert_eq!(class_prefix_for_prop("marginTop"), "mt");
    assert_eq!(class_prefix_for_prop("mt"), "mt");
    assert_eq!(class_prefix_for_prop("padding"), "p");
    assert_eq!(class_prefix_for_prop("p"), "p");
    assert_eq!(class_prefix_for_prop("borderBottomWidth"), "bd-b-w");
}

#[test]
fn test_to_css_declaration_property() {
    assert_eq!(to_css_declaration_property("marginTop"), "margin-top");
    assert_eq!(to_css_declaration_property("mt"), "margin-top");
    assert_eq!(to_css_declaration_property("paddingInline"), "padding-inline");
    assert_eq!(to_css_declaration_property("px"), "padding-inline");
    assert_eq!(to_css_declaration_property("--custom-color"), "--custom-color");
}

#[test]
fn test_native_shorthands() {
    let padding_longhands = native_longhands_for_prop("padding").unwrap();
    assert_eq!(padding_longhands, &["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]);

    let margin_longhands = native_longhands_for_prop("margin").unwrap();
    assert_eq!(margin_longhands, &["marginTop", "marginRight", "marginBottom", "marginLeft"]);

    let border_longhands = native_longhands_for_prop("border").unwrap();
    assert_eq!(border_longhands, &["borderWidth", "borderStyle", "borderColor"]);

    assert!(native_longhands_for_prop("color").is_none());
}`;
}

export function emitTestsRs(): string {
  return `//! Unit tests verifying the canon dictionary and all lookup contracts.
//!
//! Asserts element membership, dialect alias resolution, condition matching,
//! and ensures hallucinated primitives (Box, Flex, Grid) are rejected.
// @generated

use super::*;

${emitPrimitiveTests()}

${emitStylePropTests()}

${emitConditionAndConversionTests()}
`;
}
