//! Coordinates the directory-level wrapper tracing for public JSX components.
//! It encapsulates the parser, walker, and data models required to analyze component relationships.
//! Takes directory paths and file patterns to discover and process TSX files.
//! Emits the aggregated analysis results detailing style propagation through component hierarchies.

mod analyzer;
mod model;
mod module_resolution;
mod parser;
pub(crate) mod primitive_metadata;
mod source_files;
mod util;
mod walk;

pub use analyzer::{
    trace_style_bindings, trace_style_bindings_with_hint, trace_style_jsx_names,
    trace_style_jsx_names_with_hint,
};
pub use model::TracedBinding;
