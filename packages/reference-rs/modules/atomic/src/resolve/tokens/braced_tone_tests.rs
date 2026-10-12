//! Braced tone references through `resolve_token_value`: a known tone resolves
//! to the same `color-mix` as the bare form, an unknown or unusable tone inside
//! braces errors once and drops the declaration (TONES-02), and whole-value
//! braces behave like embedded ones. Fixtures come from `tones_resolve_tests`.

use base_system::{BaseSystem, TokenLeaf};

use super::tones_resolve_tests::{resolve_with_diagnostics, tone_fixture};
use crate::diagnostics::{DiagnosticCode, DiagnosticSeverity};

#[test]
fn brace_tone_uses_the_outer_property_role() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics(
        "border",
        "1px solid {colors.blue.500/medium}",
        &system,
    );
    assert_eq!(
        css.as_deref(),
        Some(
            "1px solid color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent)"
        )
    );
    assert!(diagnostics.is_empty());
    let (css, diagnostics) = resolve_with_diagnostics(
        "boxShadow",
        "0 0 0 3px {colors.blue.500/medium}",
        &system,
    );
    assert_eq!(
        css.as_deref(),
        Some(
            "0 0 0 3px color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent)"
        )
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn brace_unknown_tone_errors_and_drops() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics(
        "border",
        "1px solid {colors.blue.500/mediun}",
        &system,
    );
    assert_eq!(css, None);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownTokenReference);
    assert_eq!(
        diagnostics[0].message,
        "unknown tone `mediun` in `{colors.blue.500/mediun}` (did you mean `medium`?)"
    );
}

#[test]
fn whole_braced_unknown_tone_errors_and_drops() {
    let system = tone_fixture();
    let (css, diagnostics) =
        resolve_with_diagnostics("borderColor", "{colors.blue.500/mediun}", &system);
    assert_eq!(css, None);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownTokenReference);
    assert_eq!(
        diagnostics[0].message,
        "unknown tone `mediun` in `{colors.blue.500/mediun}` (did you mean `medium`?)"
    );
}

#[test]
fn whole_braced_known_tone_still_resolves() {
    let system = tone_fixture();
    let (css, diagnostics) =
        resolve_with_diagnostics("borderColor", "{colors.blue.500/medium}", &system);
    assert_eq!(
        css.as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent)")
    );
    assert!(diagnostics.is_empty());
}

fn brand_fixture() -> BaseSystem {
    let mut system = tone_fixture();
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "brand",
        light: "#ff0000",
        dark: "#ff0000",
    });
    system
}

#[test]
fn whole_braced_tone_follows_the_prop_role() {
    let system = tone_fixture();
    for (prop, var) in [
        ("bg", "--tones-medium-surface"),
        ("color", "--tones-medium-line"),
        ("borderColor", "--tones-medium-line"),
    ] {
        let (css, diagnostics) =
            resolve_with_diagnostics(prop, "{colors.blue.500/medium}", &system);
        let expected = format!(
            "color-mix(in srgb, var(--colors-blue-500) var({var}), transparent)"
        );
        assert_eq!(css.as_deref(), Some(expected.as_str()), "{prop}");
        assert!(diagnostics.is_empty(), "{prop}");
    }
}

#[test]
fn whole_braced_numeric_modifier_is_not_a_tone() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("bg", "{colors.blue.500/50}", &system);
    assert_eq!(
        css.as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-500) 50%, transparent)")
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn whole_braced_bare_base_resolves_known_and_refuses_unknown() {
    let system = brand_fixture();
    for raw in ["{brand/medium}", "{colors.brand/medium}"] {
        let (css, diagnostics) = resolve_with_diagnostics("borderColor", raw, &system);
        assert_eq!(
            css.as_deref(),
            Some("color-mix(in srgb, var(--colors-brand) var(--tones-medium-line), transparent)"),
            "{raw}"
        );
        assert!(diagnostics.is_empty(), "{raw}");
    }
    let (css, diagnostics) = resolve_with_diagnostics("borderColor", "{brand/mediun}", &system);
    assert_eq!(css, None);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].message,
        "unknown tone `mediun` in `{brand/mediun}` (did you mean `medium`?)"
    );
}

#[test]
fn braced_tone_error_is_one_diagnostic_in_every_shape() {
    let system = tone_fixture();
    for (prop, raw) in [
        ("border", "1px solid {colors.blue.500/mediun}"),
        ("bg", "-{colors.blue.500/mediun}"),
        ("borderColor", "{colors.blue.500/mediun}"),
        ("bg", "{colors.blue.500/arc}"),
    ] {
        let (css, diagnostics) = resolve_with_diagnostics(prop, raw, &system);
        assert_eq!(css, None, "{raw}");
        assert_eq!(diagnostics.len(), 1, "{raw}");
        assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error, "{raw}");
    }
}

#[test]
fn padded_whole_braces_fail_closed_like_a_plain_token() {
    let system = tone_fixture();
    for raw in [
        "{ colors.blue.500 }",
        "{ colors.blue.500/medium }",
        "{ colors.blue.500/mediun }",
    ] {
        let (css, diagnostics) = resolve_with_diagnostics("borderColor", raw, &system);
        assert_eq!(css, None, "{raw}");
        assert_eq!(diagnostics.len(), 1, "{raw}");
        assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error, "{raw}");
    }
}
