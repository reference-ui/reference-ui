//! Exact-value vs unknown-value classification for analysis. A slot whose
//! every key component is statically known becomes an exact expectation;
//! anything else becomes a dynamic-shape fact. No harvest counts and no
//! syntax suspicion feed this verdict. Slice 2 owns it.

use super::AnalysisInput;
use crate::diagnostics::DiagnosticFact;

/// Value-classification facts. Empty until Slice 2.
pub fn expectations(_input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn value_classification_predicts_nothing_yet() {
        let input = AnalysisInput {
            sources: Vec::new(),
        };
        assert!(expectations(&input).is_empty());
    }
}
