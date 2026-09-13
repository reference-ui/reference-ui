//! Atomic CSS stylesheet emission, layer ordering, and output formatting.
//! Assembles deduplicated atomic rules into canonical CSS cascade layers and bundles accompanying diagnostics.
//! Serves as the final compilation stage producing ready-to-inject stylesheets for browser and build environments.

pub mod emitter;
pub mod layers;
pub mod name;

pub use emitter::build_stylesheet;
use serde::{Deserialize, Serialize};
use crate::diagnostics::Diagnostic;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetOutput {
    pub css: String,
    pub diagnostics: Vec<Diagnostic>,
}

impl StylesheetOutput {
    pub fn new(css: String, diagnostics: Vec<Diagnostic>) -> Self {
        Self { css, diagnostics }
    }
}
