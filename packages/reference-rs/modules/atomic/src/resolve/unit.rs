//! Unit policy and numeric canonicalization for atomic values (ATM-UNIT-01, ATM-UNIT-02).
//! Ensures consistent CSS dimension units (px suffix) on dimensional properties.
//! Unitless properties and zero stay bare numbers.
//! Rejects non-canonical numeric spellings (octal, hex, binary, Infinity, NaN) with diagnostics.

use crate::atom::{AtomValue, CssValue};
use crate::diagnostics::Diagnostic;

/// Check if a string represents an illegal non-canonical numeric format.
pub fn is_non_canonical_numeric(s: &str) -> bool {
    if s == "Infinity" || s == "-Infinity" || s == "NaN" {
        return true;
    }
    if s.starts_with("0x") || s.starts_with("0X") || s.starts_with("0b") || s.starts_with("0o") {
        return true;
    }
    let check = s.strip_prefix('-').unwrap_or(s);
    check.len() > 1 && check.starts_with('0') && check.as_bytes()[1].is_ascii_digit()
}

/// Parse a canonical base-10 integer or decimal number string without leading zeros.
pub fn parse_canonical_number(s: &str) -> Option<&str> {
    if is_non_canonical_numeric(s) {
        return None;
    }
    let rest = s.strip_prefix('-').unwrap_or(s);
    if rest.is_empty() {
        return None;
    }
    validate_digits_and_dots(rest)?;
    let int_part = rest.split_once('.').map_or(rest, |(ip, _)| ip);
    if int_part.len() > 1 && int_part.starts_with('0') {
        return None;
    }
    Some(s)
}

fn validate_digits_and_dots(rest: &str) -> Option<()> {
    let mut has_dot = false;
    let mut digit_count = 0;
    for &b in rest.as_bytes() {
        if b.is_ascii_digit() {
            digit_count += 1;
        } else if b == b'.' && !has_dot {
            has_dot = true;
        } else {
            return None;
        }
    }
    if digit_count > 0 {
        Some(())
    } else {
        None
    }
}

/// Convert a canonical numeric string into a unitless or dimensional CssValue.
pub fn resolve_numeric_value(prop: &str, num_str: &str) -> CssValue {
    if num_str == "0" || num_str == "-0" {
        CssValue::Number("0".into())
    } else if canon::is_unitless_prop(prop) {
        CssValue::Number(num_str.into())
    } else {
        CssValue::Dimension {
            class_stem: num_str.into(),
            css_val: format!("{num_str}px").into_boxed_str(),
        }
    }
}

fn from_number(prop: &str, n: Box<str>, diagnostics: &mut Vec<Diagnostic>) -> Option<CssValue> {
    if is_non_canonical_numeric(&n) {
        diagnostics.push(Diagnostic::warning(format!(
            "Non-canonical numeric value \"{n}\" on `{prop}`"
        )));
        return None;
    }
    Some(resolve_numeric_value(prop, &n))
}

fn from_string(prop: &str, s: Box<str>, diagnostics: &mut Vec<Diagnostic>) -> Option<CssValue> {
    if is_non_canonical_numeric(&s) {
        diagnostics.push(Diagnostic::warning(format!(
            "Non-canonical numeric value \"{s}\" on `{prop}`"
        )));
        return None;
    }
    if let Some(num) = parse_canonical_number(&s) {
        if !canon::is_color_prop(prop) && prop != "font" && prop != "fontFamily" {
            return Some(resolve_numeric_value(prop, num));
        }
    }
    Some(CssValue::String(s))
}

/// Lower an authored AtomValue into an intermediate CssValue, enforcing unit and numeric canonicalization.
pub fn css_value_from_authored(
    prop: &str,
    val: AtomValue,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<CssValue> {
    match val {
        AtomValue::Bool(_) | AtomValue::Null => {
            diagnostics.push(Diagnostic::warning(format!(
                "`{prop}` value `{val}` is not valid CSS"
            )));
            None
        }
        AtomValue::Number(n) => from_number(prop, n, diagnostics),
        AtomValue::String(s) => from_string(prop, s, diagnostics),
        AtomValue::Token { path, value } => Some(CssValue::Token { path, value }),
    }
}
