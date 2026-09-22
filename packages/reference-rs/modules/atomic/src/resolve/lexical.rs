//! Explicit lexical functions for the compiler namer's class-stem path.
//!
//! Every text or number operation a class stem passes through lives here as a
//! named function with pinned semantics, never as a host `std` default the
//! other implementation would inherit differently. The six functions cover the
//! structural whitespace set (L1), structural trimming (L2), explicit decimal
//! parsing with finite-gated and ungated entries (L3), canonical decimal
//! rendering with the magnitude fence and the `$r` collapse wrapper (L4),
//! ASCII-only case folding (L5), and the three-character sanitize map (L6).

/// L1: the 25-point structural whitespace set (`White_Space`, no U+FEFF).
pub fn is_structural_whitespace(ch: char) -> bool {
    matches!(
        ch,
        '\u{9}'..='\u{d}'
            | '\u{20}'
            | '\u{85}'
            | '\u{a0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200a}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202f}'
            | '\u{205f}'
            | '\u{3000}'
    )
}

/// L2: strip L1 from both ends. Identical to `str::trim` by construction.
pub fn trim_structural(text: &str) -> &str {
    text.trim_matches(is_structural_whitespace)
}

/// L3: one decimal grammar accepted by `str::parse::<f64>`, made explicit.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DecimalValue {
    value: f64,
}

impl DecimalValue {
    /// The parsed value, finite or not.
    pub fn value(self) -> f64 {
        self.value
    }

    /// The value when finite: the unit-site entry. The parser site uses the
    /// ungated `parse_decimal` result, so `inf` classifies but never stems.
    pub fn finite(self) -> Option<f64> {
        self.value.is_finite().then_some(self.value)
    }
}

/// L3: optional sign, then ASCII `inf`/`infinity`/`nan` or a decimal mantissa
/// with optional exponent. No underscores, no radix, no surrounding space:
/// callers trim first. Values come from `parse::<f64>` over grammar-accepted
/// input, so rendering can never disagree with the previous bare parse.
pub fn parse_decimal(text: &str) -> Option<DecimalValue> {
    let rest = text
        .strip_prefix('+')
        .or_else(|| text.strip_prefix('-'))
        .unwrap_or(text);
    if rest.is_empty() {
        return None;
    }
    if is_named_non_finite(rest) || has_decimal_mantissa(rest) {
        return text.parse::<f64>().ok().map(|value| DecimalValue { value });
    }
    None
}

/// True for ASCII case-insensitive `inf`, `infinity`, or `nan`.
fn is_named_non_finite(rest: &str) -> bool {
    rest.eq_ignore_ascii_case("inf")
        || rest.eq_ignore_ascii_case("infinity")
        || rest.eq_ignore_ascii_case("nan")
}

/// True for `digits[.digits]` or `.digits` with an optional exponent.
fn has_decimal_mantissa(rest: &str) -> bool {
    let mut scan = MantissaScan::new(rest);
    let mut digits = scan.take_digits();
    if scan.take_dot() {
        digits += scan.take_digits();
    }
    if digits == 0 || !scan.take_exponent() {
        return false;
    }
    scan.at_end()
}

/// Cursor over the unsigned body of a decimal spelling.
struct MantissaScan<'a> {
    bytes: &'a [u8],
    index: usize,
}

impl<'a> MantissaScan<'a> {
    fn new(rest: &'a str) -> Self {
        Self {
            bytes: rest.as_bytes(),
            index: 0,
        }
    }

    /// Consume one ASCII digit run, returning its length.
    fn take_digits(&mut self) -> usize {
        let start = self.index;
        while self.index < self.bytes.len() && self.bytes[self.index].is_ascii_digit() {
            self.index += 1;
        }
        self.index - start
    }

    /// Consume one fraction dot when present.
    fn take_dot(&mut self) -> bool {
        self.take_byte(b'.')
    }

    /// Consume an optional exponent: true when absent or well-formed.
    fn take_exponent(&mut self) -> bool {
        if !self.take_byte(b'e') && !self.take_byte(b'E') {
            return true;
        }
        if !self.take_byte(b'+') {
            self.take_byte(b'-');
        }
        self.take_digits() > 0
    }

    /// Consume one expected byte when present.
    fn take_byte(&mut self, want: u8) -> bool {
        if self.index < self.bytes.len() && self.bytes[self.index] == want {
            self.index += 1;
            return true;
        }
        false
    }

    /// True when the cursor reached the end of the spelling.
    fn at_end(&self) -> bool {
        self.index == self.bytes.len()
    }
}

/// Smallest magnitude that keeps its plain spelling: `String(1e-6)` is plain.
const MIN_CANONICAL_MAGNITUDE: f64 = 1e-6;
/// First magnitude that renders with an exponent: `String(1e21)` is `1e+21`.
const MAX_CANONICAL_MAGNITUDE: f64 = 1e21;

/// L4 helper: the canonical-magnitude fence. Zero always mints; finite values
/// with `1e-6 <= |v| < 1e21` render; everything else refuses upstream.
pub fn in_canonical_magnitude(value: f64) -> bool {
    value == 0.0
        || (value.abs() >= MIN_CANONICAL_MAGNITUDE && value.abs() < MAX_CANONICAL_MAGNITUDE)
}

/// L4: shortest round-trip, never exponent, `-0` folds to `0`. Callers fence
/// first; rendering itself is total so goldens stay a pure function.
pub fn render_decimal(value: f64) -> String {
    if value == 0.0 {
        "0".to_string()
    } else {
        value.to_string()
    }
}

/// Epsilon below which an `$r` multiplier collapses to its integer rendering.
const R_INTEGER_EPSILON: f64 = 1e-6;

/// L4 wrapper: fence an `$r` multiplier, collapse near-integers with the 1e-6
/// epsilon, else render. The integer cast truncates toward zero and saturates
/// at the `i64` boundary, exactly like the `f as i64` it replaces. None means
/// the multiplier refuses: non-finite or outside the canonical magnitude.
pub fn collapse_r_number(factor: f64) -> Option<String> {
    if !factor.is_finite() || !in_canonical_magnitude(factor) {
        return None;
    }
    if (factor - factor.round()).abs() < R_INTEGER_EPSILON {
        Some((factor as i64).to_string())
    } else {
        Some(render_decimal(factor))
    }
}

/// L5: ASCII-only lowercase. Non-ASCII passes through unfolded.
pub fn ascii_lower(text: &str) -> String {
    text.to_ascii_lowercase()
}

/// L6: map exactly space, tab, and newline to `_`; every other char survives,
/// including `\r`, NBSP, and U+0085 left inside quoted substrings.
pub fn sanitize_value(val: &str) -> String {
    let mut out = String::with_capacity(val.len());
    for ch in val.chars() {
        out.push(sanitize_char(ch));
    }
    out
}

/// One char through the L6 rule. Single owner; the escaped emitter shares it.
pub fn sanitize_char(ch: char) -> char {
    match ch {
        ' ' | '\t' | '\n' => '_',
        _ => ch,
    }
}

#[cfg(test)]
mod tests {
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
}
