//! Resolver internals for expanding Reference style prop names from TypeScript.

mod model;
mod parser;
mod tracer;
mod util;

pub use tracer::{collect_reference_style_prop_names, collect_style_prop_names};
pub use util::StyleTraceError;

pub(crate) use util::{normalize_path, resolve_local_module_path, resolve_workspace_root};
