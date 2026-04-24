//! Styletrace is split into two internal subsystems:
//! a type-surface resolver that expands Reference style props and a JSX wrapper
//! analyzer that traces public components back to Reference primitives.

mod analysis;
mod resolver;

#[cfg(test)]
mod tests;

pub use analysis::{trace_style_jsx_names, trace_style_jsx_names_with_hint};
pub use resolver::{collect_reference_style_prop_names, collect_style_prop_names, StyleTraceError};
