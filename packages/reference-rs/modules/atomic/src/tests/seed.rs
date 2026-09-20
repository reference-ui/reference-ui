//! Seed contract for the atomic compile pipeline: an empty request emits
//! the six-layer preamble with no plans, no diagnostics, and no tokens.
//! Takes the default CompileRequest; anchors every station's empty baseline.

use crate::{compile, CompileRequest};

#[test]
fn test_compile_seed_contract() {
    let req = CompileRequest::default();
    let res = compile(&req).expect("compile seed contract");
    assert!(res
        .stylesheet
        .starts_with("@layer reset, global, base, tokens, recipes, utilities;"));
    assert!(res.css.as_ref().is_some_and(|c| c.is_empty()));
    assert!(res.style_plans.is_empty());
    assert!(res.diagnostics.is_empty());
    assert!(!res.stylesheet.contains("--colors-"));
}
