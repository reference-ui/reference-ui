//! Harvest adapter: pool and mint telemetry as facts. Owns the ledger M
//! family. Minted counts are always compiler-channel telemetry: neither zero
//! nor positive proves a failure. Silently skipped sinks (unlowerable `when`)
//! report no fact, exactly as they emit no info today.

use super::super::{DiagnosticFact, DiagnosticLocation};

/// What harvest minted onto one sink, ready to report as a fact.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HarvestReport {
    pub location: DiagnosticLocation,
    pub prop: Box<str>,
    pub when: Vec<Box<str>>,
    pub minted: usize,
    /// Every kind-accepted pool value (pre-twin-skip), in acceptance order.
    /// Proof joins these against final plans; wording never reads them.
    pub offered: Vec<Box<str>>,
}

impl From<HarvestReport> for DiagnosticFact {
    fn from(report: HarvestReport) -> Self {
        DiagnosticFact::HarvestOutcome {
            location: report.location,
            prop: report.prop,
            when: report.when,
            minted: report.minted,
            offered: report.offered,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn harvest_report_converts_to_fact() {
        let report = HarvestReport {
            location: DiagnosticLocation {
                file: Some("t.ts".to_string()),
                line: None,
                column: None,
            },
            prop: "color".into(),
            when: vec!["_hover".into()],
            minted: 3,
            offered: vec!["red".into(), "blue".into()],
        };
        let fact = DiagnosticFact::from(report);
        assert!(matches!(
            fact,
            DiagnosticFact::HarvestOutcome { minted: 3, .. }
        ));
        let DiagnosticFact::HarvestOutcome { offered, .. } = fact else {
            panic!("harvest reports convert to harvest outcomes");
        };
        assert_eq!(offered, vec![Box::<str>::from("red"), "blue".into()]);
    }
}
