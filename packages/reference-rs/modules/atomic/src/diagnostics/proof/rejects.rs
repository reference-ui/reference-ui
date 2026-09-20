//! Keyed resolve rejections: dropped declarations that name their key.
//!
//! Proof joins these against analysis expectations: a rejection whose exact
//! key an expectation names either proves its miss (absent) or falls silent
//! (present). Refusals of the hole value `false` never join — runtime skips
//! them without querying, so they can never be userspace misses (F6). Only
//! `Rejected` outcomes join; passthroughs paint and advisories aggregate.

use super::super::{
    adapters::resolve::ResolveReport, DeclarationDetail, DiagnosticCode, DiagnosticLocation,
    OwnedLookupKey, Policy, ResolveDetail, ResolveOutcome, ValueDetail,
};

/// One resolve rejection with its exact key, ready to join.
pub struct Reject<'a> {
    /// Where the dropped declaration was written.
    pub location: &'a DiagnosticLocation,
    /// The exact runtime key the declaration would have queried.
    pub key: &'a OwnedLookupKey,
    /// The serialized key, computed once for both joins.
    pub key_string: String,
    /// The resolver's code, kept on the proof warning.
    pub code: DiagnosticCode,
    /// The re-derived legacy sentence: match key and proven reason.
    pub legacy_message: String,
}

/// Collect one keyed rejection unless it refuses a hole value.
pub fn collect<'a>(
    rejects: &mut Vec<Reject<'a>>,
    location: &'a DiagnosticLocation,
    key: &'a OwnedLookupKey,
    outcome: &'a ResolveOutcome,
) {
    let ResolveOutcome::Rejected { code, detail } = outcome else {
        return;
    };
    if is_false_refusal(detail) {
        return;
    }
    let report = ResolveReport {
        location: location.clone(),
        key: Some(key.clone()),
        outcome: outcome.clone(),
    };
    rejects.push(Reject {
        location,
        key,
        key_string: key.lookup_key(),
        code: *code,
        legacy_message: Policy::render_resolve(&report).message,
    });
}

/// True for a refusal of the hole value `false`: runtime skips it without
/// querying, so it can never be a userspace miss (ledger E9 / F6).
fn is_false_refusal(detail: &ResolveDetail) -> bool {
    matches!(
        detail,
        ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::InvalidValue {
            value,
            ..
        })) if value.as_ref() == "false"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn located() -> DiagnosticLocation {
        DiagnosticLocation {
            file: Some("t.ts".to_string()),
            line: Some(1),
            column: Some(1),
        }
    }

    fn key(value: serde_json::Value) -> OwnedLookupKey {
        OwnedLookupKey {
            system: "lib".into(),
            when: Vec::new(),
            prop: "display".into(),
            value,
            important: false,
        }
    }

    fn outcome(value: &str) -> ResolveOutcome {
        ResolveOutcome::Rejected {
            code: DiagnosticCode::InvalidCssValue,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(
                ValueDetail::InvalidValue {
                    prop: "display".into(),
                    value: value.into(),
                },
            )),
        }
    }

    #[test]
    fn false_refusals_do_not_join() {
        let location = located();
        let key = key(serde_json::json!(false));
        let outcome = outcome("false");
        let mut rejects = Vec::new();
        collect(&mut rejects, &location, &key, &outcome);
        assert!(rejects.is_empty());
    }

    #[test]
    fn true_refusals_join_with_their_legacy_sentence() {
        let location = located();
        let key = key(serde_json::json!(true));
        let outcome = outcome("true");
        let mut rejects = Vec::new();
        collect(&mut rejects, &location, &key, &outcome);
        assert_eq!(rejects.len(), 1);
        assert_eq!(rejects[0].code, DiagnosticCode::InvalidCssValue);
        assert!(rejects[0].legacy_message.contains("true"));
    }
}
