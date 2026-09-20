//! Expected-key vs final plan-key set join. The join is mechanical over
//! serialized keys: an exact key emitted because of another file, site, or
//! harvest still counts as present (incidental-coverage rule), because
//! runtime will paint. Only absent expected keys become userspace warnings.

use std::collections::BTreeSet;

/// Expected keys missing from the final emitted set, in sorted order.
/// Present keys are successes and return nothing for them.
pub fn missing_keys(expected: &BTreeSet<String>, emitted: &BTreeSet<String>) -> Vec<String> {
    expected.difference(emitted).cloned().collect()
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
}
