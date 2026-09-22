//! Unit policy and numeric canonicalization for atomic values (ATM-UNIT-01, ATM-UNIT-02).
//! Ensures consistent CSS dimension units (px suffix) on dimensional properties.
//! Unitless properties and zero stay bare numbers.
//! Finite numeric spellings (`'1e3'`, `'.5'`, `'01'`) canonicalize to the
//! numeric atom and dedupe with the bare number; hex, binary, octal,
//! `Infinity`, and `NaN` spellings refuse with diagnostics.
//! Refusals report typed value facts through the session and render byte-identical lines via policy.

use super::lexical;
use super::{want_key, ResolveSession};
use crate::atom::{AtomValue, CssValue};
use crate::diagnostics::{
    DeclarationDetail, DiagnosticCode, ResolveDetail, ResolveOutcome, ValueDetail,
};

/// Verdict of the canonical-number attempt shared by the string and bare paths.
enum CanonicalNumber {
    /// Not a finite decimal: the legacy path or verbatim stem decides.
    NotNumeric,
    /// Finite but outside the canonical magnitude: refuse upstream.
    FencedOut,
    /// Finite and in range: the canonical stem.
    Canonical(String),
}

/// Parse, gate, and render one numeric spelling through the lexical fence:
/// structural trim, explicit decimal grammar, finite-only, zero folds to
/// `"0"`, magnitudes outside `[1e-6, 1e21)` refuse, else canonical render.
fn canonical_number(text: &str) -> CanonicalNumber {
    let trimmed = lexical::trim_structural(text);
    if trimmed.is_empty() {
        return CanonicalNumber::NotNumeric;
    }
    let Some(value) = lexical::parse_decimal(trimmed).and_then(|d| d.finite()) else {
        return CanonicalNumber::NotNumeric;
    };
    if value == 0.0 {
        return CanonicalNumber::Canonical("0".to_string());
    }
    if !lexical::in_canonical_magnitude(value) {
        return CanonicalNumber::FencedOut;
    }
    CanonicalNumber::Canonical(lexical::render_decimal(value))
}

/// Canonicalize a finite numeric spelling to the bare-number form (`'1e3'`
/// → `"1000"`, `'.5'` → `"0.5"`, `'01'` → `"1"`), or None when the string
/// is not a finite number or falls outside the canonical magnitude. The
/// explicit decimal grammar is the fence: hex, binary, octal, empty, and
/// unit-suffixed strings never parse; non-finite results are not numeric.
/// Rendering matches the bare-literal path, so dedupe is structural.
pub fn canonical_numeric_string(s: &str) -> Option<String> {
    match canonical_number(s) {
        CanonicalNumber::Canonical(stem) => Some(stem),
        CanonicalNumber::NotNumeric | CanonicalNumber::FencedOut => None,
    }
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
            css_val: {
                let mut s = String::with_capacity(num_str.len() + 2);
                s.push_str(num_str);
                s.push_str("px");
                s.into_boxed_str()
            },
        }
    }
}

/// Refuse one non-canonical numeric spelling with its want key attached.
fn refuse_non_canonical_number(
    prop: &str,
    spelling: Box<str>,
    session: &mut ResolveSession<'_, '_>,
) {
    let key = want_key(
        session,
        prop,
        serde_json::Value::String(spelling.to_string()),
    );
    session.emit(
        key,
        ResolveOutcome::Rejected {
            code: DiagnosticCode::NonCanonicalNumeric,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::NonCanonicalNumber {
                    prop: prop.into(),
                    spelling,
                },
            )),
        },
    );
}

fn from_number(prop: &str, n: Box<str>, session: &mut ResolveSession<'_, '_>) -> Option<CssValue> {
    if is_non_canonical_numeric(&n) {
        refuse_non_canonical_number(prop, n, session);
        return None;
    }
    // Bare entry spellings re-render through the canonical fence, so the
    // plan-JSON renderer agrees with the string path (`0.0` → `0`, `1e21`
    // refuses). Non-finite parses keep the verbatim stem.
    match canonical_number(&n) {
        CanonicalNumber::Canonical(stem) => Some(resolve_numeric_value(prop, &stem)),
        CanonicalNumber::FencedOut => {
            refuse_non_canonical_number(prop, n, session);
            None
        }
        CanonicalNumber::NotNumeric => Some(resolve_numeric_value(prop, &n)),
    }
}

fn from_string(prop: &str, s: Box<str>, session: &mut ResolveSession<'_, '_>) -> Option<CssValue> {
    // SPEC-V2-14: structural runs collapse before anything else reads the
    // string, so spaced twins share one numeric parse and one atom.
    let collapsed: Box<str> = super::normalize::collapse_boxed(s);
    // Finite numeric spellings canonicalize to the numeric atom (SPEC-V2-79).
    // The magnitude fence bites only where canonicalization applies: color
    // props keep their string passthrough for out-of-range spellings.
    match canonical_number(&collapsed) {
        CanonicalNumber::Canonical(stem) if accepts_bare_number(prop) => {
            Some(resolve_numeric_value(prop, &stem))
        }
        CanonicalNumber::FencedOut if accepts_bare_number(prop) => {
            let spelling = lexical::trim_structural(&collapsed)
                .to_string()
                .into_boxed_str();
            refuse_non_canonical_number(prop, spelling, session);
            None
        }
        _ => legacy_string_value(prop, collapsed, session),
    }
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
    session: &mut ResolveSession<'_, '_>,
) -> Option<CssValue> {
    // Empty-after-trim strings are never CSS (`margin: ;` is invalid);
    // refuse with a diagnostic instead of emitting the empty declaration.
    if lexical::trim_structural(&s).is_empty() {
        let key = want_key(session, prop, serde_json::Value::String(s.to_string()));
        session.emit(
            key,
            ResolveOutcome::Rejected {
                code: DiagnosticCode::InvalidCssValue,
                detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                    ValueDetail::EmptyString { prop: prop.into() },
                )),
            },
        );
        return None;
    }
    if is_non_canonical_numeric(&s) {
        refuse_non_canonical_number(prop, s.clone(), session);
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
    session: &mut ResolveSession<'_, '_>,
) -> Option<CssValue> {
    match val {
        // A null leaf (`const n = null`) is a hole, not CSS: strip it
        // silently, exactly like a literal null the walk omits.
        AtomValue::Null => None,
        // `b.to_string()` is the legacy `{val}` Display spelling.
        AtomValue::Bool(b) => {
            let key = want_key(session, prop, serde_json::Value::Bool(b));
            session.emit(
                key,
                ResolveOutcome::Rejected {
                    code: DiagnosticCode::InvalidCssValue,
                    detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                        ValueDetail::InvalidValue {
                            prop: prop.into(),
                            value: b.to_string().into(),
                        },
                    )),
                },
            );
            None
        }
        AtomValue::Number(n) => from_number(prop, n, session),
        AtomValue::String(s) => from_string(prop, s, session),
        AtomValue::Token { path, value } => Some(CssValue::Token { path, value }),
    }
}
