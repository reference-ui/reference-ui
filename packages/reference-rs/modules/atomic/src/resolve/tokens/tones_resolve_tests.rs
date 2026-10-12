//! End-to-end tone resolution through `resolve_token_value`: how a bare
//! `base/name` routes to surface/line tone vars, when numeric opacity wins,
//! and where unknown or malformed values warn and fall through. Each case
//! asserts the emitted CSS plus the diagnostics it must raise. The tones
//! module's own piecewise unit tests live in `tones_tests.rs`.

use base_system::{BaseSystem, TokenLeaf};

use super::resolve_token_value;
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity};
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
        sink: None,
        want: None,
    };
    let css = resolve_token_value(prop, raw, &mut session).map(|resolved| resolved.into_owned());
    drop(session);
    (css, diagnostics)
}

/// A small tone-bearing system: one colour, surface/line/flat/surface-only
/// tones, an unusable fraction tone, and a spacing token for the non-colour case.
fn tone_fixture() -> BaseSystem {
    let mut system = BaseSystem::default();
    for (category, path, light) in [
        ("colors", "blue.500", "#2563eb"),
        ("tones", "medium.surface", "10%"),
        ("tones", "medium.line", "34%"),
        ("tones", "hush", "6%"),
        ("tones", "solo.surface", "12.5%"),
        ("tones", "arc", "0.1"),
        ("spacing", "4", "1rem"),
    ] {
        system.tokens.insert_leaf(TokenLeaf {
            category,
            path,
            light,
            dark: light,
        });
    }
    system
}

#[test]
fn tone_roles_emit_surface_and_line_vars() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("bg", "blue.500/medium", &system);
    assert_eq!(
        css.as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)")
    );
    assert!(diagnostics.is_empty());
    let (css, diagnostics) = resolve_with_diagnostics("borderColor", "blue.500/medium", &system);
    assert_eq!(
        css.as_deref(),
        Some("color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-line), transparent)")
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn flat_and_surface_only_tones_serve_both_roles() {
    let system = tone_fixture();
    for prop in ["bg", "borderColor"] {
        let (css, diagnostics) = resolve_with_diagnostics(prop, "blue.500/hush", &system);
        assert_eq!(
            css.as_deref(),
            Some("color-mix(in srgb, var(--colors-blue-500) var(--tones-hush), transparent)"),
            "{prop}"
        );
        assert!(diagnostics.is_empty());
    }
    let (css, diagnostics) = resolve_with_diagnostics("borderColor", "blue.500/solo", &system);
    assert_eq!(
        css.as_deref(),
        Some(
            "color-mix(in srgb, var(--colors-blue-500) var(--tones-solo-surface), transparent)"
        )
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn numeric_opacity_modifiers_stay_byte_identical() {
    let system = tone_fixture();
    for (raw, expected) in [
        (
            "blue.500/10",
            "color-mix(in srgb, var(--colors-blue-500) 10%, transparent)",
        ),
        (
            "blue.500/25%",
            "color-mix(in srgb, var(--colors-blue-500) 25%, transparent)",
        ),
    ] {
        let (css, diagnostics) = resolve_with_diagnostics("bg", raw, &system);
        assert_eq!(css.as_deref(), Some(expected), "{raw}");
        assert!(diagnostics.is_empty(), "{raw}");
    }
}

#[test]
fn numeric_opacity_beats_a_literal_slash_key() {
    let mut system = tone_fixture();
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "a",
        light: "#000000",
        dark: "#000000",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "a/50",
        light: "#123456",
        dark: "#123456",
    });
    let (css, diagnostics) = resolve_with_diagnostics("bg", "a/50", &system);
    assert_eq!(
        css.as_deref(),
        Some("color-mix(in srgb, var(--colors-a) 50%, transparent)"),
        "the split opacity lookup wins over the literal whole key"
    );
    assert!(diagnostics.is_empty());
}

#[test]
fn unknown_tone_warns_and_stays_raw() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("bg", "blue.500/mediun", &system);
    assert_eq!(css.as_deref(), Some("blue.500/mediun"));
    assert_eq!(diagnostics.len(), 1);
    let diagnostic = &diagnostics[0];
    assert_eq!(diagnostic.code, DiagnosticCode::UnknownTone);
    assert_eq!(diagnostic.severity, DiagnosticSeverity::Warning);
    assert_eq!(
        diagnostic.message,
        "unknown tone `mediun` in `blue.500/mediun`"
    );
    assert_eq!(
        diagnostic.help,
        Some(vec![
            "did you mean `medium`?".to_string(),
            "declare it with tokens({ tones: { mediun: { surface: { value: '10%' }, line: { value: '34%' } } } }) — tone values are percentages — or use /<0-100>".to_string(),
        ])
    );
}

#[test]
fn fraction_tone_is_treated_as_unknown() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("bg", "blue.500/arc", &system);
    assert_eq!(css.as_deref(), Some("blue.500/arc"));
    assert!(!css.as_deref().unwrap().contains("color-mix"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownTone);
}

#[test]
fn negated_tone_is_untouched() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("color", "-blue.500/medium", &system);
    assert_eq!(css.as_deref(), Some("-blue.500/medium"));
    assert!(!css.as_deref().unwrap().contains("color-mix"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownTokenPath);
}

#[test]
fn colour_keyword_never_takes_the_tone_path() {
    let mut with_token = tone_fixture();
    with_token.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "white",
        light: "#ffffff",
        dark: "#ffffff",
    });
    for (label, system) in [
        ("with a colors.white token", with_token),
        ("without a colors.white token", tone_fixture()),
    ] {
        let (css, diagnostics) = resolve_with_diagnostics("color", "white/medium", &system);
        assert_eq!(css.as_deref(), Some("white/medium"), "{label}");
        assert!(!css.as_deref().unwrap().contains("color-mix"), "{label}");
        assert_eq!(diagnostics.len(), 1, "{label}");
        assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownColor, "{label}");
    }
}

#[test]
fn literal_slash_token_beats_a_tone() {
    let mut system = tone_fixture();
    system.tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "a/b",
        light: "#000000",
        dark: "#000000",
    });
    system.tokens.insert_leaf(TokenLeaf {
        category: "tones",
        path: "b",
        light: "50%",
        dark: "50%",
    });
    let (css, diagnostics) = resolve_with_diagnostics("bg", "a/b", &system);
    assert_eq!(css.as_deref(), Some("var(--colors-a/b)"));
    assert!(diagnostics.is_empty());
}

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

#[test]
fn declared_unusable_tone_offers_only_the_fix_line() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("bg", "blue.500/arc", &system);
    assert_eq!(css.as_deref(), Some("blue.500/arc"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownTone);
    let help = diagnostics[0].help.clone().unwrap_or_default();
    assert_eq!(
        help.len(),
        1,
        "`arc` is declared, not misspelt: no did-you-mean"
    );
    assert!(help[0].starts_with("declare it with tokens("));
}

#[test]
fn non_colour_base_keeps_the_malformed_warning() {
    let system = tone_fixture();
    let (css, diagnostics) = resolve_with_diagnostics("mt", "spacing.4/medium", &system);
    assert_eq!(css.as_deref(), Some("spacing.4/medium"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, DiagnosticCode::MalformedOpacity);
}
