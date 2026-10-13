//! Reads literal `TypeRef` values into the classes the evaluator compares exactly. Extraction keeps
//! literals as raw source text (`'x'`, `"x"`, `1.5`, `true`, `2n`), so this module strips the quotes
//! and classifies the number, boolean and bigint spellings. Escapes, hex and octal forms, numeric
//! separators and any other shape classify as opaque, and every caller that needs an exact value
//! treats opaque as a reason to fail closed.

/// A literal's value class. Strings keep their unescaped body, numbers their parsed value.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) enum LiteralValue<'a> {
    Str(&'a str),
    Num(f64),
    Bool(bool),
    BigInt(&'a str),
    Opaque,
}

impl LiteralValue<'_> {
    /// The primitive a literal of this class widens to (`'x'` widens to `string`).
    pub(crate) fn family(&self) -> Option<&'static str> {
        match self {
            LiteralValue::Str(_) => Some("string"),
            LiteralValue::Num(_) => Some("number"),
            LiteralValue::Bool(_) => Some("boolean"),
            LiteralValue::BigInt(_) => Some("bigint"),
            LiteralValue::Opaque => None,
        }
    }
}

/// Classifies the source text of one literal type.
pub(crate) fn classify(text: &str) -> LiteralValue<'_> {
    let text = text.trim();
    string_body(text)
        .map(LiteralValue::Str)
        .or_else(|| keyword_value(text))
        .or_else(|| is_bigint_text(text).then_some(LiteralValue::BigInt(text)))
        .or_else(|| decimal_value(text).map(LiteralValue::Num))
        .unwrap_or(LiteralValue::Opaque)
}

/// The body of a quoted string literal. A body with a backslash needs escape decoding, so it is
/// not returned.
pub(crate) fn string_body(text: &str) -> Option<&str> {
    let text = text.trim();
    let quote = text.chars().next()?;
    if !matches!(quote, '\'' | '"' | '`') || text.len() < 2 || !text.ends_with(quote) {
        return None;
    }
    let body = &text[1..text.len() - 1];
    (!body.contains('\\')).then_some(body)
}

/// Canonical base-10 integer text (`0`, `7`, `-3`). Only this spelling names the same property key
/// and the same template fragment as the number it denotes.
pub(crate) fn canonical_integer(text: &str) -> Option<&str> {
    let text = text.trim();
    let digits = text.strip_prefix('-').unwrap_or(text);
    let canonical = match digits.as_bytes() {
        [b'0'] => true,
        [b'1'..=b'9', rest @ ..] => rest.iter().all(u8::is_ascii_digit),
        _ => false,
    };
    (canonical && text != "-0").then_some(text)
}

/// The text a literal contributes to a template literal: a string body, a boolean spelling, or a
/// canonical integer. Other numbers spell differently in JavaScript, so they fail closed.
pub(crate) fn fragment_text(text: &str) -> Option<String> {
    if let Some(body) = string_body(text) {
        return Some(body.to_string());
    }
    match classify(text) {
        LiteralValue::Bool(_) => Some(text.trim().to_string()),
        _ => canonical_integer(text).map(str::to_string),
    }
}

/// The property name a literal index denotes: a string body or a canonical integer.
pub(crate) fn property_key_text(text: &str) -> Option<String> {
    string_body(text)
        .or_else(|| canonical_integer(text))
        .map(str::to_string)
}

/// A tuple position written as a canonical, non-negative integer literal.
pub(crate) fn index_position(text: &str) -> Option<usize> {
    let digits = string_body(text).unwrap_or(text);
    canonical_integer(digits)
        .filter(|digits| !digits.starts_with('-'))?
        .parse::<usize>()
        .ok()
}

fn keyword_value(text: &str) -> Option<LiteralValue<'static>> {
    match text {
        "true" => Some(LiteralValue::Bool(true)),
        "false" => Some(LiteralValue::Bool(false)),
        _ => None,
    }
}

fn decimal_value(text: &str) -> Option<f64> {
    let starts_ok = text.starts_with(|c: char| c.is_ascii_digit() || c == '-');
    let bytes_ok = text
        .bytes()
        .all(|b| b.is_ascii_digit() || matches!(b, b'-' | b'+' | b'.' | b'e' | b'E'));
    if !starts_ok || !bytes_ok {
        return None;
    }
    text.parse::<f64>().ok().filter(|value| value.is_finite())
}

fn is_bigint_text(text: &str) -> bool {
    let Some(digits) = text.strip_suffix('n') else {
        return false;
    };
    let digits = digits.strip_prefix('-').unwrap_or(digits);
    !digits.is_empty() && digits.bytes().all(|b| b.is_ascii_digit())
}
