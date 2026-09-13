//! React component usage analysis for frontend codebases.
//!
//! Atlas answers "how is this component actually used across this repo" —
//! not what type it has, but real call-site frequency, prop distributions,
//! examples, and co-location patterns.

mod analyzer;
mod config;
mod internal;
mod model;
mod output;
mod parser;
mod resolver;
mod scanner;
mod usage;
mod usage_policy;

#[cfg(test)]
mod tests;

pub use analyzer::AtlasAnalyzer;
pub use config::AtlasConfig;
#[allow(unused_imports)]
pub use model::{Component, ComponentInterface, ComponentProp, Usage};
#[allow(unused_imports)]
pub use output::{AtlasAnalysisResult, AtlasDiagnostic, AtlasDiagnosticCode};
