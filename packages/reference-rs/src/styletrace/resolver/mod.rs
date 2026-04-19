//! Resolver internals for expanding Reference style prop names from TypeScript.

mod model;
mod parser;
mod tracer;
mod util;

pub use tracer::{collect_reference_style_prop_names, collect_style_prop_names};
pub use util::StyleTraceError;

pub(crate) use util::{
	is_ignorable_module_specifier, normalize_path, prefer_workspace_source_module, resolve_local_module_path,
	resolve_workspace_root,
};
