//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod imports;
mod model;
mod packages;
mod paths;
mod workspace;

#[cfg(test)]
pub(crate) use imports::extract_module_specifiers;
pub(crate) use model::{ScannedFile, ScannedWorkspace};
pub use packages::resolve_external_import_path;
pub(crate) use packages::resolve_import;
#[cfg(test)]
pub(crate) use paths::normalize_relative_path;
pub(crate) use paths::symbol_id;
pub(crate) use workspace::scan_workspace;
