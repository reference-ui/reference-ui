//! Unit tests for the lexical functions: structural whitespace matches the char set over the BMP, the
//! decimal grammar agrees with `f64` parsing, the finite gate and magnitude fence pin their boundaries,
//! `r` collapse keeps its epsilon, and ASCII folding and sanitize touch only their own character sets.
//! Each test exercises one named function from the parent module. Compiled only under `cfg(test)` as a child of `lexical`.

use super::*;

#[test]
fn structural_set_matches_char_whitespace_over_bmp() {
    for code in 0..0x10000u32 {
        let Some(ch) = char::from_u32(code) else {
            continue;
        };
        assert_eq!(
            is_structural_whitespace(ch),
            ch.is_whitespace(),
            "U+{code:04X}"
        );
    }
}

#[test]
fn structural_trim_matches_str_trim_on_marks() {
    for text in [" 1e21 ", "\u{85}1\u{85}", "\u{feff}1\u{feff}", "\ta\n", "1"] {
        assert_eq!(trim_structural(text), text.trim(), "{text:?}");
    }
}

#[test]
fn decimal_grammar_agrees_with_f64_parse() {
    let corpus = [
        "0",
        "-0",
        "4",
        "1e3",
        ".5",
        "01",
        "5.",
        "5.e3",
        "+.5",
        "-.5e+3",
        "0E0",
        "00.5",
        "1e21",
        "1e-7",
        "1e999",
        "1e-999",
        "4e-324",
        "100",
        "0.30000000000000004",
        "inf",
        "INF",
        "Infinity",
        "iNfInItY",
        "-inf",
        "+Infinity",
        "nan",
        "NAN",
        "-nan",
        "0x10",
        "0b1",
        "0o7",
        "",
        "  ",
        "1_0",
        "1e",
        "e5",
        "+",
        "-",
        ".",
        "-.",
        "1.2.3",
        "1e2e3",
        "--1",
        "++1",
        "+-1",
        "1e+-1",
        "1e-+1",
        "in",
        "infx",
        "nan0",
        "nana",
        "infinityX",
        " 1",
        "1 ",
        "1 2",
        "0b",
        "0o",
        "0x",
        "NaN ",
        "５",
        "1d5",
        "0.0.0",
        "1E+5",
        "1E-5",
    ];
    for text in corpus {
        let mine = parse_decimal(text).map(|d| d.value().to_bits());
        let std = text.parse::<f64>().ok().map(f64::to_bits);
        assert_eq!(mine, std, "{text:?}");
    }
}

#[test]
fn finite_entry_gates_non_finite_for_unit_site() {
    assert_eq!(parse_decimal("1e3").and_then(|d| d.finite()), Some(1000.0));
    assert_eq!(parse_decimal("inf").and_then(|d| d.finite()), None);
    assert_eq!(parse_decimal("nan").and_then(|d| d.finite()), None);
    assert!(parse_decimal("inf").is_some());
}

#[test]
fn magnitude_fence_pins_both_boundaries() {
    assert!(in_canonical_magnitude(0.0));
    assert!(in_canonical_magnitude(-0.0));
    assert!(in_canonical_magnitude(1e-6));
    assert!(in_canonical_magnitude(-1e-6));
    assert!(!in_canonical_magnitude(9.999_999e-7));
    assert!(in_canonical_magnitude(1e20));
    assert!(!in_canonical_magnitude(1e21));
    assert!(!in_canonical_magnitude(-1e21));
    assert!(!in_canonical_magnitude(f64::INFINITY));
    assert!(!in_canonical_magnitude(f64::NAN));
}

#[test]
fn render_folds_zero_and_never_exponents() {
    assert_eq!(render_decimal(0.0), "0");
    assert_eq!(render_decimal(-0.0), "0");
    assert_eq!(render_decimal(1000.0), "1000");
    assert_eq!(render_decimal(0.5), "0.5");
    assert_eq!(render_decimal(0.30000000000000004), "0.30000000000000004");
    assert_eq!(render_decimal(1e20), "100000000000000000000");
}

#[test]
fn r_collapse_pins_epsilon_truncation_and_fence() {
    assert_eq!(collapse_r_number(2.0).as_deref(), Some("2"));
    assert_eq!(collapse_r_number(2.0000005).as_deref(), Some("2"));
    assert_eq!(collapse_r_number(2.9999999).as_deref(), Some("2"));
    assert_eq!(collapse_r_number(2.5).as_deref(), Some("2.5"));
    assert_eq!(collapse_r_number(0.0).as_deref(), Some("0"));
    assert_eq!(collapse_r_number(1e21), None);
    assert_eq!(collapse_r_number(5e-7), None);
    assert_eq!(collapse_r_number(f64::INFINITY), None);
    assert_eq!(
        collapse_r_number(1e19).as_deref(),
        Some("9223372036854775807")
    );
}

#[test]
fn ascii_fold_leaves_non_ascii_unfolded() {
    assert_eq!(ascii_lower("SOLID"), "solid");
    assert_eq!(ascii_lower("İ"), "İ");
    assert_eq!(ascii_lower("ß"), "ß");
    assert_eq!(ascii_lower("Σς"), "Σς");
}

#[test]
fn sanitize_maps_three_chars_only() {
    assert_eq!(sanitize_value("a b\tc\nd"), "a_b_c_d");
    assert_eq!(sanitize_value("a\rb"), "a\rb");
    assert_eq!(sanitize_value("a\u{a0}b"), "a\u{a0}b");
    assert_eq!(sanitize_value("a\u{85}b"), "a\u{85}b");
    assert_eq!(sanitize_value("\"a\rb\""), "\"a\rb\"");
}
