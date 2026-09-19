//! CSS function recognizers: color, math, transform, and misc calls.
//!
//! A value is a function when the whole string is one `name(...)` call with
//! balanced parentheses (quotes honored) and a known name. Matching is
//! case-insensitive per CSS. Token paths never contain parens, so anything
//! recognized here is CSS, never a dictionary question.

/// The CSS family a recognized function belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FunctionKind {
    Color,
    Math,
    Transform,
    Url,
    Opaque,
}

/// Color functions, sorted for binary search.
const COLOR_FUNCTIONS: &[&str] = &[
    "color",
    "color-mix",
    "hsl",
    "hsla",
    "hwb",
    "lab",
    "lch",
    "light-dark",
    "oklab",
    "oklch",
    "rgb",
    "rgba",
];

/// Math functions, sorted for binary search.
const MATH_FUNCTIONS: &[&str] = &["calc", "clamp", "max", "min"];

/// Transform functions, sorted for binary search.
const TRANSFORM_FUNCTIONS: &[&str] = &[
    "matrix",
    "matrix3d",
    "perspective",
    "rotate",
    "rotate3d",
    "rotatex",
    "rotatey",
    "rotatez",
    "scale",
    "scale3d",
    "scalex",
    "scaley",
    "scalez",
    "skew",
    "skewx",
    "skewy",
    "translate",
    "translate3d",
    "translatex",
    "translatey",
    "translatez",
];

/// Resource functions, sorted for binary search.
const URL_FUNCTIONS: &[&str] = &["url"];

/// Runtime-resolved references (`var()` consults custom properties, `env()`
/// the user agent), sorted for binary search.
const OPAQUE_FUNCTIONS: &[&str] = &["env", "var"];

/// The function family when `value` is one complete known call, else None.
pub fn classify_function(value: &str) -> Option<FunctionKind> {
    let (name, body) = split_call(value.trim())?;
    let kind = function_kind(&name.to_ascii_lowercase())?;
    if single_balanced_call(body) {
        Some(kind)
    } else {
        None
    }
}

/// The `name` and `(...)` body of a call, or None for non-call shapes.
fn split_call(value: &str) -> Option<(&str, &str)> {
    let open = value.find('(')?;
    let name = &value[..open];
    if name.is_empty() || !name.bytes().all(is_name_byte) {
        return None;
    }
    Some((name, &value[open..]))
}

/// True for bytes allowed in a CSS function name.
fn is_name_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_'
}

/// The family of a lowercase function name, or None when unknown.
fn function_kind(lower_name: &str) -> Option<FunctionKind> {
    if COLOR_FUNCTIONS.binary_search(&lower_name).is_ok() {
        return Some(FunctionKind::Color);
    }
    if MATH_FUNCTIONS.binary_search(&lower_name).is_ok() {
        return Some(FunctionKind::Math);
    }
    if TRANSFORM_FUNCTIONS.binary_search(&lower_name).is_ok() {
        return Some(FunctionKind::Transform);
    }
    if URL_FUNCTIONS.binary_search(&lower_name).is_ok() {
        return Some(FunctionKind::Url);
    }
    if OPAQUE_FUNCTIONS.binary_search(&lower_name).is_ok() {
        return Some(FunctionKind::Opaque);
    }
    None
}

/// True when `body` is exactly one balanced `(...)` group, quotes honored.
/// The group must close on its final byte, so two concatenated calls refuse.
fn single_balanced_call(body: &str) -> bool {
    let bytes = body.as_bytes();
    if bytes.first() != Some(&b'(') || bytes.last() != Some(&b')') {
        return false;
    }
    let mut depth = 0usize;
    let mut index = 0usize;
    while index < bytes.len() {
        match bytes[index] {
            b'\'' | b'"' => {
                index = skip_quoted(bytes, index);
            }
            b'(' => {
                depth += 1;
                index += 1;
            }
            b')' => {
                depth = depth.saturating_sub(1);
                index += 1;
                if depth == 0 && index < bytes.len() {
                    return false;
                }
            }
            _ => {
                index += 1;
            }
        }
    }
    depth == 0
}

/// The index after a quoted span starting at `start`, honoring escapes.
/// Runs to the end when the quote never closes, failing the balance check.
fn skip_quoted(bytes: &[u8], start: usize) -> usize {
    let quote = bytes[start];
    let mut index = start + 1;
    while index < bytes.len() {
        if bytes[index] == b'\\' {
            index += 2;
            continue;
        }
        index += 1;
        if bytes[index - 1] == quote {
            break;
        }
    }
    index
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tables_are_sorted_for_binary_search() {
        for table in [
            COLOR_FUNCTIONS,
            MATH_FUNCTIONS,
            TRANSFORM_FUNCTIONS,
            URL_FUNCTIONS,
            OPAQUE_FUNCTIONS,
        ] {
            let mut sorted = table.to_vec();
            sorted.sort_unstable();
            assert_eq!(sorted, table);
        }
    }

    #[test]
    fn mission_examples_classify() {
        use FunctionKind::{Color, Math, Opaque, Transform, Url};
        assert_eq!(classify_function("rgba(0,0,0,0.5)"), Some(Color));
        assert_eq!(classify_function("translateX(1.25rem)"), Some(Transform));
        assert_eq!(
            classify_function("color-mix(in srgb, red 50%, blue)"),
            Some(Color)
        );
        assert_eq!(classify_function("calc(1px + 2px)"), Some(Math));
        assert_eq!(classify_function("url(/img.png)"), Some(Url));
        assert_eq!(classify_function("oklch(0.7 0.1 180)"), Some(Color));
        assert_eq!(classify_function("var(--brand)"), Some(Opaque));
    }

    #[test]
    fn names_are_case_insensitive() {
        assert_eq!(
            classify_function("RGBA(0,0,0,0.5)"),
            Some(FunctionKind::Color)
        );
        assert_eq!(
            classify_function("TranslateX(2px)"),
            Some(FunctionKind::Transform)
        );
    }

    #[test]
    fn unbalanced_or_partial_calls_refuse() {
        assert_eq!(classify_function("rgba(0,0,0,0.5"), None);
        assert_eq!(classify_function("rgba((0,0,0,0.5)"), None);
        assert_eq!(classify_function("translateX(1px)translateY(2px)"), None);
        assert_eq!(classify_function("notafn(1px)"), None);
        assert_eq!(classify_function("red"), None);
        assert_eq!(classify_function(""), None);
    }

    #[test]
    fn quoted_parens_do_not_break_balance() {
        assert_eq!(classify_function("url(\"a)b\")"), Some(FunctionKind::Url));
        assert_eq!(classify_function("url('a(b')"), Some(FunctionKind::Url));
    }
}
