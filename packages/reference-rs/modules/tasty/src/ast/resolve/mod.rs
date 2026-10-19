//! Resolve layer wiring.
//! Turns extracted parser output into a connected symbol graph and exposes its output type plus the resolve_ast entry point.

mod graph;
mod index;
mod merge;
mod names;
mod namespaces;
mod resolver;

pub(crate) use graph::ResolvedTypeScriptGraph;
pub(crate) use index::resolve_ast;
