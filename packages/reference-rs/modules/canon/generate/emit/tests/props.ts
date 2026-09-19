/**
 * Test code emitters for CSS properties, StyleProps aliases, colors, and shorthands.
 * Generates unit test assertions for property recognition, alias resolution, and zero-allocation conversion.
 * Verifies that native CSS shorthands decompose to exact living longhands and color properties follow aliases.
 * Consumed by emit/tests/index.ts to assemble the complete tests.rs module.
 */

export function emitCanProp01(): string {
  return `#[test]
fn can_prop_01_known_style_props() {
    assert!(is_known_style_prop("aspectRatio"));
    assert!(is_known_style_prop("objectFit"));
    assert!(is_known_style_prop("pointerEvents"));
    assert!(is_known_style_prop("order"));
    assert!(is_known_style_prop("placeItems"));
    assert!(is_known_style_prop("fontStyle"));
    assert!(is_known_style_prop("textOverflow"));
    assert!(is_known_style_prop("mixBlendMode"));
    assert!(is_known_style_prop("color"));
    assert!(is_known_style_prop("display"));
    assert!(is_known_style_prop("fontSize"));
    assert!(is_known_style_prop("opacity"));
    assert!(is_known_style_prop("zIndex"));
}`;
}

export function emitCanProp02(): string {
  return `#[test]
fn can_prop_02_class_prefix_for_prop() {
    assert_eq!(class_prefix_for_prop("marginTop"), "mt");
    assert_eq!(class_prefix_for_prop("mt"), "mt");
    assert_eq!(class_prefix_for_prop("padding"), "p");
    assert_eq!(class_prefix_for_prop("p"), "p");
    assert_eq!(class_prefix_for_prop("borderBottomWidth"), "bd-b-w");
    assert_eq!(class_prefix_for_prop("outline"), "outline");

    // Fallback to kebab-case CSS declaration property name for full platform tail
    assert_eq!(class_prefix_for_prop("aspectRatio"), "aspect-ratio");
    assert_eq!(class_prefix_for_prop("objectFit"), "object-fit");
}`;
}

export function emitCanProp03(): string {
  return `#[test]
fn can_prop_03_css_declaration_property() {
    assert_eq!(to_css_declaration_property("marginTop"), "margin-top");
    assert_eq!(to_css_declaration_property("mt"), "margin-top");
    assert_eq!(to_css_declaration_property("paddingInline"), "padding-inline");
    assert_eq!(to_css_declaration_property("px"), "padding-inline");
    assert_eq!(to_css_declaration_property("--custom-color"), "--custom-color");
    assert_eq!(to_css_declaration_property("aspectRatio"), "aspect-ratio");
}`;
}

export function emitCanProp04(): string {
  return `#[test]
fn can_prop_04_native_shorthand_longhands() {
    assert_eq!(
        native_longhands_for_prop("padding"),
        Some(&["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"][..])
    );
    assert_eq!(
        native_longhands_for_prop("margin"),
        Some(&["marginTop", "marginRight", "marginBottom", "marginLeft"][..])
    );
    assert_eq!(
        native_longhands_for_prop("border"),
        Some(&["borderWidth", "borderStyle", "borderColor"][..])
    );
    let bg_longhands = native_longhands_for_prop("background").expect("background has longhands");
    assert!(bg_longhands.contains(&"backgroundColor"));
    assert!(bg_longhands.contains(&"backgroundImage"));
}`;
}

export function emitCanProp05(): string {
  return `#[test]
fn can_prop_05_custom_property_passthrough() {
    assert!(is_known_style_prop("--custom-token"));
    assert!(is_known_style_prop("--spacing-root"));
    assert!(is_known_style_prop("--colors-n-300"));
    assert_eq!(to_css_declaration_property("--custom-token"), "--custom-token");
    assert_eq!(to_css_declaration_property("--spacing-root"), "--spacing-root");
}`;
}

