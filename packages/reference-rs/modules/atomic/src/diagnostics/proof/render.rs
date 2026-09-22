//! Compile-long session rendering: proof verdicts onto the default channel.
//!
//! After assembly builds the final runtime plans, proof joins the session's
//! analysis expectations against the emitted key set and rewrites the pushed
//! diagnostics in place: absent exacts with a resolver cause replace their
//! legacy line with a proof warning, covered keys and covered sinks drop
//! their legacy lines, and causeless misses append one warning. Matching is
//! by re-derived legacy sentence (code, location, message), so untouched
//! lines keep their bytes, order, and count.

use std::collections::BTreeSet;

use rustc_hash::FxHashSet;

use super::super::{Diagnostic, DiagnosticFact, OwnedLookupKey, Policy};
use super::lines::{find_line, remove_line};
use super::plans::{is_hole_value, same_position};
use canon::is_known_style_prop;
use super::plans::emitted_keys;
use super::rejects::{collect as collect_reject, Reject};
use super::sinks::Sinks;
use crate::runtime::RuntimeStylePlan;
use super::memo::SerialMemo;

/// Render the compile session's proof verdicts onto the default channel.
/// Facts stay borrowed; only `diagnostics` mutates, in place.
pub fn render_session(
    facts: &[DiagnosticFact],
    plans: &[RuntimeStylePlan],
    system: &str,
    diagnostics: &mut Vec<Diagnostic>,
) {
    render_with(
        Proof::collect(facts, emitted_keys(plans)),
        facts,
        system,
        diagnostics,
    );
}

/// Render with a carried emitted-key set instead of re-serializing plans.
/// The keys must equal `emitted_keys(plans)` (pinned in `plans` tests).
pub fn render_session_with_keys(
    facts: &[DiagnosticFact],
    emitted: BTreeSet<String>,
    system: &str,
    diagnostics: &mut Vec<Diagnostic>,
) {
    render_with(Proof::collect(facts, emitted), facts, system, diagnostics);
}

/// Run the partitioned join inputs against the covered-sink render.
fn render_with(
    proof: Proof<'_>,
    facts: &[DiagnosticFact],
    system: &str,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let sinks = Sinks::collect(facts);
    proof.render_rejects(diagnostics);
    proof.render_causeless(diagnostics);
    sinks.render_covered(system, &proof.emitted, diagnostics);
}

/// The dictionary answer for one prop, memoized per session: the answer
/// never varies within a session, and sessions repeat a few dozen props.
fn memo_known<'a>(known: &mut rustc_hash::FxHashMap<&'a str, bool>, prop: &'a str) -> bool {
    *known.entry(prop).or_insert_with(|| is_known_style_prop(prop))
}

/// The partitioned join inputs: expectations and keyed rejections.
struct Proof<'a> {
    emitted: BTreeSet<String>,
    exacts: Vec<(&'a OwnedLookupKey, String)>,
    exact_set: FxHashSet<String>,
    rejects: Vec<Reject<'a>>,
}

impl<'a> Proof<'a> {
    /// Partition the session facts into join inputs over the emitted set.
    /// The expectation set builds only when rejections exist to join
    /// against it: with no rejections the join loop is vacuous and the set
    /// is never consulted, so building it is pure waste.
    fn collect(facts: &'a [DiagnosticFact], emitted: BTreeSet<String>) -> Self {
        let mut proof = Self {
            emitted,
            exacts: Vec::new(),
            exact_set: FxHashSet::default(),
            rejects: Vec::new(),
        };
        let mut memo = SerialMemo::new();
        for fact in facts {
            proof.collect_one(fact, &mut memo);
        }
        if !proof.rejects.is_empty() {
            proof.build_exact_set();
        }
        proof
    }

