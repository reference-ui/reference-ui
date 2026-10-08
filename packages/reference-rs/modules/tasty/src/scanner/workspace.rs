//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod crawler;
mod discovery;
mod file_discovery;
mod policy;

use std::fs;
use std::path::Path;
use std::rc::Rc;

use self::discovery::discover_reachable_files;
use self::file_discovery::discover_file_ids;
use super::model::{DiscoveredFile, ScannedFile, ScannedWorkspace};
use super::packages::ImportResolver;
use crate::diagnostics::scan_failed;

/// Discover and read every reachable file. The resolver built here is carried
/// on the workspace so extraction shares the same resolution memo.
pub(crate) fn scan_workspace(
    root_dir: &Path,
    include: &[String],
) -> Result<ScannedWorkspace, String> {
    let resolver = Rc::new(ImportResolver::new(root_dir));
    let user_file_ids = discover_file_ids(root_dir, include)?;
    let discovery = discover_reachable_files(&resolver, user_file_ids)?;
    let file_id_set = discovery.files.keys().cloned().collect();
    let mut files = Vec::new();

    for (
        file_id,
        DiscoveredFile {
            module_specifier,
            library,
            ..
        },
    ) in discovery.files
    {
        let absolute_path = root_dir.join(&file_id);
        let source = fs::read_to_string(&absolute_path).map_err(|err| {
            scan_failed(format!(
                "failed to read {}: {err}",
                absolute_path.display()
            ))
        })?;

        files.push(ScannedFile {
            file_id,
            module_specifier,
            library,
            source,
        });
    }

    Ok(ScannedWorkspace {
        files,
        file_ids: file_id_set,
        bridged_libraries: discovery.bridged_libraries,
        resolver,
    })
}

#[cfg(test)]
mod tests;
