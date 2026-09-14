//! Cascade layer definitions and preamble declarations for Reference UI stylesheets.
//! Establishes the canonical `@layer` ordering among reset, global, base, tokens, recipes, and utilities.
//! Guarantees strict cascade precedence and prevents unintended specificity wars across generated CSS rules.

/// The 6-layer contract emitted verbatim.
pub const LAYER_PREAMBLE: &str = "@layer reset, global, base, tokens, recipes, utilities;\n";
