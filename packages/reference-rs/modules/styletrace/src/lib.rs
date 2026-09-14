//! The primary entry point for the styletrace crate, exposing the core API for component style analysis.
//! It is split into two internal subsystems: a synced type-surface resolver for Reference style props,
//! and a JSX wrapper analyzer that traces public components back to Reference primitives.
//! It takes a workspace path or file paths as input and coordinates the analysis process.
//! The output is a set of collected style properties or analyzed component graph representations.

mod analysis;
mod resolver;

#[cfg(test)]
mod tests;

pub use analysis::{trace_style_jsx_names, trace_style_jsx_names_with_hint};
pub use resolver::{collect_reference_style_prop_names, collect_style_prop_names, StyleTraceError};
