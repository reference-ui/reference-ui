//! Contains the resolver internals for expanding Reference style prop names from TypeScript type definitions.
//!
//! It coordinates the parser, tracer, and data models required to perform type resolution across a graph.
//! Takes raw TypeScript or TSX file paths and their associated context as input.
//! Emits fully resolved type trees or sets of concrete style property strings.

mod error;
mod model;
mod parser;
mod path;
mod sync_root;
mod tracer;

pub use error::StyleTraceError;
pub use tracer::{
    collect_declared_prop_names, collect_reference_style_prop_names, collect_style_prop_names,
};

pub(crate) use path::{
    is_ignorable_module_specifier, normalize_path, prefer_sync_root_source_module,
};
pub(crate) use sync_root::resolve_sync_root;
