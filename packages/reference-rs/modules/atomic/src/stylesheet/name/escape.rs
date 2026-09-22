//! CSS identifier escaping for generated atomic class selectors.
//! Takes a runtime class string and emits the stylesheet spelling. Characters in
//! `[A-Za-z0-9_-]` pass through except a leading digit or leading `-`, which are
//! hex-escaped with a terminating space so the identifier is valid CSS.
//! Every other character is backslash-escaped. The HTML/runtime class is unchanged;
//! only the selector spelling differs.

use std::fmt::Write;

use crate::resolve::lexical::sanitize_char;

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
        self.push_inner(out, val, false);
    }

    /// Push one char escaped at the current position.
    pub fn push_char(&mut self, out: &mut String, ch: char) {
        append_escaped(out, ch, self.index);
        self.index += 1;
    }

    /// Push `val` through the L6 sanitize rule, escaped per char.
    pub fn push_sanitized(&mut self, out: &mut String, val: &str) {
        self.push_inner(out, val, true);
    }

    /// Identifier chars consumed so far. Only index 0 takes the leading rule.
    pub fn position(&self) -> usize {
        self.index
    }

    /// Advance past `count` already-escaped identifier chars. The replayed
    /// bytes must equal what pushing those chars would have emitted.
    pub fn advance(&mut self, count: usize) {
        self.index += count;
    }

    /// Push `val`, scanning ident-body runs past the leading char.
    ///
    /// The leading-char rule keys off index 0 only, so the first char of a
    /// fresh cursor keeps the slow path and the rest moves in `push_str`
    /// runs. Sanitized whitespace maps to `_` (itself ident-body); escape
    /// takes and non-ASCII chars keep the per-char rule. Same bytes out.
    fn push_inner(&mut self, out: &mut String, val: &str, sanitize: bool) {
        let mut rest = val;
        if self.index == 0 {
            let Some(first) = rest.chars().next() else {
                return;
            };
            self.push_first(out, first, sanitize);
            rest = &rest[first.len_utf8()..];
        }
        self.push_runs(out, rest, sanitize);
    }

    /// Push the identifier's first char through the leading-char rule.
    fn push_first(&mut self, out: &mut String, first: char, sanitize: bool) {
        let clean = if sanitize {
            sanitize_char(first)
        } else {
            first
        };
        self.push_char(out, clean);
    }

    /// Push `rest` (cursor past index 0) as ident-body runs plus slow takes.
    fn push_runs(&mut self, out: &mut String, rest: &str, sanitize: bool) {
        let bytes = rest.as_bytes();
        let mut pos = 0;
        while pos < bytes.len() {
            if is_ident_byte(bytes[pos]) {
                pos = self.push_ident_run(out, rest, pos);
            } else if sanitize && is_sanitized_space(bytes[pos]) {
                out.push('_');
                self.index += 1;
                pos += 1;
            } else {
                pos = self.push_take(out, rest, pos, sanitize);
            }
        }
    }

    /// Push one escape take or non-ASCII char, returning the byte past it.
    fn push_take(&mut self, out: &mut String, rest: &str, pos: usize, sanitize: bool) -> usize {
        let Some(take) = rest[pos..].chars().next() else {
            return rest.len();
        };
        let clean = if sanitize { sanitize_char(take) } else { take };
        self.push_char(out, clean);
        pos + take.len_utf8()
    }

    /// Push the ident-body run at `pos`, returning the first byte past it.
    fn push_ident_run(&mut self, out: &mut String, rest: &str, pos: usize) -> usize {
        let bytes = rest.as_bytes();
        let mut end = pos + 1;
        while end < bytes.len() && is_ident_byte(bytes[end]) {
            end += 1;
        }
        out.push_str(&rest[pos..end]);
        self.index += end - pos;
        end
    }
}

/// True for bytes that pass the identifier rule through raw.
fn is_ident_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-'
}

/// True for bytes the L6 rule maps to `_`.
fn is_sanitized_space(byte: u8) -> bool {
    byte == b' ' || byte == b'\t' || byte == b'\n'
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
    fn test_cursor_runs_match_char_path_across_pushes() {
        let mut out = String::new();
        let mut cursor = EscapeCursor::new();
        cursor.push(&mut out, "");
        cursor.push(&mut out, "2xl:p_6r");
        assert_eq!(out, "\\32 xl\\:p_6r");

        let mut out = String::new();
        let mut cursor = EscapeCursor::new();
        cursor.push(&mut out, "mt_");
        cursor.push_sanitized(&mut out, "10px 20px");
        assert_eq!(out, "mt_10px_20px");

        let mut out = String::new();
        let mut cursor = EscapeCursor::new();
        cursor.push_sanitized(&mut out, "10px 20px");
        assert_eq!(out, "\\31 0px_20px");

        let mut out = String::new();
        let mut cursor = EscapeCursor::new();
        cursor.push_sanitized(&mut out, " a");
        assert_eq!(out, "_a");

        let mut out = String::new();
        let mut cursor = EscapeCursor::new();
        cursor.push(&mut out, "w_");
        cursor.push(&mut out, "é");
        assert_eq!(out, "w_\\é");
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
