//! Compile-long session rendering: proof verdicts onto the default channel.
//!
//! After assembly builds the final runtime plans, proof joins the session's
//! analysis expectations against the emitted key set and rewrites the pushed
//! diagnostics in place: absent exacts with a resolver cause replace their
//! legacy line with a proof warning, covered keys and covered sinks drop
//! their legacy lines, and causeless misses append one warning. Matching is
//! by re-derived legacy sentence (code, location, message), so untouched
//! lines keep their bytes, order, and count. Expectations nested under a key
//! extract already warned as an unknown style property stay silent: that
//! located warning is the one line for the authored mistake.

use std::collections::BTreeSet;

use rustc_hash::FxHashSet;

use super::super::{
    Diagnostic, DiagnosticCode, DiagnosticFact, DiagnosticLocation, OwnedLookupKey, Policy,
    ResolveOutcome,
};
use super::lines::{find_line, remove_line};
use super::memo::SerialMemo;
use super::plans::emitted_keys;
use super::plans::{is_hole_value, same_position};
use super::rejects::{collect as collect_reject, Reject};
use super::sinks::Sinks;
use crate::atom::Backing;
use crate::extract::suggest::unknown_property_key;
use crate::runtime::RuntimeStylePlan;
use canon::is_known_style_prop;

/// The frame a render joins against: the compile's own system name. Facts
/// recorded on another system's component carry their own backing, so each
/// expands its key across exactly the systems that backing names.
#[derive(Clone, Copy)]
pub struct RenderScope<'a> {
    system: &'a str,
}

impl<'a> RenderScope<'a> {
    pub fn new(system: &'a str) -> Self {
        Self { system }
    }
}

/// Render the compile session's proof verdicts onto the default channel.
/// Facts stay borrowed; only `diagnostics` mutates, in place.
pub fn render_session(
    facts: &[DiagnosticFact],
    plans: &[RuntimeStylePlan],
    scope: RenderScope<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    render_with(
        Proof::collect(facts, emitted_keys(plans)),
        facts,
        scope,
        diagnostics,
    );
}

/// Render with a carried emitted-key set instead of re-serializing plans.
/// The keys must equal `emitted_keys(plans)` (pinned in `plans` tests).
pub fn render_session_with_keys(
    facts: &[DiagnosticFact],
    emitted: BTreeSet<String>,
    scope: RenderScope<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    render_with(Proof::collect(facts, emitted), facts, scope, diagnostics);
}

/// Run the partitioned join inputs against the covered-sink render.
fn render_with(
    proof: Proof<'_>,
    facts: &[DiagnosticFact],
    scope: RenderScope<'_>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let sinks = Sinks::collect(facts);
    proof.render_rejects(diagnostics);
    proof.render_causeless(diagnostics);
    sinks.render_covered(scope.system, &proof.emitted, diagnostics);
}

/// The dictionary answer for one prop, memoized per session: the answer
/// never varies within a session, and sessions repeat a few dozen props.
fn memo_known<'a>(known: &mut rustc_hash::FxHashMap<&'a str, bool>, prop: &'a str) -> bool {
    *known
        .entry(prop)
        .or_insert_with(|| is_known_style_prop(prop))
}

/// One keyed resolve outcome as the join consumes it: the fact's own fields, borrowed in place.
#[derive(Clone, Copy)]
struct KeyedRejection<'a> {
    location: &'a DiagnosticLocation,
    key: &'a OwnedLookupKey,
    outcome: &'a ResolveOutcome,
    backing: &'a Backing,
}

/// The partitioned join inputs: expectations and keyed rejections.
struct Proof<'a> {
    emitted: BTreeSet<String>,
    exacts: Vec<(&'a OwnedLookupKey, String)>,
    exact_set: FxHashSet<String>,
    rejects: Vec<Reject<'a>>,
    /// Keys extract warned `UnknownProperty`; lookups nested under one are
    /// already explained by that located line.
    unknown_keys: FxHashSet<&'a str>,
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
            unknown_keys: FxHashSet::default(),
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
                backing,
                ..
            } => self.collect_reject(KeyedRejection {
                location,
                key,
                outcome,
                backing,
            }),
            DiagnosticFact::ExtractNote { code, message, .. } => {
                self.collect_unknown_key(*code, message)
            }
            _ => {}
        }
    }

    /// Remember the key an unknown-property note names, so lookups nested
    /// under it defer to that located line.
    fn collect_unknown_key(&mut self, code: DiagnosticCode, message: &'a str) {
        if code != DiagnosticCode::UnknownProperty {
            return;
        }
        if let Some(name) = unknown_property_key(message) {
            self.unknown_keys.insert(name);
        }
    }

    /// Collect one keyed rejection at each applicable system: an own
    /// rejection joins on its own key; any other re-targets the key across
    /// the systems its backing names (its resolver key is own-system, so
    /// only the backing can place it against those systems' plans).
    fn collect_reject(&mut self, rejection: KeyedRejection<'a>) {
        let KeyedRejection {
            location,
            key,
            outcome,
            backing,
        } = rejection;
        if backing.is_own() {
            collect_reject(&mut self.rejects, location, key, outcome);
            return;
        }
        for system in backing.named() {
            let retargeted = OwnedLookupKey {
                system: system.clone(),
                ..key.clone()
            };
            collect_reject(&mut self.rejects, location, &retargeted, outcome);
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
                    &reject.key,
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
    /// their scalar misuse already warns located (O20). Keys nested under an
    /// unknown-prop key never warn for the same reason: the runtime namer
    /// treats an object value as a condition by shape, but extract already
    /// warned that key located, so a second line would only duplicate it.
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

    /// True when one of the key's conditions is a key extract warned as an
    /// unknown style property.
    fn under_unknown_key(&self, key: &OwnedLookupKey) -> bool {
        !self.unknown_keys.is_empty()
            && key
                .when
                .iter()
                .any(|segment| self.unknown_keys.contains(&**segment))
    }

    /// True when a line already warns this key: a rejection with the same
    /// key or position (a spelling divergence must not double-warn), or an
    /// unknown-prop note on one of its conditions.
    fn is_explained(&self, key: &OwnedLookupKey, key_string: &str) -> bool {
        self.under_unknown_key(key)
            || self
                .rejects
                .iter()
                .any(|reject| reject.key_string == key_string || same_position(&reject.key, key))
    }
}

#[cfg(test)]
mod tests;
