//! Expected-key vs final plan-key set join. The join is mechanical over
//! serialized keys: an exact key emitted because of another file, site, or
//! harvest still counts as present (incidental-coverage rule), because
//! runtime will paint. Only absent expected keys become userspace warnings.
//! Plans serialize through [`OwnedLookupKey`], the one owned key type, so
//! diagnostics grows no second canonicalizer.

use std::collections::BTreeSet;

use super::super::OwnedLookupKey;
use crate::runtime::RuntimeStylePlan;

impl From<&RuntimeStylePlan> for OwnedLookupKey {
    fn from(plan: &RuntimeStylePlan) -> Self {
        Self {
            system: plan.system.as_str().into(),
            when: plan.when.iter().map(|part| part.as_str().into()).collect(),
            prop: plan.prop.as_str().into(),
            value: plan.value.clone(),
            important: plan.important,
        }
    }
}

/// The final emitted lookup-key set, one serialized key per runtime plan.
pub fn emitted_keys(plans: &[RuntimeStylePlan]) -> BTreeSet<String> {
    plans
        .iter()
        .map(|plan| OwnedLookupKey::from(plan).lookup_key())
        .collect()
}

/// Expected keys missing from the final emitted set, in sorted order.
/// Present keys are successes and return nothing for them.
pub fn missing_keys(expected: &BTreeSet<String>, emitted: &BTreeSet<String>) -> Vec<String> {
    expected.difference(emitted).cloned().collect()
}

/// True for values runtime never queries: `false` and `null` are holes
/// (`isHole` skips them), so no lookup key carrying one can ever miss.
pub fn is_hole_value(value: &serde_json::Value) -> bool {
    value.is_null() || *value == serde_json::Value::Bool(false)
}

/// True when two keys name the same declaration position: same system,
/// property, condition stack, and importance, whatever the value spells.
pub fn same_position(left: &OwnedLookupKey, right: &OwnedLookupKey) -> bool {
    left.system == right.system
        && left.prop == right.prop
        && left.when == right.when
        && left.important == right.important
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(keys: &[&str]) -> BTreeSet<String> {
        keys.iter().map(|key| key.to_string()).collect()
    }

    #[test]
    fn present_keys_prove_nothing_absent() {
        let expected = set(&["a", "b"]);
        let emitted = set(&["a", "b", "c"]);
        assert!(missing_keys(&expected, &emitted).is_empty());
    }

    #[test]
    fn absent_keys_are_proven_missing_in_order() {
        let expected = set(&["b", "a", "c"]);
        let emitted = set(&["b"]);
        assert_eq!(missing_keys(&expected, &emitted), vec!["a", "c"]);
    }

    #[test]
    fn incidental_coverage_counts_as_present() {
        let expected = set(&["width:[\"200px\"]"]);
        let emitted = set(&["width:[\"200px\"]"]);
        assert!(missing_keys(&expected, &emitted).is_empty());
    }

    #[test]
    fn emitted_keys_serialize_plans_through_the_one_authority() {
        use crate::runtime::{RuntimeDeclaration, RuntimeStylePlan};
        let plans = vec![RuntimeStylePlan {
            system: "lib".to_string(),
            when: vec!["_hover".to_string()],
            prop: "color".to_string(),
            value: serde_json::json!("red"),
            important: false,
            declarations: vec![RuntimeDeclaration {
                slot: "hover:color".to_string(),
                class_name: "c_red".to_string(),
            }],
        }];
        let owned = OwnedLookupKey {
            system: "lib".into(),
            when: vec!["_hover".into()],
            prop: "color".into(),
            value: serde_json::json!("red"),
            important: false,
        };
        assert_eq!(emitted_keys(&plans), set(&[owned.lookup_key().as_str()]));
        assert_eq!(
            OwnedLookupKey::from(&plans[0]),
            owned,
            "plan conversion keeps the five-tuple"
        );
    }
}
