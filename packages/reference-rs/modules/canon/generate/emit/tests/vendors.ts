/**
 * Test code emitters for unitless properties and vendor-prefixed canon rows.
 * Ports the hand-written unitless gate into the generator and pins GAP-04a:
 * capital-first Webkit/Moz/Ms spellings resolve, hyphenate with a leading
 * dash, and inherit unitless/color semantics from their canonical rows.
 * Consumed by emit/tests/index.ts to assemble the complete tests.rs module.
 */

export function emitUnitlessTest(): string {
  return `#[test]
fn test_unitless_properties_sorted_and_detected() {
    assert!(UNITLESS_PROPERTIES.windows(2).all(|w| w[0] < w[1]));
    assert!(is_unitless_prop("zIndex"));
    assert!(is_unitless_prop("opacity"));
    assert!(is_unitless_prop("fontWeight"));
    assert!(is_unitless_prop("lineHeight"));
    assert!(is_unitless_prop("--custom-prop"));
    assert!(!is_unitless_prop("width"));
    assert!(!is_unitless_prop("padding"));
    assert!(!is_unitless_prop("p"));
    assert!(!is_unitless_prop("margin"));
}`;
}

export function emitCanVendor01(): string {
  return `#[test]
fn can_vendor_01_capital_spellings_resolve() {
    assert!(is_known_style_prop("WebkitBackgroundClip"));
    assert!(is_known_style_prop("WebkitTextFillColor"));
    assert!(is_known_style_prop("MozAppearance"));
    assert!(is_known_style_prop("MozOsxFontSmoothing"));
    assert!(is_known_style_prop("msTransition"));
    assert!(is_known_style_prop("MsTransition"));
    assert_eq!(resolve_canonical_prop("WebkitBackgroundClip"), "webkitBackgroundClip");
    assert_eq!(resolve_canonical_prop("MozAppearance"), "mozAppearance");
    assert_eq!(resolve_canonical_prop("MsTransition"), "msTransition");
    assert_eq!(resolve_canonical_prop("msTransition"), "msTransition");
}`;
}

export function emitCanVendor02(): string {
  return `#[test]
fn can_vendor_02_leading_dash_css_and_class() {
    assert_eq!(
        to_css_declaration_property("WebkitBackgroundClip"),
        "-webkit-background-clip"
    );
    assert_eq!(
        to_css_declaration_property("MozAppearance"),
        "-moz-appearance"
    );
    assert_eq!(to_css_declaration_property("msTransition"), "-ms-transition");
    assert_eq!(
        to_css_declaration_property("msScrollbar3dlightColor"),
        "-ms-scrollbar-3dlight-color"
    );
    assert_eq!(
        class_prefix_for_prop("WebkitBackgroundClip"),
        "-webkit-background-clip"
    );
    assert_eq!(class_prefix_for_prop("MozAppearance"), "-moz-appearance");
    assert_eq!(class_prefix_for_prop("msTransition"), "-ms-transition");
}`;
}

export function emitCanVendor03(): string {
  return `#[test]
fn can_vendor_03_unitless_and_color_semantics() {
    assert!(is_unitless_prop("webkitLineClamp"));
    assert!(is_unitless_prop("WebkitLineClamp"));
    assert!(is_unitless_prop("MozColumnCount"));
    assert!(is_unitless_prop("msFlexPositive"));
    assert!(!is_unitless_prop("MozAppearance"));
    assert!(!is_unitless_prop("msTransition"));
    assert!(is_color_prop("webkitTextFillColor"));
    assert!(is_color_prop("WebkitTextFillColor"));
    assert!(is_color_prop("MozTextDecorationColor"));
    assert!(is_color_prop("msScrollbarFaceColor"));
    assert!(!is_color_prop("WebkitPrintColorAdjust"));
    assert!(!is_color_prop("MozAppearance"));
}`;
}

export function emitVendorTests(): string {
  return [
    emitUnitlessTest(),
    emitCanVendor01(),
    emitCanVendor02(),
    emitCanVendor03(),
  ].join('\n\n');
}
