//! Unit tests for design token resolution against a `BaseSystem` dictionary.
//! Exercises category-prefixed and bare paths, opacity modifiers, aura color
//! keywords, negated scales, malformed modifiers, and custom-property lookup.
//! Every case asserts the emitted CSS value plus the diagnostics it must raise.

use base_system::{BaseSystem, TokenLeaf};

use super::resolve_token_value;
use crate::diagnostics::{Diagnostic, DiagnosticLocation, DiagnosticSeverity};
use crate::resolve::ResolveSession;

fn resolve_with_diagnostics(
    prop: &str,
    raw: &str,
    system: &BaseSystem,
) -> (Option<String>, Vec<Diagnostic>) {
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
    };
    let css = resolve_token_value(prop, raw, &mut session).map(|resolved| resolved.into_owned());
    drop(session);
    (css, diagnostics)
}

fn resolve(prop: &str, raw: &str) -> String {
    resolve_with_diagnostics(prop, raw, BaseSystem::lib_fixture())
        .0
        .expect("token value resolves")
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
    assert_eq!(resolve("borderColor", "gray.800"), "var(--colors-gray-800)");
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
    let (css, diagnostics) = resolve_with_diagnostics("mt", "blue.600", BaseSystem::lib_fixture());
    assert_eq!(css.as_deref(), Some("blue.600"));
    assert_eq!(diagnostics.len(), 1);
}

#[test]
fn test_bare_radii_md_resolves() {
    assert_eq!(resolve("borderRadius", "md"), "var(--radii-md)");
    assert_eq!(resolve("borderRadius", "radii.md"), "var(--radii-md)");
}

#[test]
fn test_unknown_path_passthrough_warns() {
    let (css, diagnostics) =
        resolve_with_diagnostics("width", "fontSizes.xl", BaseSystem::lib_fixture());
    assert_eq!(css.as_deref(), Some("fontSizes.xl"));
    assert_eq!(diagnostics.len(), 1);
}

#[test]
fn test_negated_and_bare_scale_tokens() {
    let system = spacing_system();
    let (css, diagnostics) = resolve_with_diagnostics("mt", "-4", &system);
    assert_eq!(css.as_deref(), Some("calc(-1 * var(--spacing-4))"));
    assert!(diagnostics.is_empty());
    let (css, diagnostics) = resolve_with_diagnostics("mb", "4", &system);
    assert_eq!(css.as_deref(), Some("var(--spacing-4)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn test_malformed_opacity_warns_and_passes_through() {
    for raw in ["red.500/", "/40"] {
        let (css, diagnostics) = resolve_with_diagnostics("color", raw, BaseSystem::lib_fixture());
        assert_eq!(css.as_deref(), Some(raw));
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("malformed"));
    }
}

#[test]
fn test_function_slash_passes_through_silently() {
    let (css, diagnostics) =
        resolve_with_diagnostics("bg", "rgb(251 146 60 / 0.3)", BaseSystem::lib_fixture());
    assert_eq!(css.as_deref(), Some("rgb(251 146 60 / 0.3)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn test_custom_property_resolves_unique_token() {
    let (css, diagnostics) =
        resolve_with_diagnostics("--brand-x", "red.500", BaseSystem::lib_fixture());
    assert_eq!(css.as_deref(), Some("var(--colors-red-500)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn test_size_properties_fall_back_to_spacing() {
    let system = spacing_system();
    let (css, diagnostics) = resolve_with_diagnostics("width", "4", &system);
    assert_eq!(css.as_deref(), Some("var(--spacing-4)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn test_unknown_color_warns_on_color_props() {
    use crate::diagnostics::DiagnosticCode;
    let system = spacing_system();
    let (css, diagnostics) = resolve_with_diagnostics("color", "4", &system);
    assert_eq!(css.as_deref(), Some("4"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownColor);
    assert!(diagnostics[0].message.contains("neither a color token"));
}

#[test]
fn test_bare_value_misses_silently_off_color_props() {
    let system = spacing_system();
    for (prop, raw) in [("fontSize", "sm"), ("zIndex", "2"), ("width", "sm")] {
        let (css, diagnostics) = resolve_with_diagnostics(prop, raw, &system);
        assert_eq!(css.as_deref(), Some(raw));
        assert!(diagnostics.is_empty(), "{prop}={raw} stays silent");
    }
}

#[test]
fn test_whole_css_values_fence_before_lookup() {
    let system = BaseSystem::lib_fixture();
    for (prop, raw) in [
        ("backgroundColor", "rgba(0,0,0,0.5)"),
        ("transform", "translateX(1.25rem)"),
        ("color", "oklch(0.7 0.1 180)"),
        ("color", "red"),
        ("width", "13px"),
        ("margin", "4r"),
    ] {
        let (css, diagnostics) = resolve_with_diagnostics(prop, raw, &system);
        assert_eq!(css.as_deref(), Some(raw));
        assert!(diagnostics.is_empty(), "{prop}={raw} stays silent");
    }
}

#[test]
fn test_dotted_non_token_still_warns() {
    let (css, diagnostics) =
        resolve_with_diagnostics("color", "ui.missing.path", BaseSystem::lib_fixture());
    assert_eq!(css.as_deref(), Some("ui.missing.path"));
    assert_eq!(diagnostics.len(), 1);
    assert!(diagnostics[0].message.contains("unknown token path"));
}

#[test]
fn test_braced_missing_reference_errors_and_drops() {
    let (css, diagnostics) =
        resolve_with_diagnostics("color", "{colors.nope}", BaseSystem::lib_fixture());
    assert_eq!(css, None);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error);
    assert!(diagnostics[0].message.contains("{colors.nope}"));
}

#[test]
fn test_embedded_missing_reference_errors_and_drops() {
    let (css, diagnostics) = resolve_with_diagnostics(
        "border",
        "2px solid {colors.nope}",
        BaseSystem::lib_fixture(),
    );
    assert_eq!(css, None);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error);
    assert!(diagnostics[0].message.contains("{colors.nope}"));
}

#[test]
fn test_braced_opacity_reference_resolves() {
    let (css, diagnostics) =
        resolve_with_diagnostics("bg", "{colors.blue.600/50}", BaseSystem::lib_fixture());
    assert_eq!(
        css.as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-600) 50%, transparent)")
    );
    assert!(diagnostics.is_empty());
}
