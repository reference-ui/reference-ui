//! Common text manipulation, span slicing, and AST utility functions shared across the compiler workspace.
//! Provides safe string unquoting, bounds-checked span slicing over source buffers, and character hygiene helpers.
//! Used across AST extraction passes and code generators to eliminate redundant string allocations.

use oxc_span::Span;

pub mod testing;

/// Slice a span from source text, safely clamped to bounds.
#[inline]
pub fn slice_span(source: &str, span: Span) -> &str {
    let start = span.start as usize;
    let end = span.end as usize;
    source.get(start..end).unwrap_or_default()
}

/// Unquote single or double quoted strings, returning the inner string.
pub fn unquote(raw: &str) -> String {
    let trimmed = raw.trim();
    if (trimmed.starts_with('\'') && trimmed.ends_with('\''))
        || (trimmed.starts_with('"') && trimmed.ends_with('"'))
        || (trimmed.starts_with('`') && trimmed.ends_with('`'))
    {
        if trimmed.len() >= 2 {
            trimmed[1..trimmed.len() - 1].to_string()
        } else {
            String::new()
        }
    } else {
        trimmed.to_string()
    }
}

/// Strip enclosing quotes from a string slice without allocating when possible.
#[inline]
pub fn unquote_str(raw: &str) -> &str {
    let trimmed = raw.trim();
    if (trimmed.starts_with('\'') && trimmed.ends_with('\''))
        || (trimmed.starts_with('"') && trimmed.ends_with('"'))
        || (trimmed.starts_with('`') && trimmed.ends_with('`'))
    {
        if trimmed.len() >= 2 {
            &trimmed[1..trimmed.len() - 1]
        } else {
            ""
        }
    } else {
        trimmed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_slice_span() {
        let text = "hello world";
        assert_eq!(slice_span(text, Span::new(0, 5)), "hello");
        assert_eq!(slice_span(text, Span::new(6, 11)), "world");
        assert_eq!(slice_span(text, Span::new(0, 50)), "");
    }

    #[test]
    fn test_slice_span_mid_char_end_clamps() {
        // 'é' is bytes 1..3; byte 2 splits it.
        assert_eq!(slice_span("héllo", Span::new(0, 2)), "");
    }

    #[test]
    fn test_slice_span_mid_char_start_clamps() {
        // Byte 2 is inside 'é' (bytes 1..3), so start 2 is mid-char.
        assert_eq!(slice_span("héllo", Span::new(2, 5)), "");
    }

    #[test]
    fn test_slice_span_boundary_start_slices() {
        // Byte 1 is the START of 'é' (a char boundary), not mid-char,
        // so (1,5) slices normally on both old and new code.
        assert_eq!(slice_span("héllo", Span::new(1, 5)), "éll");
    }

    #[test]
    fn test_unquote() {
        assert_eq!(unquote("'hello'"), "hello");
        assert_eq!(unquote("\"world\""), "world");
        assert_eq!(unquote("`template`"), "template");
        assert_eq!(unquote("unquoted"), "unquoted");
    }
}
