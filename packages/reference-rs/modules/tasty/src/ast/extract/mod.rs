//! Extract submodule wiring.
//! Declares the Oxc-facing parsing passes and shares the extraction context, scope, and shell-sink types across them.

mod comments;
mod context;
mod infer;
mod members;
mod module_bindings;
mod namespaces;
mod pipeline;
mod statements;
mod symbols;
mod type_references;
mod types;
mod util;
mod values;

pub(crate) use context::{ExtractionContext, ShellSink, StatementScope};
pub(super) use pipeline::extract_files;
pub(super) use util::slice_span;
