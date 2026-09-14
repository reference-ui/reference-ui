//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod comments;
mod context;
mod infer;
mod members;
mod module_bindings;
mod pipeline;
mod statements;
mod symbols;
mod type_references;
mod types;
mod util;
mod values;

pub(crate) use context::ExtractionContext;
pub(super) use pipeline::extract_files;
pub(super) use util::slice_span;
