//! React component usage analysis for frontend codebases.
//!
//! Atlas answers "how is this component actually used across this repo" —
//! not what type it has, but real call-site frequency, prop distributions,
//! examples, and co-location patterns.

mod analyzer;
mod config;
mod model;
mod output;
mod scanner;
mod react;

#[cfg(test)]
mod tests;

pub use analyzer::AtlasAnalyzer;
pub use config::AtlasConfig;
pub use model::{Component, ComponentInterface, ComponentProp, Usage};
