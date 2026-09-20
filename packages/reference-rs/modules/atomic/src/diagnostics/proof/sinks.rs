//! Covered-sink silence: harvest redundancy proved against final plans.
//!
//! A refused site falls silent only when its sink is covered: harvest
//! offered values, minted nothing net-new, and every offered value is a
//! final plan — so the site's harvest story is fully redundant with static
//! plans. Vacuous (unoffered), uncovered, and minting sinks keep their info
//! and funnel lines; their warnings stay until Slice 5 moves channels.

use std::collections::BTreeSet;

use super::super::{
    adapters::{extract::ExtractReport, harvest::HarvestReport},
    Diagnostic, DiagnosticCode, DiagnosticFact, DiagnosticLocation, ExtractOutcome,
    OwnedLookupKey, Policy,
};
use super::lines::remove_line;

/// One harvest sink outcome, ready for coverage proof.
struct Harvest<'a> {
    location: &'a DiagnosticLocation,
    prop: &'a str,
    when: &'a [Box<str>],
    minted: usize,
    offered: &'a [Box<str>],
    legacy_message: String,
}

/// One extract funnel refusal, removable when its sink is covered.
struct Funnel<'a> {
    location: &'a DiagnosticLocation,
    prop: &'a str,
    when: &'a [Box<str>],
    code: DiagnosticCode,
    legacy_message: String,
}

/// The sink-side join inputs: harvest outcomes plus funnel refusals.
pub struct Sinks<'a> {
    harvests: Vec<Harvest<'a>>,
    funnels: Vec<Funnel<'a>>,
}

impl<'a> Sinks<'a> {
    /// Partition the session facts into sink-side join inputs.
    pub fn collect(facts: &'a [DiagnosticFact]) -> Self {
        let mut sinks = Self {
            harvests: Vec::new(),
            funnels: Vec::new(),
        };
        for fact in facts {
            if let DiagnosticFact::HarvestOutcome {
                location,
                prop,
                when,
                minted,
                offered,
            } = fact
            {
                sinks.harvests.push(Harvest {
                    location,
                    prop: prop.as_ref(),
                    when: when.as_slice(),
                    minted: *minted,
                    offered: offered.as_slice(),
                    legacy_message: harvest_sentence(location, prop, when, *minted),
                });
            } else if let DiagnosticFact::ExtractOutcome {
                location,
                prop,
                when,
                outcome,
            } = fact
            {
                sinks.collect_funnel(location, prop, when, outcome);
            }
        }
        sinks
    }

    /// Collect one sink-recorded funnel refusal; refusals without a sink
    /// (mutation, record-time filter drops) have no coverage to prove.
    fn collect_funnel(
        &mut self,
        location: &'a DiagnosticLocation,
        prop: &'a Box<str>,
        when: &'a Vec<Box<str>>,
        outcome: &'a ExtractOutcome,
    ) {
        let ExtractOutcome::Refused {
            code,
            detail,
            sink_recorded,
        } = outcome;
        if !sink_recorded {
            return;
        }
        let report = ExtractReport {
            location: location.clone(),
            prop: prop.clone(),
            when: when.to_vec(),
            code: *code,
            detail: detail.clone(),
            sink_recorded: true,
        };
        self.funnels.push(Funnel {
            location,
            prop: prop.as_ref(),
            when: when.as_slice(),
            code: *code,
            legacy_message: Policy::render_extract(&report).message,
        });
    }

    /// Silence covered sinks: drop the sink's info line plus every
    /// recorded funnel line on it. All other sinks keep everything.
    pub fn render_covered(
        &self,
        system: &str,
        emitted: &BTreeSet<String>,
        diagnostics: &mut Vec<Diagnostic>,
    ) {
        for harvest in &self.harvests {
            if harvest.minted != 0 || harvest.offered.is_empty() {
                continue;
            }
            if !self.sink_covered(system, emitted, harvest) {
                continue;
            }
            remove_line(
                diagnostics,
                DiagnosticCode::HarvestSink,
                harvest.location,
                &harvest.legacy_message,
            );
            self.remove_funnel_lines(harvest, diagnostics);
        }
    }

