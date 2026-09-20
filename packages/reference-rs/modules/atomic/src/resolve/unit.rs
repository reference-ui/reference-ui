//! Unit policy and numeric canonicalization for atomic values (ATM-UNIT-01, ATM-UNIT-02).
//! Ensures consistent CSS dimension units (px suffix) on dimensional properties.
//! Unitless properties and zero stay bare numbers.
//! Finite numeric spellings (`'1e3'`, `'.5'`, `'01'`) canonicalize to the
//! numeric atom and dedupe with the bare number; hex, binary, octal,
//! `Infinity`, and `NaN` spellings refuse with diagnostics.

use crate::atom::{AtomValue, CssValue};
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation};

/// Canonicalize a finite numeric spelling to the bare-number form (`'1e3'`
/// → `"1000"`, `'.5'` → `"0.5"`, `'01'` → `"1"`), or None when the string
/// is not a finite number. Rust `f64` parsing is the fence: hex, binary,
/// octal, empty, and unit-suffixed strings never parse, exactly like v2's
/// `trimmed.parse::<f64>()`; non-finite results refuse. Rendering matches
/// the bare-literal path (`to_string`), so dedupe is structural.
pub fn canonical_numeric_string(s: &str) -> Option<String> {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return None;
    }
    let parsed: f64 = trimmed.parse().ok()?;
    if !parsed.is_finite() {
        return None;
    }
    Some(parsed.to_string())
}

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

fn from_number(
    prop: &str,
    n: Box<str>,
    location: &DiagnosticLocation,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<CssValue> {
    if is_non_canonical_numeric(&n) {
        diagnostics.push(location.warning(
            DiagnosticCode::NonCanonicalNumeric,
            format!("Non-canonical numeric value \"{n}\" on `{prop}`"),
        ));
        return None;
    }
    Some(resolve_numeric_value(prop, &n))
}

fn from_string(
    prop: &str,
    s: Box<str>,
    location: &DiagnosticLocation,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<CssValue> {
    // SPEC-V2-14: structural runs collapse before anything else reads the
    // string, so spaced twins share one numeric parse and one atom.
    let collapsed: Box<str> = super::normalize::collapse_whitespace(&s).into_boxed_str();
    // Finite numeric spellings canonicalize to the numeric atom (SPEC-V2-79).
    if let Some(canonical) = canonical_numeric_string(&collapsed) {
        if accepts_bare_number(prop) {
            return Some(resolve_numeric_value(prop, &canonical));
        }
    }
    legacy_string_value(prop, collapsed, location, diagnostics)
}

/// True when a bare number is a valid value: every prop except colors, where
/// numbers never paint, plus the font shorthands whose strings must survive.
fn accepts_bare_number(prop: &str) -> bool {
    !canon::is_color_prop(prop) && prop != "font" && prop != "fontFamily"
}

/// The pre-79 string path: non-canonical spellings refuse, canonical numbers
/// resolve off color props, and everything else passes through as a string.
fn legacy_string_value(
    prop: &str,
    s: Box<str>,
    location: &DiagnosticLocation,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<CssValue> {
    // Empty-after-trim strings are never CSS (`margin: ;` is invalid);
    // refuse with a diagnostic instead of emitting the empty declaration.
    if s.trim().is_empty() {
        diagnostics.push(location.warning(
            DiagnosticCode::InvalidCssValue,
            format!("Empty string value on `{prop}`"),
        ));
        return None;
    }
    if is_non_canonical_numeric(&s) {
        diagnostics.push(location.warning(
            DiagnosticCode::NonCanonicalNumeric,
            format!("Non-canonical numeric value \"{s}\" on `{prop}`"),
        ));
        return None;
    }
    if let Some(num) = parse_canonical_number(&s) {
        if accepts_bare_number(prop) {
            return Some(resolve_numeric_value(prop, num));
        }
    }
    Some(CssValue::String(s))
}

/// Lower an authored AtomValue into an intermediate CssValue, enforcing unit and numeric canonicalization.
/// Refusal warnings carry the want's location when the want was authored in source.
pub fn css_value_from_authored(
    prop: &str,
    val: AtomValue,
    location: &DiagnosticLocation,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<CssValue> {
    match val {
        // A null leaf (`const n = null`) is a hole, not CSS: strip it
        // silently, exactly like a literal null the walk omits.
        AtomValue::Null => None,
        AtomValue::Bool(_) => {
            diagnostics.push(location.warning(
                DiagnosticCode::InvalidCssValue,
                format!("`{prop}` value `{val}` is not valid CSS"),
            ));
            None
        }
        AtomValue::Number(n) => from_number(prop, n, location, diagnostics),
        AtomValue::String(s) => from_string(prop, s, location, diagnostics),
        AtomValue::Token { path, value } => Some(CssValue::Token { path, value }),
    }
}
