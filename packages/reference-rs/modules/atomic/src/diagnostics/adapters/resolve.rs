//! Resolve adapter: resolved or rejected declarations as facts. Owns the
//! ledger R family. Resolve reports whether an exact authored declaration
//! produced atoms, preserving reason and location; it never decides whether
//! that reason is a userspace warning. Existing `ATM-E-*` pass through.

use super::super::{DiagnosticFact, OwnedLookupKey, ResolveOutcome, SourceSite};

/// What resolve did with one authored declaration, ready to report.
#[derive(Debug, Clone, PartialEq)]
pub struct ResolveReport {
    pub site: SourceSite,
    pub key: Option<OwnedLookupKey>,
    pub outcome: ResolveOutcome,
}

impl From<ResolveReport> for DiagnosticFact {
    fn from(report: ResolveReport) -> Self {
        DiagnosticFact::ResolveOutcome {
            site: report.site,
            key: report.key,
            outcome: report.outcome,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{DiagnosticCode, SourceId, StyleSurfaceKind};
    use oxc_span::Span;

    #[test]
    fn resolve_report_converts_to_fact() {
        let report = ResolveReport {
            site: SourceSite {
                source: SourceId(5),
                span: Span::new(0, 8),
                surface: StyleSurfaceKind::JsxStyle,
                prop: "color".into(),
                when: Vec::new(),
            },
            key: None,
            outcome: ResolveOutcome::Rejected {
                code: DiagnosticCode::UnknownCondition,
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
