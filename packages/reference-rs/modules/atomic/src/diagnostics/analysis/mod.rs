//! Independent AST analysis entry: what exact plans will runtime request?
//!
//! Diagnostics borrows the compiler's parsed programs (no second parse) and
//! predicts the exact runtime queries implied by source, then proof compares
//! those expectations against what the compiler actually emitted. It never
//! infers success from extraction's wants. Slice 2 implements the surfaces.

pub mod conditions;
pub mod css;
pub mod jsx;
pub mod values;

use super::DiagnosticFact;

/// One compile input offered to analysis: path, text, and the borrowed parse
/// owned by `atomic::compile`. The borrow ends before proof runs.
pub struct AnalysisInput<'a> {
    pub sources: Vec<AnalyzedSource<'a>>,
}

/// A single parsed source within an [`AnalysisInput`].
pub struct AnalyzedSource<'a> {
    pub path: &'a str,
    pub content: &'a str,
    pub program: &'a oxc_ast::ast::Program<'a>,
}

/// Predict exact expected lookups plus dynamic-shape facts for every source.
/// Empty until Slice 2 implements the surface walks.
pub fn analyze(input: &AnalysisInput<'_>) -> Vec<DiagnosticFact> {
    let mut facts = Vec::new();
    facts.extend(css::expectations(input));
    facts.extend(jsx::expectations(input));
    facts.extend(conditions::expectations(input));
    facts.extend(values::expectations(input));
    facts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn analysis_predicts_nothing_until_slice_2() {
        let input = AnalysisInput {
            sources: Vec::new(),
        };
        assert!(analyze(&input).is_empty());
    }
}
