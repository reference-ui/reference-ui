mod crawler;
mod discovery;
mod file_discovery;
mod policy;

use std::fs;
use std::path::Path;

use self::discovery::discover_reachable_files;
use self::file_discovery::discover_file_ids;
use super::model::{DiscoveredFile, ScannedFile, ScannedWorkspace};

pub(crate) fn scan_workspace(
    root_dir: &Path,
    include: &[String],
) -> Result<ScannedWorkspace, String> {
    let user_file_ids = discover_file_ids(root_dir, include)?;
    let discovered_files = discover_reachable_files(root_dir, user_file_ids)?;
    let file_id_set = discovered_files.keys().cloned().collect();
    let mut files = Vec::new();

    for (
        file_id,
        DiscoveredFile {
            module_specifier,
            library,
            ..
        },
    ) in discovered_files
    {
        let absolute_path = root_dir.join(&file_id);
        let source = fs::read_to_string(&absolute_path)
            .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))?;

        files.push(ScannedFile {
            file_id,
            module_specifier,
            library,
            source,
        });
    }

    Ok(ScannedWorkspace {
        root_dir: root_dir.to_path_buf(),
        files,
        file_ids: file_id_set,
    })
}

#[cfg(test)]
mod tests;
