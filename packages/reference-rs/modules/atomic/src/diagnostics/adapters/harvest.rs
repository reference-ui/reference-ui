//! Harvest adapter: pool and mint telemetry as facts. Owns the ledger M
//! family. Minted counts are always compiler-channel telemetry: neither zero
//! nor positive proves a failure. Slice 3 migrates the mint call site.

use super::super::{DiagnosticFact, SourceSite};

/// What harvest minted onto one sink, ready to report as a fact.
#[derive(Debug, Clone, PartialEq)]
pub struct HarvestReport {
    pub site: SourceSite,
    pub minted: usize,
}

impl From<HarvestReport> for DiagnosticFact {
    fn from(report: HarvestReport) -> Self {
        DiagnosticFact::HarvestOutcome {
            site: report.site,
            minted: report.minted,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{SourceId, StyleSurfaceKind};
    use oxc_span::Span;

    #[test]
    fn harvest_report_converts_to_fact() {
        let report = HarvestReport {
            site: SourceSite {
                source: SourceId(2),
                span: Span::new(4, 9),
                surface: StyleSurfaceKind::Css,
                prop: "color".into(),
                when: Vec::new(),
            },
            minted: 3,
        };
        let fact = DiagnosticFact::from(report);
        assert!(matches!(
            fact,
            DiagnosticFact::HarvestOutcome { minted: 3, .. }
        ));
    }
}
