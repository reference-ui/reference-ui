//! Token-layer system tests: rhythm and composite token values, unknown and unterminated refs, and the token scope selectors.
//! Each case builds a system through the shared fixtures in `tests` and asserts on the printed token block or its diagnostics.

use super::*;
use base_system::{TokenDictionary, TokenLeaf};

#[test]
fn doom_t_rhythm_token_value_resolves_through_spacing_root() {
    let (css, diagnostics) = emit_with_diagnostics(&doom_t_system("1r", "1r"));
    assert!(
        css.contains("--spacing-4: var(--spacing-root);"),
        "rhythm token must resolve like keyframes:\n{css}"
    );
    assert!(
        !css.contains(": 1r;"),
        "no invalid raw-r mint allowed:\n{css}"
    );
    assert!(diagnostics.is_empty(), "resolved rhythm stays silent");
}

#[test]
fn doom_t_dark_override_rhythm_resolves_in_dark_block() {
    let (css, diagnostics) = emit_with_diagnostics(&doom_t_system("1r", "2r"));
    let (_, dark) = css
        .split_once("[data-color-mode=dark]")
        .expect("dark block must print for dark overrides");
    assert!(
        css.contains("--spacing-4: var(--spacing-root);"),
        "light keeps resolving:\n{css}"
    );
    assert!(
        dark.contains("--spacing-4: calc(2 * var(--spacing-root));"),
        "dark override resolves through the same choke point:\n{css}"
    );
    assert!(!css.contains(": 1r;") && !css.contains(": 2r;"));
    assert!(diagnostics.is_empty(), "resolved rhythm stays silent");
}

#[test]
fn doom_t_genuine_css_token_values_print_verbatim() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "spacing",
        path: "px",
        light: "0.25rem",
        dark: "0.25rem",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "borders",
        path: "line",
        light: "1px solid red",
        dark: "1px solid red",
    });
    let system = BaseSystem {
        name: "doom-t".into(),
        tokens,
        ..Default::default()
    };
    let (css, diagnostics) = emit_with_diagnostics(&system);
    assert!(css.contains("--spacing-px: 0.25rem;"), "{css}");
    assert!(css.contains("--borders-line: 1px solid red;"), "{css}");
    assert!(diagnostics.is_empty(), "raw CSS stays silent");
}

#[test]
fn doom_t_spacing_root_refuses_rhythm_value() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "spacing",
        path: "root",
        light: "1r",
        dark: "1r",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "spacing",
        path: "4",
        light: "1r",
        dark: "1r",
    });
    let system = BaseSystem {
        name: "doom-t".into(),
        tokens,
        ..Default::default()
    };
    let (css, diagnostics) = emit_with_diagnostics(&system);
    assert!(
        !css.contains("--spacing-root:"),
        "no self-referential root mint:\n{css}"
    );
    assert!(
        css.contains("--spacing-4: var(--spacing-root);"),
        "healthy sibling still emits:\n{css}"
    );
    assert_eq!(diagnostics.len(), 1, "one refusal, no silence");
    let refusal = &diagnostics[0];
    assert_eq!(
        refusal.severity,
        crate::diagnostics::DiagnosticSeverity::Error
    );
    assert_eq!(
        refusal.code,
        crate::diagnostics::DiagnosticCode::RhythmRootCycle
    );
    assert!(
        refusal.message.contains("--spacing-root"),
        "{}",
        refusal.message
    );
    assert!(refusal.message.contains("1r"), "{}", refusal.message);
}

