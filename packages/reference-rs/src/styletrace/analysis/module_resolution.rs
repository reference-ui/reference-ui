//! Import-resolution helpers for the analysis layer.
//!
//! These helpers keep package and relative module resolution out of the main
//! JSX graph traversal so the analyzer stays focused on tracing decisions.

use std::path::{Path, PathBuf};

use crate::styletrace::resolver::{
    is_ignorable_module_specifier, normalize_path, prefer_sync_root_source_module,
    resolve_local_module_path, StyleTraceError,
};
use crate::tasty::resolve_external_import_path;

pub(super) fn resolve_relative_module(
    current_module: &Path,
    source: &str,
) -> Result<Option<PathBuf>, StyleTraceError> {
    let base = current_module.parent().unwrap_or(current_module);
    let candidate = normalize_path(&base.join(source));
    Ok(resolve_local_module_path(&candidate))
}

pub(super) fn resolve_imported_module(
    current_module: &Path,
    source: &str,
    sync_root: &Path,
) -> Result<Option<PathBuf>, StyleTraceError> {
    if source.starts_with('.') {
        return resolve_relative_module(current_module, source);
    }

    if is_ignorable_module_specifier(source) {
        return Ok(None);
    }

    let resolution_root = current_module.parent().unwrap_or(current_module);
    let Some(resolved) = resolve_external_import_path(resolution_root, source) else {
        return Ok(None);
    };

    Ok(Some(prefer_sync_root_source_module(&resolved, sync_root)))
}
