//! CSS identifier escaping for generated atomic class selectors.
//! Takes a runtime class string and emits the stylesheet spelling. Characters in
//! `[A-Za-z0-9_-]` pass through except a leading digit or leading `-`, which are
//! hex-escaped with a terminating space so the identifier is valid CSS.
//! Every other character is backslash-escaped. The HTML/runtime class is unchanged;
//! only the selector spelling differs.

use std::fmt::Write;

/// Sanitize value string for inclusion in HTML class names (converts whitespace to underscores).
pub fn sanitize_class_value(val: &str) -> String {
    crate::resolve::lexical::sanitize_value(val)
}

/// Escapes a runtime class name for use as a CSS identifier in a selector.
pub fn escape_css_selector(val: &str) -> String {
    let mut out = String::with_capacity(val.len() + 8);
    push_escaped_selector(&mut out, val);
    out
}

/// Escape `val` as a fresh identifier directly into `out`. No temporary.
pub fn push_escaped_selector(out: &mut String, val: &str) {
    EscapeCursor::new().push(out, val);
}

/// Positional escaper for identifiers pushed piece by piece.
///
/// The leading-char rule keys off the first char of the whole identifier, so
/// separately pushed segments share one cursor instead of joining a temporary.
#[derive(Default)]
pub struct EscapeCursor {
    index: usize,
}

impl EscapeCursor {
    pub fn new() -> Self {
        Self::default()
    }

    /// Push `val` escaped, advancing past its chars.
    pub fn push(&mut self, out: &mut String, val: &str) {
        for ch in val.chars() {
            self.push_char(out, ch);
        }
    }

    /// Push one char escaped at the current position.
    pub fn push_char(&mut self, out: &mut String, ch: char) {
        append_escaped(out, ch, self.index);
        self.index += 1;
    }

    /// Push `val` through the L6 sanitize rule, escaped per char.
    pub fn push_sanitized(&mut self, out: &mut String, val: &str) {
        for ch in val.chars() {
            self.push_char(out, crate::resolve::lexical::sanitize_char(ch));
        }
    }
}

fn append_escaped(out: &mut String, ch: char, index: usize) {
    if index == 0 && (ch.is_ascii_digit() || ch == '-') {
        push_hex_escape(out, ch);
        return;
    }
    if ch.is_control() {
        // Control chars have no `\X` escape: a backslash before CR is a line
        // continuation, and the raw byte breaks selector parsers. Hex-escape.
        push_hex_escape(out, ch);
        return;
    }
    if is_ident_body(ch) {
        out.push(ch);
        return;
    }
    out.push('\\');
    out.push(ch);
}

fn is_ident_body(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_' || ch == '-'
}

fn push_hex_escape(out: &mut String, ch: char) {
    let _ = write!(out, "\\{:x} ", u32::from(ch));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_class_value() {
        assert_eq!(sanitize_class_value("10px 20px"), "10px_20px");
        assert_eq!(sanitize_class_value("3px solid"), "3px_solid");
    }

    #[test]
    fn test_escape_css_selector() {
        assert_eq!(escape_css_selector("hover:mt_2r"), "hover\\:mt_2r");
        assert_eq!(escape_css_selector("p_1/2r"), "p_1\\/2r");
        assert_eq!(escape_css_selector("bg_blue.600"), "bg_blue\\.600");
        assert_eq!(escape_css_selector("mt_2r!"), "mt_2r\\!");
    }

    #[test]
    fn test_escape_leading_digit_hex_with_space() {
        assert_eq!(escape_css_selector("2xl:p_6r"), "\\32 xl\\:p_6r");
    }

    #[test]
    fn test_escape_control_chars_hex() {
        assert_eq!(
            escape_css_selector("content_\"a\rb\""),
            "content_\\\"a\\d b\\\""
        );
    }

    #[test]
    fn test_escape_leading_dash_hex() {
        assert_eq!(escape_css_selector("--brand-x_red"), "\\2d -brand-x_red");
        assert_eq!(escape_css_selector("-hover"), "\\2d hover");
    }

    #[test]
    fn test_escape_allowlist_star_and_punct() {
        assert_eq!(
            escape_css_selector("[&_>_*]:p_1r"),
            "\\[\\&_\\>_\\*\\]\\:p_1r"
        );
        assert_eq!(escape_css_selector("content_\"*\""), "content_\\\"\\*\\\"");
        assert_eq!(escape_css_selector("w_$"), "w_\\$");
        assert_eq!(escape_css_selector("w_^"), "w_\\^");
        assert_eq!(escape_css_selector("w_|"), "w_\\|");
    }
}