    /// Drop every recorded funnel line on one covered sink's position.
    fn remove_funnel_lines(&self, harvest: &Harvest<'_>, diagnostics: &mut Vec<Diagnostic>) {
        for funnel in &self.funnels {
            if funnel.prop == harvest.prop && funnel.when == harvest.when {
                remove_line(
                    diagnostics,
                    funnel.code,
                    funnel.location,
                    &funnel.legacy_message,
                );
            }
        }
    }

    /// True when every value the pool offered this sink is a final plan.
    fn sink_covered(
        &self,
        system: &str,
        emitted: &BTreeSet<String>,
        harvest: &Harvest<'_>,
    ) -> bool {
        harvest.offered.iter().all(|value| {
            let key = OwnedLookupKey {
                system: system.into(),
                when: harvest.when.to_vec(),
                prop: harvest.prop.into(),
                value: serde_json::Value::String(value.to_string()),
                important: false,
            };
            emitted.contains(&key.lookup_key())
        })
    }
}

/// The legacy sentence one harvest report renders (wording ignores the
/// offering, so reconstruction passes none).
fn harvest_sentence(
    location: &DiagnosticLocation,
    prop: &str,
    when: &[Box<str>],
    minted: usize,
) -> String {
    let report = HarvestReport {
        location: location.clone(),
        prop: prop.into(),
        when: when.to_vec(),
        minted,
        offered: Vec::new(),
    };
    Policy::render_harvest(&report).message
}

#[cfg(test)]
mod tests {
    use super::super::plans::emitted_keys;
    use super::*;
    use crate::diagnostics::{DiagnosticCode, ExtractDetail, LeafDetail};
    use crate::runtime::RuntimeStylePlan;

    fn located() -> DiagnosticLocation {
        DiagnosticLocation {
            file: Some("t.ts".to_string()),
            line: Some(4),
            column: Some(19),
        }
    }

    fn plan(prop: &str, value: serde_json::Value) -> RuntimeStylePlan {
        RuntimeStylePlan {
            system: "lib".to_string(),
            when: Vec::new(),
            prop: prop.to_string(),
            value,
            important: false,
            declarations: Vec::new(),
        }
    }

    fn harvest_sink(minted: usize, offered: &[&str]) -> (DiagnosticFact, Diagnostic) {
        let report = HarvestReport {
            location: located(),
            prop: "color".into(),
            when: Vec::new(),
            minted,
            offered: offered.iter().map(|value| (*value).into()).collect(),
        };
        let line = Policy::render_harvest(&report);
        (DiagnosticFact::from(report), line)
    }

    fn funnel_refusal() -> (DiagnosticFact, Diagnostic) {
        let report = ExtractReport {
            location: located(),
            prop: "color".into(),
            when: Vec::new(),
            code: DiagnosticCode::DynamicIdentifier,
            detail: ExtractDetail::Leaf(LeafDetail::Identifier { name: "theme".into() }),
            sink_recorded: true,
        };
        let line = Policy::render_extract(&report);
        (DiagnosticFact::from(report), line)
    }

    #[test]
    fn covered_sinks_drop_sink_and_funnel_lines() {
        let (harvest_fact, harvest_line) = harvest_sink(0, &["red"]);
        let (funnel_fact, funnel_line) = funnel_refusal();
        let mut diagnostics = vec![funnel_line, harvest_line];
        let emitted = emitted_keys(&[plan("color", serde_json::json!("red"))]);
        let facts = vec![harvest_fact, funnel_fact];
        Sinks::collect(&facts).render_covered("lib", &emitted, &mut diagnostics);
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn vacuous_uncovered_and_minting_sinks_keep_everything() {
        let (vacuous_fact, vacuous_line) = harvest_sink(0, &[]);
        let (uncovered_fact, uncovered_line) = harvest_sink(0, &["blue"]);
        let (minting_fact, minting_line) = harvest_sink(1, &["red"]);
        let (funnel_fact, funnel_line) = funnel_refusal();
        let mut diagnostics =
            vec![funnel_line.clone(), vacuous_line, uncovered_line, minting_line];
        let emitted = emitted_keys(&[plan("color", serde_json::json!("red"))]);
        let facts = vec![vacuous_fact, uncovered_fact, minting_fact, funnel_fact];
        Sinks::collect(&facts).render_covered("lib", &emitted, &mut diagnostics);
        assert_eq!(diagnostics.len(), 4);
        assert!(diagnostics.contains(&funnel_line));
    }
}
