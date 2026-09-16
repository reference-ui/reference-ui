//! Unit tests for design token resolution against a `BaseSystem` dictionary.
//! Exercises category-prefixed and bare paths, opacity modifiers, aura color
//! keywords, negated scales, malformed modifiers, and custom-property lookup.
//! Every case asserts the emitted CSS value plus the diagnostics it must raise.

use base_system::{BaseSystem, TokenLeaf};

use super::resolve_token_value;

fn resolve(prop: &str, raw: &str) -> String {
    let mut diagnostics = Vec::new();
    resolve_token_value(prop, raw, BaseSystem::lib_fixture(), &mut diagnostics).into_owned()
}

fn spacing_system() -> BaseSystem {
    let mut system = BaseSystem::default();
    system.tokens.insert_leaf(TokenLeaf {
        category: "spacing",
        path: "4",
        light: "1rem",
        dark: "1rem",
    });
    system
}

#[test]
fn test_category_prefixed_colors() {
    assert_eq!(
        resolve("color", "colors.blue.600"),
        "var(--colors-blue-600)"
    );
    assert_eq!(
        resolve("bg", "colors.ui.field.border"),
        "var(--colors-ui-field-border)"
    );
    assert_eq!(resolve("color", "colors.white"), "white");
    assert_eq!(resolve("color", "colors.transparent"), "transparent");
}

#[test]
fn test_bare_color_tokens() {
    assert_eq!(resolve("bg", "blue.600"), "var(--colors-blue-600)");
    assert_eq!(
        resolve("borderColor", "gray.800"),
        "var(--colors-gray-800)"
    );
}

#[test]
fn test_color_mix_opacity() {
    assert_eq!(
        resolve("bg", "colors.blue.600/50"),
        "color-mix(in srgb, var(--colors-blue-600) 50%, transparent)"
    );
    assert_eq!(
        resolve("color", "red.500/25%"),
        "color-mix(in srgb, var(--colors-red-500) 25%, transparent)"
    );
}

#[test]
fn test_non_color_categories() {
    assert_eq!(resolve("fontFamily", "fonts.mono"), "var(--fonts-mono)");
    assert_eq!(resolve("borderRadius", "radii.md"), "var(--radii-md)");
}

#[test]
fn test_css_color_keywords_passthrough() {
    assert_eq!(resolve("color", "transparent"), "transparent");
    assert_eq!(resolve("bg", "currentColor"), "currentColor");
    assert_eq!(resolve("borderColor", "black"), "black");
    assert_eq!(resolve("color", "white"), "white");
    assert_eq!(resolve("color", "inherit"), "inherit");
}

#[test]
fn test_non_color_does_not_treat_bare_dots_as_colors() {
    let mut diagnostics = Vec::new();
    let css = resolve_token_value("mt", "blue.600", BaseSystem::lib_fixture(), &mut diagnostics);
    assert_eq!(css, "blue.600");
    assert_eq!(diagnostics.len(), 1);
}

#[test]
fn test_bare_radii_md_resolves() {
    assert_eq!(resolve("borderRadius", "md"), "var(--radii-md)");
    assert_eq!(resolve("borderRadius", "radii.md"), "var(--radii-md)");
}

#[test]
fn test_unknown_path_passthrough_warns() {
    let mut diagnostics = Vec::new();
    let css = resolve_token_value(
        "width",
        "fontSizes.xl",
        BaseSystem::lib_fixture(),
        &mut diagnostics,
    );
    assert_eq!(css, "fontSizes.xl");
    assert_eq!(diagnostics.len(), 1);
}

#[test]
fn test_negated_and_bare_scale_tokens() {
    let system = spacing_system();
    let mut diagnostics = Vec::new();
    let css = resolve_token_value("mt", "-4", &system, &mut diagnostics);
    assert_eq!(css, "calc(-1 * var(--spacing-4))");
    let css = resolve_token_value("mb", "4", &system, &mut diagnostics);
    assert_eq!(css, "var(--spacing-4)");
    assert!(diagnostics.is_empty());
}

#[test]
fn test_malformed_opacity_warns_and_passes_through() {
    for raw in ["red.500/", "/40"] {
        let mut diagnostics = Vec::new();
        let css = resolve_token_value("color", raw, BaseSystem::lib_fixture(), &mut diagnostics);
        assert_eq!(css, *raw);
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("malformed"));
    }
}

#[test]
fn test_function_slash_passes_through_silently() {
    let mut diagnostics = Vec::new();
    let css = resolve_token_value(
        "bg",
        "rgb(251 146 60 / 0.3)",
        BaseSystem::lib_fixture(),
        &mut diagnostics,
    );
    assert_eq!(css, "rgb(251 146 60 / 0.3)");
    assert!(diagnostics.is_empty());
}

#[test]
fn test_custom_property_resolves_unique_token() {
    let mut diagnostics = Vec::new();
    let css = resolve_token_value(
        "--brand-x",
        "red.500",
        BaseSystem::lib_fixture(),
        &mut diagnostics,
    );
    assert_eq!(css, "var(--colors-red-500)");
    assert!(diagnostics.is_empty());
}

#[test]
fn test_size_properties_fall_back_to_spacing() {
    let system = spacing_system();
    let mut diagnostics = Vec::new();
    let css = resolve_token_value("width", "4", &system, &mut diagnostics);
    assert_eq!(css, "var(--spacing-4)");
    assert!(diagnostics.is_empty());
}

#[test]
fn test_wrong_category_warns() {
    let system = spacing_system();
    let mut diagnostics = Vec::new();
    let css = resolve_token_value("color", "4", &system, &mut diagnostics);
    assert_eq!(css, "4");
    assert_eq!(diagnostics.len(), 1);
    assert!(diagnostics[0].message.contains("spacing"));
}
