//! Traced JSX style surface analysis. Predicts exact expected lookups for
//! style props and `css` objects on traced hosts, and records dynamic-shape
//! facts where any key component is unknown. Native `style` is excluded: it
//! never uses the runtime style-plan lookup. Slice 2 owns it.

use super::AnalysisInput;
use crate::diagnostics::DiagnosticFact;

/// Expectations for the traced JSX surface. Empty until Slice 2.
pub fn expectations(_input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jsx_surface_predicts_nothing_yet() {
        let input = AnalysisInput {
            sources: Vec::new(),
        };
        assert!(expectations(&input).is_empty());
    }
}