#[test]
fn composite_token_value_expands_embedded_ref() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "gray.900",
        light: "#111827",
        dark: "#f9fafb",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "docs-control-bg",
        light: "rgba(255, 255, 255, 0.72)",
        dark: "color-mix(in oklch, {colors.gray.900} 72%, transparent)",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "docs-scrim",
        light: "color-mix(in srgb, {colors.gray.900/50}, transparent)",
        dark: "color-mix(in srgb, {colors.gray.900/50}, transparent)",
    });
    let system = BaseSystem {
        name: "composite-ref".into(),
        tokens,
        ..Default::default()
    };
    let (css, diagnostics) = emit_with_diagnostics(&system);
    let (_, dark) = css
        .split_once("[data-color-mode=dark]")
        .expect("dark block must print for dark overrides");
    assert!(
        dark.contains(
            "--colors-docs-control-bg: color-mix(in oklch, var(--colors-gray-900) 72%, transparent);"
        ),
        "embedded ref must expand like the utility path:\n{css}"
    );
    assert!(
        css.contains(
            "--colors-docs-scrim: color-mix(in srgb, color-mix(in srgb, var(--colors-gray-900) 50%, transparent), transparent);"
        ),
        "opacity segments must expand like the utility path:\n{css}"
    );
    assert!(
        !css.contains("{colors."),
        "no verbatim brace ref may survive:\n{css}"
    );
    assert!(diagnostics.is_empty(), "resolved refs stay silent");
}

#[test]
fn unknown_token_ref_in_token_value_stays_verbatim_and_errors() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "whole-miss",
        light: "{colors.ghost}",
        dark: "{colors.ghost}",
    });
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "composite-miss",
        light: "color-mix(in oklch, {colors.ghost} 72%, transparent)",
        dark: "color-mix(in oklch, {colors.ghost} 72%, transparent)",
    });
    let system = BaseSystem {
        name: "unknown-ref".into(),
        tokens,
        ..Default::default()
    };
    let (css, diagnostics) = emit_with_diagnostics(&system);
    assert!(
        css.contains("--colors-whole-miss: {colors.ghost};"),
        "unresolvable whole-value refs print verbatim, mirroring keyframes:\n{css}"
    );
    assert!(
        css.contains(
            "--colors-composite-miss: color-mix(in oklch, {colors.ghost} 72%, transparent);"
        ),
        "unresolvable composite refs print verbatim, mirroring keyframes:\n{css}"
    );
    assert_eq!(diagnostics.len(), 2, "one error per miss, no silence");
    for refusal in &diagnostics {
        assert_eq!(
            refusal.severity,
            crate::diagnostics::DiagnosticSeverity::Error
        );
        assert_eq!(
            refusal.code,
            crate::diagnostics::DiagnosticCode::UnknownTokenReference
        );
        assert!(
            refusal.message.contains("{colors.ghost}"),
            "{}",
            refusal.message
        );
    }
}

#[test]
fn unterminated_brace_in_token_value_stays_raw_and_warns() {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "colors",
        path: "ragged",
        light: "1px solid {colors.gray.900",
        dark: "1px solid {colors.gray.900",
    });
    let system = BaseSystem {
        name: "ragged-ref".into(),
        tokens,
        ..Default::default()
    };
    let (css, diagnostics) = emit_with_diagnostics(&system);
    assert!(
        css.contains("--colors-ragged: 1px solid {colors.gray.900;"),
        "unterminated braces stay raw like the utility path:\n{css}"
    );
    assert_eq!(diagnostics.len(), 1, "one warning, no silence");
    assert_eq!(
        diagnostics[0].severity,
        crate::diagnostics::DiagnosticSeverity::Warning
    );
    assert_eq!(
        diagnostics[0].code,
        crate::diagnostics::DiagnosticCode::UnterminatedBrace
    );
}

/// Tokens of `custom_system` printed under one scope, for the selector assertions.
fn tokens_under(scope: TokenScope<'_>) -> String {
    let mut out = String::new();
    let mut diagnostics = Vec::new();
    append_tokens(&mut out, &custom_system(), scope, &mut diagnostics);
    out
}

#[test]
fn token_scope_root_prints_root_and_bare_color_mode_selectors() {
    let css = tokens_under(TokenScope::Root);
    assert!(
        css.contains("  :root, [data-color-mode=light] {\n"),
        "{css}"
    );
    assert!(css.contains("  [data-color-mode=dark] {\n"), "{css}");
    assert!(!css.contains("data-layer"), "{css}");
}