export function emitCanProp06(): string {
  return `#[test]
fn can_prop_06_non_shorthands_none() {
    assert_eq!(native_longhands_for_prop("color"), None);
    assert_eq!(native_longhands_for_prop("display"), None);
    assert_eq!(native_longhands_for_prop("fontSize"), None);
    assert_eq!(native_longhands_for_prop("opacity"), None);
    assert_eq!(native_longhands_for_prop("aspectRatio"), None);
    assert_eq!(native_longhands_for_prop("order"), None);
}`;
}

export function emitCanProp07(): string {
  return `#[test]
fn can_prop_07_color_prop_resolution() {
    assert!(is_color_prop("color"));
    assert!(is_color_prop("backgroundColor"));
    assert!(is_color_prop("borderColor"));
    assert!(is_color_prop("borderTopColor"));
    assert!(is_color_prop("borderInlineColor"));
    assert!(is_color_prop("outlineColor"));
    assert!(is_color_prop("fill"));
    assert!(is_color_prop("stroke"));
    assert!(is_color_prop("accentColor"));
    assert!(is_color_prop("caretColor"));

    assert!(is_color_prop("background"));
    assert!(is_color_prop("border"));
    assert!(is_color_prop("textShadowColor"));

    assert!(is_color_prop("bg"));

    assert!(!is_color_prop("aspectRatio"));
    assert!(!is_color_prop("display"));
    assert!(!is_color_prop("fontSize"));
    assert!(!is_color_prop("opacity"));
    assert!(!is_color_prop("marginTop"));
    assert!(!is_color_prop("mt"));
    assert!(!is_color_prop("padding"));
    assert!(!is_color_prop("p"));
    assert!(!is_color_prop("onClick"));
    assert!(!is_color_prop("id"));
}`;
}

export function emitCanFail02(): string {
  return `#[test]
fn can_fail_02_non_style_attributes() {
    assert!(!is_known_style_prop("onClick"));
    assert!(!is_known_style_prop("id"));
    assert!(!is_known_style_prop("className"));
    assert!(!is_known_style_prop("children"));
    assert!(!is_known_style_prop("href"));
    assert!(!is_known_style_prop("aria-label"));
    assert!(!is_known_style_prop("data-testid"));
    assert!(!is_known_style_prop("foobar"));
}`;
}

export function emitCanAlias01(): string {
  return `#[test]
fn can_alias_01_known_shorthand_aliases() {
    assert!(is_known_style_prop("mt"));
    assert!(is_known_style_prop("pt"));
    assert!(is_known_style_prop("p"));
    assert!(is_known_style_prop("m"));
    assert!(is_known_style_prop("bg"));
    assert!(is_known_style_prop("w"));
    assert!(is_known_style_prop("h"));
    assert!(is_known_style_prop("flexDir"));
}`;
}

export function emitCanAlias02(): string {
  return `#[test]
fn can_alias_02_resolve_canonical_prop() {
    assert_eq!(resolve_canonical_prop("mt"), "marginTop");
    assert_eq!(resolve_canonical_prop("p"), "padding");
    assert_eq!(resolve_canonical_prop("bg"), "background");
    assert_eq!(resolve_canonical_prop("flexDir"), "flexDirection");
    assert_eq!(resolve_canonical_prop("color"), "color");
}`;
}

export function emitCanAlias03(): string {
  return `#[test]
fn can_alias_03_directional_logical_alias_resolution() {
    assert_eq!(resolve_canonical_prop("px"), "paddingInline");
    assert_eq!(resolve_canonical_prop("py"), "paddingBlock");
    assert_eq!(resolve_canonical_prop("mx"), "marginInline");
    assert_eq!(resolve_canonical_prop("my"), "marginBlock");
}`;
}

export function emitCanAlias04(): string {
  return `#[test]
fn can_alias_04_ambiguous_aliases_refused() {
    assert!(!is_known_style_prop("c"));
    assert!(!is_known_style_prop("rounded"));
    assert!(!is_known_style_prop("roundedTop"));
    assert!(!is_known_style_prop("pos"));
    assert!(!is_known_style_prop("shadow"));
    assert!(!is_known_style_prop("ps"));
    assert!(!is_known_style_prop("pe"));
    assert!(!is_known_style_prop("ms"));
    assert!(!is_known_style_prop("me"));
}`;
}

