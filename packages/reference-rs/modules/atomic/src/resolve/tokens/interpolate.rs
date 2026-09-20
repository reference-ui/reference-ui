//! `{category.path}` interpolation inside composite authored values.
//!
//! Whole-value braces are stripped before lookup; this pass expands token
//! references embedded in multi-token strings (`1px solid {colors.gray.800}`).
//! Each resolved segment becomes `var(--…)` while surrounding literals stay
//! verbatim. A segment that names no token errors and drops the whole atom;
//! unterminated braces stay raw and warn.

use crate::diagnostics::{DiagnosticCode, ResolveDetail, ResolveOutcome, TokenDetail};
use crate::resolve::{want_key, ResolveSession};

use super::{format_entry, split_opacity};

/// Outcome of expanding `{path}` segments inside a composite value.
pub enum BraceExpansion {
    /// The value holds no braces; the caller falls through to plain lookup.
    Absent,
    /// Every segment expanded; unterminated or empty segments kept raw.
    Expanded(String),
    /// A segment named no token; the error is pushed and the atom must drop.
    Missing,
}

/// Expand embedded `{path}` segments of a composite value.
pub fn expand_brace_segments(
    unbraced: &str,
    prop: &str,
    session: &mut ResolveSession<'_>,
) -> BraceExpansion {
    if !unbraced.contains('{') {
        return BraceExpansion::Absent;
    }
    let mut out = String::with_capacity(unbraced.len() + 16);
    let mut rest = unbraced;
    {
        let mut expander = SegmentExpander {
            out: &mut out,
            source: unbraced,
            prop,
            session,
        };
        while let Some(open) = rest.find('{') {
            expander.push_literal(&rest[..open]);
            let Some(next) = expander.expand_open(rest, open) else {
                return BraceExpansion::Missing;
            };
            rest = next;
        }
        expander.push_literal(rest);
    }
    BraceExpansion::Expanded(out)
}

/// Session for one brace-expansion pass over a composite value.
struct SegmentExpander<'a, 's> {
    out: &'a mut String,
    source: &'a str,
    prop: &'a str,
    session: &'a mut ResolveSession<'s>,
}

impl<'a, 's> SegmentExpander<'a, 's> {
    fn push_literal(&mut self, literal: &str) {
        self.out.push_str(literal);
    }

    /// Expand the segment opened at `open`, returning the unprocessed remainder.
    /// None drops the whole value: the segment named no token and errored.
    fn expand_open(&mut self, rest: &'a str, open: usize) -> Option<&'a str> {
        let after = &rest[open + 1..];
        let Some(close) = after.find('}') else {
            let key = want_key(
                self.session,
                self.prop,
                serde_json::Value::String(self.source.to_string()),
            );
            self.session.emit(
                key,
                ResolveOutcome::Passthrough {
                    code: DiagnosticCode::UnterminatedBrace,
                    detail: ResolveDetail::Token(TokenDetail::UnterminatedBrace {
                        value: self.source.into(),
                    }),
                },
            );
            self.out.push_str(&rest[open..]);
            return Some("");
        };
        let inner = after[..close].trim();
        let (path, opacity) = split_opacity(inner);
        match self.session.system.token(path) {
            Some(entry) if !path.is_empty() => {
                self.out.push_str(&format_entry(entry, opacity));
            }
            _ => {
                if self.keep_raw_segment(rest, open, close, inner) {
                    return None;
                }
            }
        }
        Some(&after[close + 1..])
    }

    /// Keep an unresolvable segment verbatim. True when the segment named a
    /// missing token (the error is pushed); empty segments stay silent.
    fn keep_raw_segment(&mut self, rest: &str, open: usize, close: usize, inner: &str) -> bool {
        if inner.is_empty() {
            self.out.push_str(&rest[open..open + 1 + close + 1]);
            return false;
        }
        let diagnostic = self.session.location.error(
            DiagnosticCode::UnknownTokenReference,
            format!("unknown token reference `{{{inner}}}`"),
        );
        self.session.diagnostics.push(diagnostic);
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{Diagnostic, DiagnosticLocation, DiagnosticSeverity};
    use base_system::{BaseSystem, TokenLeaf};

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

    fn expand(raw: &str) -> (BraceExpansion, Vec<Diagnostic>) {
        let system = test_system();
        let mut diagnostics = Vec::new();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: None,
            want: None,
        };
        let out = expand_brace_segments(raw, "border", &mut session);
        drop(session);
        (out, diagnostics)
    }

    fn expanded(out: BraceExpansion) -> String {
        match out {
            BraceExpansion::Expanded(text) => text,
            _ => panic!("expected expanded value"),
        }
    }

    #[test]
    fn composite_value_expands_segment_and_keeps_literals() {
        let (out, diagnostics) = expand("1px solid {colors.gray.800}");
        assert_eq!(expanded(out), "1px solid var(--colors-gray-800)");
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn opacity_segment_expands_to_color_mix() {
        let (out, diagnostics) = expand("0 0 0 3px {colors.gray.800/50}");
        assert_eq!(
            expanded(out),
            "0 0 0 3px color-mix(in srgb, var(--colors-gray-800) 50%, transparent)"
        );
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn unterminated_brace_stays_raw_and_warns() {
        let (out, diagnostics) = expand("1px solid {colors.gray.800");
        assert_eq!(expanded(out), "1px solid {colors.gray.800");
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("unterminated"));
    }

    #[test]
    fn unknown_segment_errors_and_drops() {
        let (out, diagnostics) = expand("0 1px 2px {colors.ghost}");
        assert!(matches!(out, BraceExpansion::Missing));
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].severity, DiagnosticSeverity::Error);
        assert!(diagnostics[0].message.contains("{colors.ghost}"));
    }

    #[test]
    fn brace_free_values_are_untouched() {
        let (out, _) = expand("1px solid red");
        assert!(matches!(out, BraceExpansion::Absent));
    }
}
