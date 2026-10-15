//! Atlas usage scoring policy: how raw counts become `Usage` ratings, and how co-usage becomes
//! the `usedWith` map. Takes plain counts and file presence, never analysis state, so every
//! caller shares one set of thresholds and caps. `score_used_with` emits a bounded map: nothing
//! below two files, a denominator floor of three, rare pairs dropped, and at most twelve names.
//! Thresholds and caps stay here, out of the serialized model, so a policy change is made and
//! tested in one place.

use std::collections::BTreeMap;

use crate::model::{Usage, DEFAULT_USAGE_THRESHOLDS};

#[cfg(test)]
use crate::model::UsageThresholds;

/// A component must appear in at least this many files before it reports usedWith entries.
pub const USED_WITH_MIN_FILES: u32 = 2;

/// Co-usage ratios divide by at least this many files, so a target seen in one or two files
/// cannot push a pair into a high bucket.
pub const USED_WITH_DENOMINATOR_FLOOR: u32 = 3;

/// Upper bound on usedWith entries per component.
pub const USED_WITH_CAP: usize = 12;

/// Atlas usage scoring policy.
///
/// This is intentionally separate from the wire-model types so the thresholds
/// and scoring behavior are easy to document, test, and change without mixing
/// policy into serialization concerns.
pub fn score_usage(count: u32, total: u32) -> Usage {
    Usage::from_count_with_thresholds(count, total, &DEFAULT_USAGE_THRESHOLDS)
}

/// Scores one component's co-usage map.
///
/// `counts` maps each co-used component name to the number of files where it appeared with the
/// target, and `file_presence` is the number of files that contain the target. Pairs that score
/// rare are omitted, and when more than `USED_WITH_CAP` remain the highest counts win, ties
/// broken by name.
pub fn score_used_with(
    counts: &BTreeMap<String, u32>,
    file_presence: u32,
) -> BTreeMap<String, Usage> {
    if file_presence < USED_WITH_MIN_FILES {
        return BTreeMap::new();
    }

    let denominator = file_presence.max(USED_WITH_DENOMINATOR_FLOOR);
    let mut scored: Vec<(&String, u32, Usage)> = counts
        .iter()
        .map(|(name, &count)| (name, count, score_usage(count, denominator)))
        // A pair seen in under a tenth of the target's files is coincidence, not a companion.
        .filter(|(_, _, usage)| !matches!(usage, Usage::Rare | Usage::Unused))
        .collect();
    scored.sort_by(|left, right| right.1.cmp(&left.1).then_with(|| left.0.cmp(right.0)));

    scored
        .into_iter()
        .take(USED_WITH_CAP)
        .map(|(name, _, usage)| (name.clone(), usage))
        .collect()
}

#[cfg(test)]
pub fn usage_thresholds() -> UsageThresholds {
    DEFAULT_USAGE_THRESHOLDS
}