export function emitCanAlias05(): string {
  return `#[test]
fn can_alias_05_idempotent_resolution_for_canonical_props() {
    assert_eq!(resolve_canonical_prop("color"), "color");
    assert_eq!(resolve_canonical_prop("marginTop"), "marginTop");
    assert_eq!(resolve_canonical_prop("padding"), "padding");
}`;
}

export function emitCanAlias06(): string {
  return `#[test]
fn can_alias_06_alias_to_shorthand_longhands() {
    let canonical = resolve_canonical_prop("px");
    assert_eq!(canonical, "paddingInline");
    let longhands = native_longhands_for_prop(canonical);
    assert_eq!(
        longhands,
        Some(&["paddingInlineStart", "paddingInlineEnd"][..])
    );
    assert_eq!(
        native_longhands_for_prop("px"),
        Some(&["paddingInlineStart", "paddingInlineEnd"][..])
    );
}`;
}

export function emitCanExt01(): string {
  return `#[test]
fn can_ext_01_macros_are_known_style_props() {
    assert!(is_known_style_prop("r"));
    assert!(is_known_style_prop("container"));
    assert!(is_known_style_prop("colorMode"));
    assert!(is_known_style_prop("variant"));
    assert!(is_known_style_prop("font"));
    assert!(is_known_style_prop("weight"));
}`;
}

export function emitCanExt02(): string {
  return `#[test]
fn can_ext_02_reference_only_props() {
    assert!(is_reference_prop("colorMode"));
    assert!(is_reference_prop("r"));
    assert!(is_reference_prop("size"));
    assert!(is_reference_prop("variant"));
    assert!(is_reference_prop("weight"));

    // container and font are platform CSS properties, not Reference-only macros
    assert!(!is_reference_prop("container"));
    assert!(!is_reference_prop("font"));
    assert!(!is_reference_prop("color"));
    assert!(!is_reference_prop("mt"));
    assert!(!is_reference_prop("onClick"));
}`;
}

export function emitCanExt03(): string {
  return `#[test]
fn can_ext_03_extension_isolation_in_find_property() {
    assert!(find_property("colorMode").is_none());
    assert!(find_property("variant").is_none());
    assert!(find_property("weight").is_none());

    // Colliding macro and CSS properties exist in CANONICAL_PROPERTIES
    assert!(find_property("r").is_some());
    assert!(find_property("size").is_some());
    assert!(find_property("container").is_some());
    assert!(find_property("font").is_some());
    assert!(find_property("aspectRatio").is_some());
}`;
}

export function emitCascadeRankTest(): string {
  return `#[test]
fn property_cascade_rank_follows_longhand_nesting() {
    assert_eq!(property_cascade_rank("border"), 0);
    assert_eq!(property_cascade_rank("borderColor"), 1);
    assert_eq!(property_cascade_rank("padding"), 1);
    assert_eq!(property_cascade_rank("p"), 1);
    assert_eq!(property_cascade_rank("paddingInline"), 1);
    assert_eq!(property_cascade_rank("paddingInlineStart"), 2);
    assert_eq!(property_cascade_rank("paddingTop"), 3);
    assert_eq!(property_cascade_rank("borderBottomColor"), 3);
    assert_eq!(property_cascade_rank("color"), 3);
}`;
}

export function emitPropTests(): string {
  return [
    emitCanProp01(),
    emitCanProp02(),
    emitCanProp03(),
    emitCanProp04(),
    emitCanProp05(),
    emitCanProp06(),
    emitCascadeRankTest(),
    emitCanProp07(),
    emitCanFail02(),
    emitCanAlias01(),
    emitCanAlias02(),
    emitCanAlias03(),
    emitCanAlias04(),
    emitCanAlias05(),
    emitCanAlias06(),
    emitCanExt01(),
    emitCanExt02(),
    emitCanExt03(),
  ].join('\n\n');
}
