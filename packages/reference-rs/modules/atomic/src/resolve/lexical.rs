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
mod tests;
