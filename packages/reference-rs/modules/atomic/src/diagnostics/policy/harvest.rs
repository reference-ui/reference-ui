//! Harvest mint wording: one info template per sink. Byte-identical to the
//! legacy `harvest_info` string it replaces: the prop, its `when`, and the
//! net-new minted count. Neither zero nor positive proves a failure, so the
//! line stays compiler-channel telemetry once Slice 5 moves channels.

use super::super::adapters::harvest::HarvestReport;
use super::super::{Diagnostic, DiagnosticCode};

/// Render one harvest mint report to its final info line.
pub fn render(report: &HarvestReport) -> Diagnostic {
    let when = report
        .when
        .iter()
        .map(AsRef::as_ref)
        .collect::<Vec<&str>>()
        .join(", ");
    let noun = if report.minted == 1 { "value" } else { "values" };
    let message = format!(
        "{} under [{}]: {} harvested {} minted",
        report.prop, when, report.minted, noun
    );
    report
        .location
        .info(DiagnosticCode::HarvestSink, message)
}

#[cfg(test)]
mod tests {
    use super::super::Policy;
    use super::*;

    fn report(prop: &str, when: &[&str], minted: usize) -> HarvestReport {
        HarvestReport {
            location: crate::diagnostics::DiagnosticLocation {
                file: Some("t.ts".to_string()),
                line: Some(7),
                column: Some(3),
            },
            prop: prop.into(),
            when: when.iter().map(|part| (*part).into()).collect(),
            minted,
            offered: Vec::new(),
        }
    }

    #[test]
    fn mint_sentences_pin_legacy_strings() {
        let plural = Policy::render_harvest(&report("color", &["_hover"], 9));
        assert_eq!(
            plural.message,
            "color under [_hover]: 9 harvested values minted"
        );
        assert_eq!(plural.file.as_deref(), Some("t.ts"));
        assert_eq!(plural.line, Some(7));
        let singular = Policy::render_harvest(&report("color", &[], 1));
        assert_eq!(singular.message, "color under []: 1 harvested value minted");
        let zero = Policy::render_harvest(&report("mt", &["md"], 0));
        assert_eq!(zero.message, "mt under [md]: 0 harvested values minted");
    }

    #[test]
    fn wording_ignores_the_offering() {
        let mut offered = report("color", &[], 0);
        offered.offered = vec!["red".into()];
        assert_eq!(
            Policy::render_harvest(&offered),
            Policy::render_harvest(&report("color", &[], 0))
        );
    }
}
