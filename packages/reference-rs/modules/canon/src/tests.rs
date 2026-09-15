//! Unit tests verifying the canon dictionary and all lookup contracts.
//!
//! Asserts element membership, dialect alias resolution, condition matching,
//! and ensures hallucinated primitives (Box, Flex, Grid) are rejected.
// @generated

use super::*;

#[test]
fn can_tag_01_pascal_jsx_primitives() {
    let tags = [
        "Div",
        "Span",
        "Button",
        "P",
        "A",
        "B",
        "I",
        "Q",
        "S",
        "U",
        "G",
        "Obj",
        "Var",
        "Section",
        "Nav",
        "Header",
        "Footer",
        "Main",
        "Path",
        "Circle",
        "Rect",
        "Line",
        "Polyline",
        "Polygon",
        "ClipPath",
        "LinearGradient",
    ];
    for tag in tags {
        assert!(is_reference_primitive(tag));
        assert!(is_primitive_jsx_name(tag));
    }
}

#[test]
fn can_tag_02_lowercase_html_svg_tags() {
    let tags = [
        "div", "span", "object", "var", "button", "p", "a", "b", "i", "q", "s", "u", "g", "path",
        "circle",
    ];
    for tag in tags {
        assert!(is_html_tag(tag));
    }
    assert!(is_reference_primitive("div"));
    assert!(is_reference_primitive("path"));
}

#[test]
fn can_tag_03_reserved_tag_renames() {
    assert!(is_primitive_jsx_name("Obj"));
    assert!(is_reference_primitive("Obj"));
    assert!(is_primitive_jsx_name("Var"));
    assert!(is_reference_primitive("Var"));

    assert!(is_html_tag("object"));
    assert!(is_html_tag("var"));
}

#[test]
fn can_tag_04_single_letter_tags() {
    let single_letter_tags = ["A", "P", "B", "I", "Q", "S", "U", "G"];
    for tag in single_letter_tags {
        assert!(is_reference_primitive(tag));
        assert!(is_primitive_jsx_name(tag));
    }
}

#[test]
fn can_tag_05_react_svg_camel_case() {
    assert!(is_html_tag("clipPath"));
    assert!(is_html_tag("linearGradient"));
    assert!(is_html_tag("radialGradient"));
    assert!(is_html_tag("foreignObject"));

    assert!(is_primitive_jsx_name("ClipPath"));
    assert!(is_primitive_jsx_name("LinearGradient"));
    assert!(is_primitive_jsx_name("RadialGradient"));
    assert!(is_primitive_jsx_name("ForeignObject"));

    assert!(is_reference_primitive("clipPath"));
    assert!(is_reference_primitive("linearGradient"));
    assert!(is_reference_primitive("ClipPath"));
    assert!(is_reference_primitive("LinearGradient"));
}

#[test]
fn can_fail_01_hallucinated_primitives() {
    assert!(!is_reference_primitive("Box"));
    assert!(!is_reference_primitive("Flex"));
    assert!(!is_reference_primitive("Stack"));
    assert!(!is_reference_primitive("Center"));
    assert!(!is_reference_primitive("Spacer"));
    assert!(!is_reference_primitive("Badge"));
    assert!(!is_reference_primitive("Card"));
    assert!(!is_reference_primitive("Tabs"));
    assert!(!is_reference_primitive("Tab"));
    assert!(!is_reference_primitive("Portal"));
    assert!(!is_reference_primitive("AspectRatio"));
    assert!(!is_reference_primitive("Grid"));
}

#[test]
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
}

#[test]
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
}

#[test]
fn can_prop_03_css_declaration_property() {
    assert_eq!(to_css_declaration_property("marginTop"), "margin-top");
    assert_eq!(to_css_declaration_property("mt"), "margin-top");
    assert_eq!(
        to_css_declaration_property("paddingInline"),
        "padding-inline"
    );
    assert_eq!(to_css_declaration_property("px"), "padding-inline");
    assert_eq!(
        to_css_declaration_property("--custom-color"),
        "--custom-color"
    );
    assert_eq!(to_css_declaration_property("aspectRatio"), "aspect-ratio");
}

#[test]
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
}

#[test]
fn can_prop_05_custom_property_passthrough() {
    assert!(is_known_style_prop("--custom-token"));
    assert!(is_known_style_prop("--spacing-root"));
    assert!(is_known_style_prop("--colors-n-300"));
    assert_eq!(
        to_css_declaration_property("--custom-token"),
        "--custom-token"
    );
    assert_eq!(
        to_css_declaration_property("--spacing-root"),
        "--spacing-root"
    );
}

#[test]
fn can_prop_06_non_shorthands_none() {
    assert_eq!(native_longhands_for_prop("color"), None);
    assert_eq!(native_longhands_for_prop("display"), None);
    assert_eq!(native_longhands_for_prop("fontSize"), None);
    assert_eq!(native_longhands_for_prop("opacity"), None);
    assert_eq!(native_longhands_for_prop("aspectRatio"), None);
    assert_eq!(native_longhands_for_prop("order"), None);
}

#[test]
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
}

#[test]
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
}

#[test]
fn can_fail_02_non_style_attributes() {
    assert!(!is_known_style_prop("onClick"));
    assert!(!is_known_style_prop("id"));
    assert!(!is_known_style_prop("className"));
    assert!(!is_known_style_prop("children"));
    assert!(!is_known_style_prop("href"));
    assert!(!is_known_style_prop("aria-label"));
    assert!(!is_known_style_prop("data-testid"));
    assert!(!is_known_style_prop("foobar"));
}

