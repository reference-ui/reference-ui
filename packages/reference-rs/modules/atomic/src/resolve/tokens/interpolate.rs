//! `{category.path}` interpolation inside composite authored values.
//!
//! Whole-value braces are stripped before lookup; this pass expands token
//! references embedded in multi-token strings (`1px solid {colors.gray.800}`).
//! Each resolved segment becomes `var(--…)` while surrounding literals stay
//! verbatim. Unknown paths and unterminated braces stay raw and warn.

use base_system::BaseSystem;

use crate::diagnostics::Diagnostic;

/// Expand embedded `{path}` segments, or None when the value holds no braces.
pub fn expand_brace_segments(
    unbraced: &str,
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<String> {
    if !unbraced.contains('{') {
        return None;
    }
    let mut out = String::with_capacity(unbraced.len() + 16);
    let mut rest = unbraced;
    {
        let mut expander = SegmentExpander {
            out: &mut out,
            source: unbraced,
            system,
            diagnostics,
        };
        while let Some(open) = rest.find('{') {
            expander.push_literal(&rest[..open]);
            rest = expander.expand_open(rest, open);
        }
        expander.push_literal(rest);
    }
    Some(out)
}

/// Session for one brace-expansion pass over a composite value.
struct SegmentExpander<'a> {
    out: &'a mut String,
    source: &'a str,
    system: &'a BaseSystem,
    diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> SegmentExpander<'a> {
    fn push_literal(&mut self, literal: &str) {
        self.out.push_str(literal);
    }

    /// Expand the segment opened at `open`, returning the unprocessed remainder.
    fn expand_open(&mut self, rest: &'a str, open: usize) -> &'a str {
        let after = &rest[open + 1..];
        let Some(close) = after.find('}') else {
            self.diagnostics.push(Diagnostic::warning(format!(
                "unterminated `{{` in value `{}`",
                self.source
            )));
            self.out.push_str(&rest[open..]);
            return "";
        };
        let inner = after[..close].trim();
        match self.system.token(inner) {
            Some(entry) if !inner.is_empty() => {
                self.out.push_str(&format!("var({})", entry.css_var()));
            }
            _ => {
                self.keep_raw_segment(rest, open, close, inner);
            }
        }
        &after[close + 1..]
    }

    /// Keep an unresolvable segment verbatim, warning unless it is empty.
    fn keep_raw_segment(&mut self, rest: &str, open: usize, close: usize, inner: &str) {
        if !inner.is_empty() {
            self.diagnostics.push(Diagnostic::warning(format!(
                "unknown token path `{{{inner}}}`"
            )));
        }
        self.out.push_str(&rest[open..open + 1 + close + 1]);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use base_system::TokenLeaf;

    fn test_system() -> BaseSystem {
        let mut system = BaseSystem::default();
        system.tokens.insert_leaf(TokenLeaf {
            category: "colors",
            path: "gray.800",
            light: "#1f2937",
            dark: "#f9fafb",
        });
        system
    }

    fn expand(raw: &str) -> (Option<String>, Vec<Diagnostic>) {
        let system = test_system();
        let mut diagnostics = Vec::new();
        let out = expand_brace_segments(raw, &system, &mut diagnostics);
        (out, diagnostics)
    }

    #[test]
    fn composite_value_expands_segment_and_keeps_literals() {
        let (out, diagnostics) = expand("1px solid {colors.gray.800}");
        assert_eq!(out.as_deref(), Some("1px solid var(--colors-gray-800)"));
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn unterminated_brace_stays_raw_and_warns() {
        let (out, diagnostics) = expand("1px solid {colors.gray.800");
        assert_eq!(out.as_deref(), Some("1px solid {colors.gray.800"));
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("unterminated"));
    }

    #[test]
    fn unknown_segment_stays_raw_and_warns() {
        let (out, diagnostics) = expand("0 1px 2px {colors.ghost}");
        assert_eq!(out.as_deref(), Some("0 1px 2px {colors.ghost}"));
        assert_eq!(diagnostics.len(), 1);
    }

    #[test]
    fn brace_free_values_are_untouched() {
        let (out, _) = expand("1px solid red");
        assert_eq!(out, None);
    }
}
