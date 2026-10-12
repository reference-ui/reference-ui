//! TYP-TONE-01–06: the `tones` token category.
//! `tones` is known but never a `CATEGORIES` row: aliases take the first path
//! segment (`medium.surface` → `medium`, deduped, sorted) and `TonedColorToken`
//! composes those names onto `ColorToken`. The `Tokens` index always carries
//! `tones`, open colour props include the toned alias, and strict colour parts
//! add it right after `ColorToken` without making `tones` a strict category.

use super::{assert_alias, parse_dump, tones_dts, tones_strict_dts};
use crate::{emit_dts, emit_dts_with_diagnostics, EmitOptions};

/// TYP-TONE-01 — ToneToken is sorted, deduped first segments; `Tokens` indexes it.
#[test]
fn typ_tone_01_emits_first_segment_tone_token() {
    let dts = tones_dts();
    assert_alias(&dts, "ToneToken", "'hush' | 'medium'");
    assert!(
        !dts.contains("'medium.surface'") && !dts.contains("'medium.line'"),
        "TYP-TONE-01: tone names must strip role leaves:\n{dts}"
    );
    assert!(
        dts.contains("  tones: ToneToken;"),
        "TYP-TONE-01: Tokens must index tones in:\n{dts}"
    );
}

/// TYP-TONE-02 — no tones prints `never`, like the core categories.
#[test]
fn typ_tone_02_emits_never_without_tones() {
    let system = parse_dump(
        r##"{"tokens":{"colors":{"n100":{"value":"#fff"}}},"breakpoints":{"sm":"640px"}}"##,
        "tones-empty",
    );
    assert_alias(&emit_dts(&system), "ToneToken", "never");
}

/// TYP-TONE-03 — TonedColorToken composes ColorToken and ToneToken.
#[test]
fn typ_tone_03_emits_toned_color_alias() {
    assert_alias(
        &tones_dts(),
        "TonedColorToken",
        "`${ColorToken}/${ToneToken}`",
    );
}

/// TYP-TONE-04 — a `tones` category is known: no unknown-category diagnostic.
#[test]
fn typ_tone_04_tones_category_is_known() {
    let system = parse_dump(super::fixtures::TONES_JSON, "tones-diag");
    let detailed = emit_dts_with_diagnostics(&system, &EmitOptions::default());
    assert!(
        detailed.diagnostics.is_empty(),
        "TYP-TONE-04: tones must be quiet, got {:?}",
        detailed.diagnostics
    );
}

/// TYP-TONE-05 — open colour props accept TonedColorToken.
#[test]
fn typ_tone_05_open_colour_prop_includes_toned_token() {
    let line = "  bg?: StylePropValue<ColorToken | TonedColorToken | (string & {})>;";
    let dts = tones_dts();
    assert!(dts.contains(line), "TYP-TONE-05: missing `{line}` in:\n{dts}");
}

/// TYP-TONE-06 — strict colour parts add TonedColorToken after ColorToken; `tones` stays non-strict.
#[test]
fn typ_tone_06_strict_colour_parts_include_toned_token() {
    let dts = tones_strict_dts();
    assert!(
        dts.contains("type StrictColorValue =\n  | ColorToken\n  | TonedColorToken\n"),
        "TYP-TONE-06: TonedColorToken must follow ColorToken in:\n{dts}"
    );
    let unknown = emit_dts_with_diagnostics(
        &super::tones_system(),
        &EmitOptions {
            strict: vec!["tones".to_string()],
        },
    );
    assert!(
        unknown
            .diagnostics
            .iter()
            .any(|note| note.code.as_str() == "TGN-W-UNKNOWN-STRICT-CATEGORY"),
        "TYP-TONE-06: tones must stay an unknown strict category, got {:?}",
        unknown.diagnostics
    );
}
