//! Scanner layer wiring.
//! Discovers scan files, resolves imports to files, and normalizes ids; exposes scan_workspace plus the shared resolver and id helpers.

mod imports;
mod model;
mod packages;
mod paths;
mod workspace;

#[cfg(test)]
pub(crate) use imports::extract_module_specifiers;
pub(crate) use model::{ScannedFile, ScannedWorkspace};
pub use packages::resolve_external_import_path;
pub(crate) use packages::ImportResolver;
#[cfg(test)]
pub(crate) use paths::normalize_relative_path;
pub(crate) use paths::symbol_id;
pub(crate) use workspace::scan_workspace;
