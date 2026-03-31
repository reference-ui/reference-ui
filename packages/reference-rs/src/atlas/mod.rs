//! React component usage analysis for frontend codebases.
//!
//! Atlas answers "how is this component actually used across this repo" —
//! not what type it has, but real call-site frequency, prop distributions,
//! examples, and co-location patterns.
//!
//! Not yet implemented. Module stubs exist so the crate compiles.

// All submodules are stubs — they compile but contain no implementation.

mod analyzer;
mod config;
mod model;
mod output;
mod scanner;
mod react;

pub use analyzer::AtlasAnalyzer;
pub use config::AtlasConfig;
