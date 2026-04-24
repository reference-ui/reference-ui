//! Resolver internals for expanding Reference style prop names from TypeScript.

mod error;
mod model;
mod path;
mod parser;
mod sync_root;
mod tracer;

pub use tracer::{collect_reference_style_prop_names, collect_style_prop_names};
pub use error::StyleTraceError;

pub(crate) use path::{
	is_ignorable_module_specifier, normalize_path, prefer_sync_root_source_module, resolve_local_module_path,
};
pub(crate) use sync_root::resolve_sync_root;
