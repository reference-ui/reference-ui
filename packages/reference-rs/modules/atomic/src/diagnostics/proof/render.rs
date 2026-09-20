//! Compile-long session rendering: proof verdicts onto the default channel.
//!
//! After assembly builds the final runtime plans, proof joins the session's
//! analysis expectations against the emitted key set and rewrites the pushed
//! diagnostics in place: absent exacts with a resolver cause replace their
//! legacy line with a proof warning, covered keys and covered sinks drop
//! their legacy lines, and causeless misses append one warning. Matching is
//! by re-derived legacy sentence (code, location, message), so untouched
//! lines keep their bytes, order, and count.

use std::collections::{BTreeSet, HashSet};

use super::super::{Diagnostic, DiagnosticFact, OwnedLookupKey, Policy};
use super::lines::{find_line, remove_line};
use super::plans::{is_hole_value, same_position};
use canon::is_known_style_prop;
use super::plans::emitted_keys;
use super::rejects::{collect as collect_reject, Reject};
use super::sinks::Sinks;
use crate::runtime::RuntimeStylePlan;

/// Render the compile session's proof verdicts onto the default channel.
/// Facts stay borrowed; only `diagnostics` mutates, in place.
pub fn render_session(
    facts: &[DiagnosticFact],
    plans: &[RuntimeStylePlan],
    system: &str,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let proof = Proof::collect(facts, plans);
    let sinks = Sinks::collect(facts);
    proof.render_rejects(diagnostics);
    proof.render_causeless(diagnostics);
    sinks.render_covered(system, &proof.emitted, diagnostics);
}

/// The partitioned join inputs: expectations and keyed rejections.
struct Proof<'a> {
    emitted: BTreeSet<String>,
    exacts: Vec<&'a OwnedLookupKey>,
    exact_set: HashSet<String>,
    rejects: Vec<Reject<'a>>,
}

impl<'a> Proof<'a> {
    /// Partition the session facts into join inputs over the emitted set.
    fn collect(facts: &'a [DiagnosticFact], plans: &[RuntimeStylePlan]) -> Self {
        let mut proof = Self {
            emitted: emitted_keys(plans),
            exacts: Vec::new(),
            exact_set: HashSet::new(),
            rejects: Vec::new(),
        };
        for fact in facts {
            match fact {
                DiagnosticFact::ExactLookupExpected { key, .. } => proof.collect_exact(key),
                DiagnosticFact::ResolveOutcome {
                    location,
                    key: Some(key),
                    outcome,
                } => collect_reject(&mut proof.rejects, location, key, outcome),
                _ => {}
            }
        }
        proof
    }

    /// Collect one expected lookup under its serialized key.
    fn collect_exact(&mut self, key: &'a OwnedLookupKey) {
        self.exact_set.insert(key.lookup_key());
        self.exacts.push(key);
    }

    /// Join rejections against expectations: an expected key that is absent
    /// replaces its legacy line with the proof warning; an expected key
    /// that is present drops its legacy line (incidental coverage).
    /// Rejections no expectation names keep their legacy line.
    fn render_rejects(&self, diagnostics: &mut Vec<Diagnostic>) {
        for reject in &self.rejects {
            if !self.exact_set.contains(&reject.key_string) {
                continue;
            }
            if self.emitted.contains(&reject.key_string) {
                remove_line(
                    diagnostics,
                    reject.code,
                    reject.location,
                    &reject.legacy_message,
                );
            } else if let Some(line) = find_line(
                diagnostics,
                reject.code,
                reject.location,
                &reject.legacy_message,
            ) {
                line.message = Policy::render_proof(
                    reject.key,
                    reject.location,
                    reject.code,
                    &reject.legacy_message,
                )
                .message;
            }
        }
    }

    /// Warn once per absent expected key that no rejection explains: no
    /// same-key rejection (handled above) and no same-position rejection
    /// (its legacy line already warns this declaration — a spelling
    /// divergence between analysis and resolve must not double-warn).
    /// Hole-valued keys never warn: runtime skips them without querying,
    /// so an `Exact{false}`/`Exact{null}` is always an analysis gap, never
    /// a miss (ledger E9 / F6, enforced structurally). Unknown-prop keys
    /// never warn either: extract owns that jurisdiction and already warns
    /// located at the gate (O2), so a second unlocated warning would only
    /// duplicate it. Conditions ride along: they are not style props, and
    /// their scalar misuse already warns located (O20).
    fn render_causeless(&self, diagnostics: &mut Vec<Diagnostic>) {
        let mut warned: HashSet<String> = HashSet::new();
        for key in &self.exacts {
            if is_hole_value(&key.value) || !is_known_style_prop(&key.prop) {
                continue;
            }
            let key_string = key.lookup_key();
            if self.emitted.contains(&key_string) || self.is_explained(key, &key_string) {
                continue;
            }
            if warned.insert(key_string) {
                diagnostics.push(Policy::render_causeless(key));
            }
        }
    }

