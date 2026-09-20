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
    for (index, ch) in val.chars().enumerate() {
        append_escaped(&mut out, ch, index);
    }
    out
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
