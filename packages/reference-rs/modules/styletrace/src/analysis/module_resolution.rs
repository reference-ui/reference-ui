//! Import-resolution helpers for the analysis layer.
//!
//! These helpers keep package and relative module resolution out of the main
//! JSX graph traversal so the analyzer stays focused on tracing decisions.

use std::path::{Path, PathBuf};

use module_graph::{DiskFs, ExtensionPolicy, ModuleKey, SpecifierLadder};

use crate::resolver::{
    is_ignorable_module_specifier, prefer_sync_root_source_module, StyleTraceError,
};

pub(super) fn resolve_relative_module(
    current_module: &Path,
    source: &str,
) -> Result<Option<PathBuf>, StyleTraceError> {
    Ok(resolve_specifier(current_module, source))
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

    let Some(resolved) = resolve_specifier(current_module, source) else {
        return Ok(None);
    };

    Ok(Some(prefer_sync_root_source_module(&resolved, sync_root)))
}

/// Resolve `source` authored in `current_module` through the shared ladder
/// with source-first probing. This mirrors `resolver::path::resolve_specifier`;
/// it lives here because `analysis` cannot see that private module directly.
fn resolve_specifier(current_module: &Path, source: &str) -> Option<PathBuf> {
    let fs = DiskFs;
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let from = ModuleKey::new(&current_module.to_string_lossy());
    ladder
        .resolve(&from, source)
        .ok()
        .map(|key| PathBuf::from(key.as_str()))
}
