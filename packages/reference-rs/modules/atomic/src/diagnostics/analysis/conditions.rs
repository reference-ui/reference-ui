//! Runtime `when` query shape for analysis. Shares condition lowering with
//! resolve so expectations name the same raw `when` strings runtime queries;
//! unknown conditions become dynamic-shape facts, never guessed keys. Slice 2.

use super::AnalysisInput;
use crate::diagnostics::DiagnosticFact;

/// Condition-shape facts. Empty until Slice 2.
pub fn expectations(_input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn condition_shape_predicts_nothing_yet() {
        let input = AnalysisInput {
            sources: Vec::new(),
        };
        assert!(expectations(&input).is_empty());
    }
}
