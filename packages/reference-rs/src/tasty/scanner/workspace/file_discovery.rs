use std::collections::BTreeSet;
use std::path::Path;

use globwalk::GlobWalkerBuilder;

use crate::tasty::scanner::paths::{is_external_file_id, path_to_unix};

pub(super) fn discover_file_ids(
    root_dir: &Path,
    include: &[String],
) -> Result<Vec<String>, String> {
    let walker = build_glob_walker(root_dir, include)?;
    walker
        .into_iter()
        .try_fold(BTreeSet::new(), |mut file_ids, entry| {
            let entry = entry.map_err(|err| format!("failed to walk scan root: {err}"))?;
            if is_supported_source_entry(&entry) {
                let file_id = normalized_file_id(root_dir, entry.path())?;
                if !is_external_file_id(&file_id) {
                    file_ids.insert(file_id);
                }
            }
            Ok(file_ids)
        })
        .map(|file_ids| file_ids.into_iter().collect())
}

fn build_glob_walker(root_dir: &Path, include: &[String]) -> Result<globwalk::GlobWalker, String> {
    GlobWalkerBuilder::from_patterns(root_dir, include)
        .follow_links(true)
        .build()
        .map_err(|err| format!("failed to build glob walker: {err}"))
}

fn is_supported_source_entry(entry: &globwalk::DirEntry) -> bool {
    entry.file_type().is_file() && has_supported_source_extension(entry.path())
}

fn has_supported_source_extension(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|ext| ext.to_str()),
        Some("ts" | "tsx")
    )
}

fn normalized_file_id(root_dir: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(root_dir)
        .map_err(|err| format!("failed to normalize path {}: {err}", path.display()))?;
    Ok(path_to_unix(relative))
}
