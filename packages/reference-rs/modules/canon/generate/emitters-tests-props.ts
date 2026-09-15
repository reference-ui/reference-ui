/**
 * Test code emitters for CSS properties, StyleProps aliases, colors, and shorthands.
 * Generates unit test assertions for property recognition, alias resolution, and zero-allocation conversion.
 * Verifies that native CSS shorthands decompose to exact living longhands and color properties follow aliases.
 * Consumed by emitters-tests.ts to assemble the complete tests.rs module.
 */

export function emitKnownStylePropTests(): string {
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

    // Full platform webref properties
    assert!(is_known_style_prop("aspectRatio"));
    assert!(is_known_style_prop("objectFit"));
    assert!(is_known_style_prop("pointerEvents"));
    assert!(is_known_style_prop("order"));
    assert!(is_known_style_prop("placeItems"));
    assert!(is_known_style_prop("fontStyle"));
    assert!(is_known_style_prop("textOverflow"));
    assert!(is_known_style_prop("mixBlendMode"));
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

export function emitReferenceExtensionTests(): string {
  return `#[test]
fn test_reference_only_props() {
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
}

#[test]
fn test_extension_isolation_in_find_property() {
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

export function emitColorPropTests(): string {
  return `#[test]
fn test_is_color_prop() {
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
    assert!(is_color_prop("divideColor"));
    assert!(is_color_prop("focusRingColor"));

    assert!(is_color_prop("c"));
    assert!(is_color_prop("bg"));
    assert!(is_color_prop("bgColor"));
    assert!(is_color_prop("borderC"));
    assert!(is_color_prop("borderXC"));
    assert!(is_color_prop("ringColor"));
    assert!(is_color_prop("shadowColor"));

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

export function emitAliasResolutionTests(): string {
  return `#[test]
fn test_resolve_canonical_prop() {
    assert_eq!(resolve_canonical_prop("mt"), "marginTop");
    assert_eq!(resolve_canonical_prop("p"), "padding");
    assert_eq!(resolve_canonical_prop("bg"), "background");
    assert_eq!(resolve_canonical_prop("c"), "color");
    assert_eq!(resolve_canonical_prop("color"), "color");
}

#[test]
fn test_directional_logical_alias_resolution() {
    assert_eq!(resolve_canonical_prop("px"), "paddingInline");
    assert_eq!(resolve_canonical_prop("py"), "paddingBlock");
    assert_eq!(resolve_canonical_prop("mx"), "marginInline");
    assert_eq!(resolve_canonical_prop("my"), "marginBlock");
    assert_eq!(resolve_canonical_prop("start"), "insetInlineStart");
    assert_eq!(resolve_canonical_prop("end"), "insetInlineEnd");
}

#[test]
fn test_corner_radius_and_border_alias_resolution() {
    assert_eq!(resolve_canonical_prop("rounded"), "borderRadius");
    assert_eq!(resolve_canonical_prop("roundedTop"), "borderTopRadius");
    assert_eq!(resolve_canonical_prop("borderX"), "borderInline");
    assert_eq!(resolve_canonical_prop("borderY"), "borderBlock");
}

#[test]
fn test_idempotent_resolution_for_canonical_props() {
    assert_eq!(resolve_canonical_prop("color"), "color");
    assert_eq!(resolve_canonical_prop("marginTop"), "marginTop");
    assert_eq!(resolve_canonical_prop("padding"), "padding");
}`;
}

export function emitPropertyConversionTests(): string {
  return `#[test]
fn test_class_prefix_for_prop() {
    assert_eq!(class_prefix_for_prop("marginTop"), "mt");
    assert_eq!(class_prefix_for_prop("mt"), "mt");
    assert_eq!(class_prefix_for_prop("padding"), "p");
    assert_eq!(class_prefix_for_prop("p"), "p");
    assert_eq!(class_prefix_for_prop("borderBottomWidth"), "bd-b-w");

    // Fallback to kebab-case CSS declaration property name for full platform tail
    assert_eq!(class_prefix_for_prop("aspectRatio"), "aspect-ratio");
    assert_eq!(class_prefix_for_prop("objectFit"), "object-fit");
}

#[test]
fn test_unique_class_prefixes() {
    let mut prefixes = std::collections::HashSet::new();
    for prop in CANONICAL_PROPERTIES {
        assert!(
            prefixes.insert(prop.class_prefix),
            "Duplicate class_prefix '{}' on prop '{}'",
            prop.class_prefix,
            prop.name
        );
    }
    assert_ne!(class_prefix_for_prop("display"), class_prefix_for_prop("d"));
    assert_eq!(class_prefix_for_prop("display"), "d");
    assert_eq!(class_prefix_for_prop("d"), "svg-d");
    assert_ne!(class_prefix_for_prop("zIndex"), class_prefix_for_prop("translateZ"));
    assert_eq!(class_prefix_for_prop("zIndex"), "z");
    assert_eq!(class_prefix_for_prop("translateZ"), "translate-z");
    assert_eq!(class_prefix_for_prop("z"), "translate-z");
    assert_ne!(class_prefix_for_prop("boxSize"), class_prefix_for_prop("size"));
    assert_eq!(class_prefix_for_prop("boxSize"), "box-size");
    assert_eq!(class_prefix_for_prop("size"), "size");
    assert_eq!(find_property("x").unwrap().class_prefix, "svg-x");
    assert_eq!(find_property("translateX").unwrap().class_prefix, "x");
    assert_eq!(find_property("y").unwrap().class_prefix, "svg-y");
    assert_eq!(find_property("translateY").unwrap().class_prefix, "y");
}

#[test]
fn test_to_css_declaration_property() {
    assert_eq!(to_css_declaration_property("marginTop"), "margin-top");
    assert_eq!(to_css_declaration_property("mt"), "margin-top");
    assert_eq!(to_css_declaration_property("paddingInline"), "padding-inline");
    assert_eq!(to_css_declaration_property("px"), "padding-inline");
    assert_eq!(to_css_declaration_property("--custom-color"), "--custom-color");
    assert_eq!(to_css_declaration_property("aspectRatio"), "aspect-ratio");
}`;
}

export function emitShorthandDecompositionTests(): string {
  return `#[test]
fn test_native_shorthands() {
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

    // Full webref shorthands
    let bg_longhands = native_longhands_for_prop("background").expect("background has longhands");
    assert!(bg_longhands.contains(&"backgroundColor"));
    assert!(bg_longhands.contains(&"backgroundImage"));
}

#[test]
fn test_non_shorthands_return_none() {
    assert!(native_longhands_for_prop("color").is_none());
    assert!(native_longhands_for_prop("display").is_none());
    assert!(native_longhands_for_prop("fontSize").is_none());
    assert!(native_longhands_for_prop("opacity").is_none());
    assert!(native_longhands_for_prop("aspectRatio").is_none());
    assert!(native_longhands_for_prop("order").is_none());
}

#[test]
fn test_dialect_alias_for_shorthand_tripwire() {
    let canonical = resolve_canonical_prop("borderX");
    assert_eq!(canonical, "borderInline");
    let longhands = native_longhands_for_prop(canonical);
    assert_eq!(
        longhands,
        Some(&["borderInlineStart", "borderInlineEnd"][..])
    );
    assert_eq!(
        native_longhands_for_prop("borderX"),
        Some(&["borderInlineStart", "borderInlineEnd"][..])
    );
}`;
}
