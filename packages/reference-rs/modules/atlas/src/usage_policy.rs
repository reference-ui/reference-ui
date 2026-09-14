//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use crate::model::{Usage, DEFAULT_USAGE_THRESHOLDS};

#[cfg(test)]
use crate::model::UsageThresholds;

/// Atlas usage scoring policy.
///
/// This is intentionally separate from the wire-model types so the thresholds
/// and scoring behavior are easy to document, test, and change without mixing
/// policy into serialization concerns.
pub fn score_usage(count: u32, total: u32) -> Usage {
    Usage::from_count_with_thresholds(count, total, &DEFAULT_USAGE_THRESHOLDS)
}

#[cfg(test)]
pub fn usage_thresholds() -> UsageThresholds {
    DEFAULT_USAGE_THRESHOLDS
}
