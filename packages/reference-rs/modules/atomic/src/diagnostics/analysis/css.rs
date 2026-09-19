//! Imported `css()` surface analysis. Predicts exact expected lookups for
//! static style objects passed to the traced `css()` import, and records
//! dynamic-shape facts where any key component is unknown. Slice 2 owns it.

use super::AnalysisInput;
use crate::diagnostics::DiagnosticFact;

/// Expectations for the `css()` surface. Empty until Slice 2.
pub fn expectations(_input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn css_surface_predicts_nothing_yet() {
        let input = AnalysisInput {
            sources: Vec::new(),
        };
        assert!(expectations(&input).is_empty());
    }
}
