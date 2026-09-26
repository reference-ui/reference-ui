//! Resolve adapter: resolved or rejected declarations as facts. Owns the
//! ledger R family. Resolve reports whether an exact authored declaration
//! produced atoms, preserving reason and location; it never decides whether
//! that reason is a userspace warning. Existing `ATM-E-*` pass through.

use super::super::{DiagnosticFact, DiagnosticLocation, OwnedLookupKey, ResolveOutcome};

/// What resolve did with one authored declaration, ready to report. The key
/// travels when a want context is in hand; the outcome always does, carrying
/// its own render parts so policy never unwraps the key. The precomputed
/// did-you-mean suggestion travels for unknown-name codes so policy renders
/// the same help on both the pushed line and the compiler re-render.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolveReport {
    pub location: DiagnosticLocation,
    pub key: Option<OwnedLookupKey>,
    pub outcome: ResolveOutcome,
    pub suggestion: Option<Box<str>>,
}

impl From<ResolveReport> for DiagnosticFact {
    fn from(report: ResolveReport) -> Self {
        DiagnosticFact::ResolveOutcome {
            location: report.location,
            key: report.key,
            outcome: report.outcome,
            suggestion: report.suggestion,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{DeclarationDetail, DiagnosticCode, ResolveDetail};

    #[test]
    fn resolve_report_converts_to_fact() {
        let report = ResolveReport {
            location: DiagnosticLocation::default(),
            key: None,
            outcome: ResolveOutcome::Rejected {
                code: DiagnosticCode::UnknownCondition,
                detail: ResolveDetail::Declaration(DeclarationDetail::Name(
                    crate::diagnostics::NameDetail::Condition {
                        name: "_nope".into(),
                    },
                )),
            },
            suggestion: Some("_hover".into()),
        };
        let fact = DiagnosticFact::from(report);
        let DiagnosticFact::ResolveOutcome { outcome, suggestion, .. } = fact else {
            panic!("resolve reports convert to resolve outcomes");
        };
        assert!(matches!(outcome, ResolveOutcome::Rejected { .. }));
        assert_eq!(suggestion.as_deref(), Some("_hover"));
    }
}