#[test]
fn token_scope_portable_names_only_the_system_data_layer() {
    let css = tokens_under(TokenScope::Portable { extended: &[] });
    assert!(
        css.contains(
            "  [data-layer=\"custom\"], [data-layer=\"custom\"][data-color-mode=light] {\n"
        ),
        "{css}"
    );
    assert!(
        css.contains("  [data-layer=\"custom\"][data-color-mode=dark] {\n"),
        "{css}"
    );
    assert!(!css.contains(":root"), "{css}");
}

#[test]
fn token_scope_isolated_adds_own_layer_and_never_prints_bare_dark() {
    let css = tokens_under(TokenScope::Isolated { extended: &[] });
    assert!(
        css.contains(
            "  :root, :root[data-color-mode=light], body[data-color-mode=light], [data-layer=\"custom\"], [data-layer=\"custom\"][data-color-mode=light] {\n"
        ),
        "{css}"
    );
    assert!(
        css.contains(
            "  :root[data-color-mode=dark], body[data-color-mode=dark], [data-layer=\"custom\"][data-color-mode=dark] {\n"
        ),
        "{css}"
    );
    assert!(!css.contains("\n  [data-color-mode=dark] {"), "{css}");
}

/// The systems the extended-stamp tests name: an upstream chain, outermost last.
fn extended_chain() -> Vec<String> {
    vec!["base".to_string(), "mid".to_string()]
}

#[test]
fn token_scope_portable_claims_each_extended_stamp_after_its_own() {
    let extended = extended_chain();
    let css = tokens_under(TokenScope::Portable {
        extended: &extended,
    });
    assert!(
        css.contains(
            "  [data-layer=\"custom\"], [data-layer=\"custom\"][data-color-mode=light], [data-layer=\"base\"], [data-layer=\"base\"][data-color-mode=light], [data-layer=\"mid\"], [data-layer=\"mid\"][data-color-mode=light] {\n"
        ),
        "{css}"
    );
    assert!(
        css.contains(
            "  [data-layer=\"custom\"][data-color-mode=dark], [data-layer=\"base\"][data-color-mode=dark], [data-layer=\"mid\"][data-color-mode=dark] {\n"
        ),
        "{css}"
    );
    assert!(!css.contains(":root"), "{css}");
}

#[test]
fn token_scope_isolated_claims_each_extended_stamp_and_keeps_the_document() {
    let extended = extended_chain();
    let css = tokens_under(TokenScope::Isolated {
        extended: &extended,
    });
    assert!(
        css.contains(
            "  :root, :root[data-color-mode=light], body[data-color-mode=light], [data-layer=\"custom\"], [data-layer=\"custom\"][data-color-mode=light], [data-layer=\"base\"], [data-layer=\"base\"][data-color-mode=light], [data-layer=\"mid\"], [data-layer=\"mid\"][data-color-mode=light] {\n"
        ),
        "{css}"
    );
    assert!(
        css.contains(
            "  :root[data-color-mode=dark], body[data-color-mode=dark], [data-layer=\"custom\"][data-color-mode=dark], [data-layer=\"base\"][data-color-mode=dark], [data-layer=\"mid\"][data-color-mode=dark] {\n"
        ),
        "{css}"
    );
}

#[test]
fn own_token_scope_is_root_alone_and_isolated_with_its_extended_list_under_upstreams() {
    let extended = extended_chain();
    let alone = vec!["custom".to_string()];
    assert_eq!(own_token_scope(&alone, &extended), TokenScope::Root);
    let composed = vec!["custom".to_string(), "base".to_string(), "mid".to_string()];
    assert_eq!(
        own_token_scope(&composed, &extended),
        TokenScope::Isolated {
            extended: &extended
        }
    );
}
