//! Workspace scan pass.
//! Expands include globs into user files, crawls reachable imports under the scan boundary, and returns the scanned file set.
//! The crawl reads and screens each file once, so this pass only moves the crawled text into the scanned files.

mod crawler;
mod discovery;
mod file_discovery;
mod policy;

use std::path::Path;
use std::rc::Rc;

use self::discovery::discover_reachable_files;
use self::file_discovery::discover_file_ids;
use super::model::{DiscoveredFile, ScannedFile, ScannedWorkspace};
use super::packages::ImportResolver;

/// Discover every reachable file, carrying the text the crawl read. The resolver built here is carried
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
            source,
            ..
        },
    ) in discovery.files
    {
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