    /// Sort one session fact into the join inputs it feeds: expectations
    /// collect their serials, keyed resolve outcomes collect rejections,
    /// every other fact family belongs to a different render.
    fn collect_one(&mut self, fact: &'a DiagnosticFact, memo: &mut SerialMemo<'a>) {
        match fact {
            DiagnosticFact::ExactLookupExpected { key, .. } => self.collect_exact(key, memo),
            DiagnosticFact::ResolveOutcome {
                location,
                key: Some(key),
                outcome,
            } => collect_reject(&mut self.rejects, location, key, outcome),
            _ => {}
        }
    }

    /// Fill the expectation set from the collected serials. Runs only when
    /// rejections exist to join against it; the set then holds exactly the
    /// serials the eager build would have inserted.
    fn build_exact_set(&mut self) {
        for (_, key_string) in &self.exacts {
            self.exact_set.insert(key_string.clone());
        }
    }

    /// Collect one expected lookup under its serialized key. Duplicate
    /// expectations share the earlier duplicate's bytes (the memo hits only
    /// on canonical equality, which implies byte-identical serialization),
    /// so each distinct key serializes once per session.
    fn collect_exact(&mut self, key: &'a OwnedLookupKey, memo: &mut SerialMemo<'a>) {
        match memo.find(key) {
            Some(slot) => {
                let key_string = self.exacts[slot as usize].1.clone();
                self.exacts.push((key, key_string));
            }
            None => {
                memo.insert(key, self.exacts.len() as u32);
                let key_string = key.lookup_key();
                self.exacts.push((key, key_string));
            }
        }
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
        let mut warned: FxHashSet<String> = FxHashSet::default();
        // Sessions touch dozens of distinct props across tens of thousands
        // of expectations; the dictionary answer never varies per session.
        let mut known: rustc_hash::FxHashMap<&str, bool> =
            rustc_hash::FxHashMap::with_capacity_and_hasher(64, Default::default());
        // Borrowed hash view over the emitted set: same membership answers
        // as the tree, one hash per probe instead of a string-compare walk.
        // (Fully qualified paths keep this diff off the import block the
        // pending hasher conversion touches; see REPORT §Collision.)
        let emitted_view: rustc_hash::FxHashSet<&str> =
            self.emitted.iter().map(String::as_str).collect();
        for (key, key_string) in &self.exacts {
            if is_hole_value(&key.value) {
                continue;
            }
            let prop: &str = &key.prop;
            if !memo_known(&mut known, prop) {
                continue;
            }
            if emitted_view.contains(key_string.as_str()) || self.is_explained(key, key_string) {
                continue;
            }
            if warned.insert(key_string.clone()) {
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
    fn duplicate_exact_with_reordered_object_keys_warns_once() {
        let mut first_map = serde_json::Map::new();
        first_map.insert("md".to_string(), serde_json::json!("60px"));
        first_map.insert("base".to_string(), serde_json::json!("50px"));
        let mut second_map = serde_json::Map::new();
        second_map.insert("base".to_string(), serde_json::json!("50px"));
        second_map.insert("md".to_string(), serde_json::json!("60px"));
        let first = key("width", serde_json::Value::Object(first_map));
        let second = key("width", serde_json::Value::Object(second_map));
        assert_eq!(first.lookup_key(), second.lookup_key());
        let mut diagnostics = Vec::new();
        render_session(&[exact(first), exact(second)], &[], "lib", &mut diagnostics);
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code, DiagnosticCode::MissingStylePlan);
    }

    #[test]
    fn duplicate_expected_keys_still_join_rejections() {
        let first = key("color", serde_json::json!("red.500"));
        let second = key("color", serde_json::json!("red.500"));
        let (fact, line) = condition_reject(first.clone());
        let mut diagnostics = vec![line];
        render_session(
            &[exact(first), exact(second), fact],
            &[],
            "lib",
            &mut diagnostics,
        );
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code, DiagnosticCode::UnknownCondition);
        assert!(diagnostics[0].message.contains("red.500"));
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
