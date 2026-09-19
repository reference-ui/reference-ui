//! Extraction adapter: refusals and outcomes as facts. Owns the ledger D
//! and O families (dynamic refusals, spreads, residue, dead branches). The
//! existing `warn_dynamic` funnel becomes the first seam in Slice 3; sink
//! registration stays coupled to the refusal, wording moves to policy.

use super::super::{DiagnosticFact, ExtractOutcome, SourceSite};

/// What extraction did with one site, ready to report as a fact.
#[derive(Debug, Clone, PartialEq)]
pub struct ExtractReport {
    pub site: SourceSite,
    pub outcome: ExtractOutcome,
}

impl From<ExtractReport> for DiagnosticFact {
    fn from(report: ExtractReport) -> Self {
        DiagnosticFact::ExtractOutcome {
            site: report.site,
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
    fn extract_report_converts_to_fact() {
        let report = ExtractReport {
            site: SourceSite {
                source: SourceId(0),
                span: Span::new(0, 3),
                surface: StyleSurfaceKind::Css,
                prop: "color".into(),
                when: Vec::new(),
            },
            outcome: ExtractOutcome::Refused {
                code: DiagnosticCode::DynamicIdentifier,
            },
        };
        let fact = DiagnosticFact::from(report);
        assert!(matches!(
            fact,
            DiagnosticFact::ExtractOutcome {
                outcome: ExtractOutcome::Refused { .. },
                ..
            }
        ));
    }
}
