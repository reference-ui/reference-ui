//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod graph;
mod index;
mod names;
mod resolver;

pub(crate) use graph::ResolvedTypeScriptGraph;
pub(crate) use index::resolve_ast;