    /// True when a rejection already warns this key: same key, or same
    /// position (a spelling divergence must not double-warn).
    fn is_explained(&self, key: &OwnedLookupKey, key_string: &str) -> bool {
        self.rejects.iter().any(|reject| {
            reject.key_string == key_string || same_position(reject.key, key)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{
        adapters::resolve::ResolveReport, DeclarationDetail, DiagnosticCode, DiagnosticLocation,
        NameDetail, ResolveDetail, ResolveOutcome, SourceId, SourceSite, StyleSurfaceKind,
        ValueDetail,
    };
    use oxc_span::Span;

    fn site() -> SourceSite {
        SourceSite {
            source: SourceId(0),
            span: Span::new(0, 4),
            surface: StyleSurfaceKind::Css,
            prop: "color".into(),
            when: Vec::new(),
        }
    }

    fn key(prop: &str, value: serde_json::Value) -> OwnedLookupKey {
        OwnedLookupKey {
            system: "lib".into(),
            when: Vec::new(),
            prop: prop.into(),
            value,
            important: false,
        }
    }

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

    fn condition_reject(key: OwnedLookupKey) -> (DiagnosticFact, Diagnostic) {
        let report = ResolveReport {
            location: located(),
            key: Some(key),
            outcome: ResolveOutcome::Rejected {
                code: DiagnosticCode::UnknownCondition,
                detail: ResolveDetail::Declaration(DeclarationDetail::Name(
                    NameDetail::Condition {
                        name: "_hovr".into(),
                    },
                )),
            },
        };
        let line = Policy::render_resolve(&report);
        (DiagnosticFact::from(report), line)
    }

    fn invalid_reject(value: &str, key: OwnedLookupKey) -> (DiagnosticFact, Diagnostic) {
        let report = ResolveReport {
            location: located(),
            key: Some(key),
            outcome: ResolveOutcome::Rejected {
                code: DiagnosticCode::InvalidCssValue,
                detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                    ValueDetail::InvalidValue {
                        prop: "display".into(),
                        value: value.into(),
                    },
                )),
            },
        };
        let line = Policy::render_resolve(&report);
        (DiagnosticFact::from(report), line)
    }

    fn exact(key: OwnedLookupKey) -> DiagnosticFact {
        DiagnosticFact::ExactLookupExpected { site: site(), key }
    }

    #[test]
    fn absent_expected_key_replaces_its_legacy_line() {
        let key = key("color", serde_json::json!("red.500"));
        let (fact, line) = condition_reject(key.clone());
        let mut diagnostics = vec![line];
        render_session(&[exact(key), fact], &[], "lib", &mut diagnostics);
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownCondition);
        assert!(diagnostics[0].message.contains("red.500"));
        assert!(diagnostics[0].message.contains("Unknown condition"));
        assert_eq!(diagnostics[0].file.as_deref(), Some("t.ts"));
    }

    #[test]
    fn present_expected_key_drops_its_legacy_line() {
        let key = key("color", serde_json::json!("red"));
        let (fact, line) = condition_reject(key.clone());
        let mut diagnostics = vec![line];
        let plans = vec![plan("color", serde_json::json!("red"))];
        render_session(&[exact(key), fact], &plans, "lib", &mut diagnostics);
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn rejection_without_an_expectation_keeps_its_line() {
        let (fact, line) = condition_reject(key("color", serde_json::json!("red")));
        let mut diagnostics = vec![line.clone()];
        render_session(&[fact], &[], "lib", &mut diagnostics);
        assert_eq!(diagnostics, vec![line]);
    }

    #[test]
    fn causeless_miss_warns_once_per_key() {
        let key = key("color", serde_json::json!("red"));
        let mut diagnostics = Vec::new();
        render_session(
            &[exact(key.clone()), exact(key)],
            &[],
            "lib",
            &mut diagnostics,
        );
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code, DiagnosticCode::MissingStylePlan);
        assert!(diagnostics[0].message.contains("color"));
    }

    #[test]
    fn spelling_divergence_at_one_position_warns_once() {
        let exact_key = key("top", serde_json::json!(16));
        let resolve_key = key("top", serde_json::json!("0x10"));
        let report = ResolveReport {
            location: located(),
            key: Some(resolve_key),
            outcome: ResolveOutcome::Rejected {
                code: DiagnosticCode::NonCanonicalNumeric,
                detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                    ValueDetail::NonCanonicalNumber {
                        prop: "top".into(),
                        spelling: "0x10".into(),
                    },
                )),
            },
        };
        let line = Policy::render_resolve(&report);
        let mut diagnostics = vec![line.clone()];
        render_session(
            &[exact(exact_key), DiagnosticFact::from(report)],
            &[],
            "lib",
            &mut diagnostics,
        );
        assert_eq!(diagnostics, vec![line]);
    }

    #[test]
    fn false_refusals_never_reach_userspace() {
        let key = key("display", serde_json::json!(false));
        let (fact, line) = invalid_reject("false", key.clone());
        let mut diagnostics = vec![line.clone()];
        render_session(&[exact(key), fact], &[], "lib", &mut diagnostics);
        assert_eq!(diagnostics, vec![line]);
    }

    #[test]
    fn unknown_props_defer_to_extracts_jurisdiction() {
        let mut diagnostics = Vec::new();
        render_session(
            &[
                exact(key("fooBar", serde_json::json!("x"))),
                exact(key("_hover", serde_json::json!("red"))),
            ],
            &[],
            "lib",
            &mut diagnostics,
        );
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn hole_valued_expectations_never_warn() {
        let mut diagnostics = Vec::new();
        render_session(
            &[
                exact(key("display", serde_json::json!(false))),
                exact(key("color", serde_json::Value::Null)),
            ],
            &[],
            "lib",
            &mut diagnostics,
        );
        assert!(diagnostics.is_empty());
    }

    #[test]
    fn true_refusals_prove_their_miss() {
        let key = key("display", serde_json::json!(true));
        let (fact, line) = invalid_reject("true", key.clone());
        let mut diagnostics = vec![line];
        render_session(&[exact(key), fact], &[], "lib", &mut diagnostics);
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("display"));
        assert!(diagnostics[0].message.contains("true"));
    }

}