#[test]
fn can_alias_01_known_shorthand_aliases() {
    assert!(is_known_style_prop("mt"));
    assert!(is_known_style_prop("pt"));
    assert!(is_known_style_prop("p"));
    assert!(is_known_style_prop("m"));
    assert!(is_known_style_prop("bg"));
    assert!(is_known_style_prop("w"));
    assert!(is_known_style_prop("h"));
    assert!(is_known_style_prop("flexDir"));
}

#[test]
fn can_alias_02_resolve_canonical_prop() {
    assert_eq!(resolve_canonical_prop("mt"), "marginTop");
    assert_eq!(resolve_canonical_prop("p"), "padding");
    assert_eq!(resolve_canonical_prop("bg"), "background");
    assert_eq!(resolve_canonical_prop("flexDir"), "flexDirection");
    assert_eq!(resolve_canonical_prop("color"), "color");
}

#[test]
fn can_alias_03_directional_logical_alias_resolution() {
    assert_eq!(resolve_canonical_prop("px"), "paddingInline");
    assert_eq!(resolve_canonical_prop("py"), "paddingBlock");
    assert_eq!(resolve_canonical_prop("mx"), "marginInline");
    assert_eq!(resolve_canonical_prop("my"), "marginBlock");
}

#[test]
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
}

#[test]
fn can_alias_05_idempotent_resolution_for_canonical_props() {
    assert_eq!(resolve_canonical_prop("color"), "color");
    assert_eq!(resolve_canonical_prop("marginTop"), "marginTop");
    assert_eq!(resolve_canonical_prop("padding"), "padding");
}

#[test]
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
}

#[test]
fn can_ext_01_macros_are_known_style_props() {
    assert!(is_known_style_prop("r"));
    assert!(is_known_style_prop("container"));
    assert!(is_known_style_prop("colorMode"));
    assert!(is_known_style_prop("variant"));
    assert!(is_known_style_prop("font"));
    assert!(is_known_style_prop("weight"));
}

#[test]
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
}

#[test]
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
}

#[test]
fn can_cond_01_grammar_discriminators() {
    assert!(is_condition_prop("_hover"));
    assert!(is_condition_prop("_dark"));
    assert!(is_condition_prop("&:hover"));
    assert!(is_condition_prop("@media (min-width: 600px)"));
    assert!(!is_condition_prop("sm"));
    assert!(!is_condition_prop("md"));
    assert!(!is_condition_prop("base"));
    assert!(!is_condition_prop("hover"));
}

#[test]
fn can_cond_02_underscore_pseudos() {
    assert!(is_condition_prop("_hover"));
    assert!(is_condition_prop("_focusVisible"));
    assert!(is_condition_prop("_dark"));
    assert!(is_condition_prop("_active"));
    assert!(is_condition_prop("_disabled"));
    assert!(is_condition_prop("_notInTheTable"));
}

#[test]
fn can_cond_03_ampersand_and_at_prefixes() {
    assert!(is_condition_prop("&:hover"));
    assert!(is_condition_prop("& > svg"));
    assert!(is_condition_prop("@media (min-width: 600px)"));
}

#[test]
fn can_cond_04_no_default_viewport_scale() {
    assert!(!is_condition_prop("base"));
    assert!(!is_condition_prop("sm"));
    assert!(!is_condition_prop("md"));
    assert!(!is_condition_prop("lg"));
    assert!(!is_condition_prop("xl"));
    assert!(!is_condition_prop("2xl"));
    assert!(NAMED_CONDITIONS.contains(&"_hover"));
    assert!(NAMED_CONDITIONS.contains(&"_dark"));
}

#[test]
fn can_fail_03_bare_pseudos() {
    assert!(!is_condition_prop("hover"));
    assert!(!is_condition_prop("focus"));
    assert!(!is_condition_prop("active"));
    assert!(!is_condition_prop("sm"));
    assert!(!is_condition_prop("base"));
}

#[test]
fn can_join_04_slices_are_sorted() {
    assert!(ELEMENTS.windows(2).all(|w| w[0].html < w[1].html));
    assert!(PRIMITIVE_JSX.windows(2).all(|w| w[0] < w[1]));
    assert!(CANONICAL_PROPERTIES
        .windows(2)
        .all(|w| w[0].name < w[1].name));
    assert!(ALIASES.windows(2).all(|w| w[0].alias < w[1].alias));
    assert!(REFERENCE_PROPS.windows(2).all(|w| w[0] < w[1]));
    assert!(CONDITIONS.windows(2).all(|w| w[0] < w[1]));
    assert!(COLOR_PROPERTIES.windows(2).all(|w| w[0] < w[1]));

    for el in ELEMENTS {
        assert!(
            is_primitive_jsx_name(el.jsx),
            "JSX primitive name '{}' must be found by is_primitive_jsx_name",
            el.jsx
        );
    }
}

#[test]
fn can_join_08_unique_class_prefixes() {
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
    assert_ne!(
        class_prefix_for_prop("zIndex"),
        class_prefix_for_prop("translateZ")
    );
    assert_eq!(class_prefix_for_prop("zIndex"), "z");
    assert_eq!(class_prefix_for_prop("translateZ"), "translate-z");
    assert_ne!(
        class_prefix_for_prop("boxSize"),
        class_prefix_for_prop("size")
    );
    assert_eq!(class_prefix_for_prop("boxSize"), "box-size");
    assert_eq!(class_prefix_for_prop("size"), "size");
    assert_eq!(find_property("x").unwrap().class_prefix, "svg-x");
    assert_eq!(find_property("translateX").unwrap().class_prefix, "x");
    assert_eq!(find_property("y").unwrap().class_prefix, "svg-y");
    assert_eq!(find_property("translateY").unwrap().class_prefix, "y");
}
