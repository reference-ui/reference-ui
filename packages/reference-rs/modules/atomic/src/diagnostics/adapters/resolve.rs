//! Resolve adapter: resolved or rejected declarations as facts. Owns the
//! ledger R family. Resolve reports whether an exact authored declaration
//! produced atoms, preserving reason and location; it never decides whether
//! that reason is a userspace warning. Existing `ATM-E-*` pass through.

use super::super::{DiagnosticFact, DiagnosticLocation, OwnedLookupKey, ResolveOutcome};

/// What resolve did with one authored declaration, ready to report. The key
/// travels when a want context is in hand; the outcome always does, carrying
/// its own render parts so policy never unwraps the key.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolveReport {
    pub location: DiagnosticLocation,
    pub key: Option<OwnedLookupKey>,
    pub outcome: ResolveOutcome,
}

impl From<ResolveReport> for DiagnosticFact {
    fn from(report: ResolveReport) -> Self {
        DiagnosticFact::ResolveOutcome {
            location: report.location,
            key: report.key,
            outcome: report.outcome,
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
        };
        let fact = DiagnosticFact::from(report);
        assert!(matches!(
            fact,
            DiagnosticFact::ResolveOutcome {
                outcome: ResolveOutcome::Rejected { .. },
                ..
            }
        ));
    }
}
