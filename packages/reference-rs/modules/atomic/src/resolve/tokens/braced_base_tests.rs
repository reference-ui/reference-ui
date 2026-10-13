//! Braced references that name a bare colour base, whole and composite: `{brand}`,
//! `{brand/medium}`, `{colors.brand}` and `{colors.brand/medium}`. A composite brace is
//! one segment of a larger value, so it must resolve each form the way the whole value
//! does. A bare base that names two tokens on a custom property must stay an error,
//! never a silent pick. Fixtures come from `tones_resolve_tests`, plus `brand` here.

use base_system::{BaseSystem, TokenLeaf};

use super::tones_resolve_tests::{resolve_with_diagnostics, tone_fixture};
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticSeverity};

const MIX_LINE: &str =
    "color-mix(in srgb, var(--colors-brand) var(--tones-medium-line), transparent)";

fn brand_system() -> BaseSystem {
    let mut system = tone_fixture();
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "brand",
        light: "#ff0000",
        dark: "#ff0000",
    });
    system
}

/// The same bare `brand` name, now also declared under `radii`.
fn ambiguous_brand_system() -> BaseSystem {
    let mut system = brand_system();
    system.tokens.insert_leaf(TokenLeaf {
        category: "radii",
        path: "brand",
        light: "4px",
        dark: "4px",
    });
    system
}

fn assert_one_error(css: Option<String>, diagnostics: &[Diagnostic], label: &str) {
    assert_eq!(css, None, "{label}");
    assert_eq!(diagnostics.len(), 1, "{label}");
    assert_eq!(
        diagnostics[0].severity,
        DiagnosticSeverity::Error,
        "{label}"
    );
    assert_eq!(
        diagnostics[0].code,
        DiagnosticCode::UnknownTokenReference,
        "{label}"
    );
}

#[test]
fn four_forms_resolve_the_same_whole_and_composite() {
    let system = brand_system();
    for (form, expected) in [
        ("{brand}", "var(--colors-brand)"),
        ("{colors.brand}", "var(--colors-brand)"),
        ("{brand/medium}", MIX_LINE),
        ("{colors.brand/medium}", MIX_LINE),
    ] {
        let (whole, diagnostics) = resolve_with_diagnostics("borderColor", form, &system);
        assert_eq!(whole.as_deref(), Some(expected), "whole {form}");
        assert!(diagnostics.is_empty(), "whole {form}");
        let composite = format!("1px solid {form}");
        let (css, diagnostics) = resolve_with_diagnostics("border", &composite, &system);
        assert_eq!(
            css,
            Some(format!("1px solid {expected}")),
            "composite {form}"
        );
        assert!(diagnostics.is_empty(), "composite {form}");
    }
}

#[test]
fn unique_bare_base_on_a_custom_property_resolves_in_both_shapes() {
    let system = brand_system();
    let (css, diagnostics) = resolve_with_diagnostics("--brand-x", "{brand}", &system);
    assert_eq!(css.as_deref(), Some("var(--colors-brand)"));
    assert!(diagnostics.is_empty());
    let (css, diagnostics) = resolve_with_diagnostics("--brand-x", "1px solid {brand}", &system);
    assert_eq!(css.as_deref(), Some("1px solid var(--colors-brand)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn colour_prop_picks_the_colour_category_for_a_bare_base() {
    let system = ambiguous_brand_system();
    let (css, diagnostics) = resolve_with_diagnostics("borderColor", "{brand}", &system);
    assert_eq!(css.as_deref(), Some("var(--colors-brand)"));
    assert!(diagnostics.is_empty());
    let (css, diagnostics) = resolve_with_diagnostics("border", "1px solid {brand}", &system);
    assert_eq!(css.as_deref(), Some("1px solid var(--colors-brand)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn ambiguous_bare_base_on_a_custom_property_is_not_picked() {
    let system = ambiguous_brand_system();
    for form in ["{brand}", "{brand/medium}"] {
        let (css, diagnostics) = resolve_with_diagnostics("--brand-x", form, &system);
        assert_one_error(css, &diagnostics, form);
        let composite = format!("1px solid {form}");
        let (css, diagnostics) = resolve_with_diagnostics("--brand-x", &composite, &system);
        assert_one_error(css, &diagnostics, &composite);
    }
    let (css, diagnostics) =
        resolve_with_diagnostics("--brand-x", "1px solid {colors.brand}", &system);
    assert_eq!(css.as_deref(), Some("1px solid var(--colors-brand)"));
    assert!(diagnostics.is_empty());
}

#[test]
fn unknown_tone_on_a_bare_base_errors_once_in_both_shapes() {
    let system = brand_system();
    let (css, diagnostics) = resolve_with_diagnostics("borderColor", "{brand/mediun}", &system);
    assert_one_error(css, &diagnostics, "whole {brand/mediun}");
    assert_eq!(
        diagnostics[0].message,
        "unknown tone `mediun` in `{brand/mediun}` (did you mean `medium`?)"
    );
    let (css, diagnostics) =
        resolve_with_diagnostics("border", "1px solid {brand/mediun}", &system);
    assert_one_error(css, &diagnostics, "composite {brand/mediun}");
    assert_eq!(
        diagnostics[0].message,
        "unknown tone `mediun` in `{brand/mediun}` (did you mean `medium`?)"
    );
}

#[test]
fn unknown_bare_base_errors_once_in_both_shapes() {
    let system = brand_system();
    for form in ["{nope}", "{nope/medium}"] {
        let (css, diagnostics) = resolve_with_diagnostics("borderColor", form, &system);
        assert_one_error(css, &diagnostics, form);
        let composite = format!("1px solid {form}");
        let (css, diagnostics) = resolve_with_diagnostics("border", &composite, &system);
        assert_one_error(css, &diagnostics, &composite);
    }
}

#[test]
fn bare_base_with_numeric_opacity_agrees_in_both_shapes() {
    let system = brand_system();
    let expected = "color-mix(in srgb, var(--colors-brand) 50%, transparent)";
    let (whole, diagnostics) = resolve_with_diagnostics("borderColor", "{brand/50}", &system);
    assert_eq!(whole.as_deref(), Some(expected));
    assert!(diagnostics.is_empty());
    let (css, diagnostics) = resolve_with_diagnostics("border", "1px solid {brand/50}", &system);
    assert_eq!(css, Some(format!("1px solid {expected}")));
    assert!(diagnostics.is_empty());
}
