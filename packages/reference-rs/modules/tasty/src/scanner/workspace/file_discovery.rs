//! Walks the include globs under the scan root and keeps the TypeScript sources the walk reaches, as sorted
//! root-relative file ids. The walk follows symlinks, so a link whose target is gone is skipped instead of failing
//! the whole scan: the CSS side already drops it, and the sync names the link once. Any other walk error, such as
//! a symlink loop, still fails the scan.

use std::collections::BTreeSet;
use std::path::Path;

use globwalk::{GlobWalkerBuilder, WalkError};

use crate::diagnostics::scan_failed;
use crate::scanner::paths::{is_external_file_id, path_to_unix};

pub(super) fn discover_file_ids(
    root_dir: &Path,
    include: &[String],
) -> Result<Vec<String>, String> {
    let walker = build_glob_walker(root_dir, include)?;
    walker
        .into_iter()
        .try_fold(BTreeSet::new(), |mut file_ids, entry| {
            let Some(entry) = walked_entry(entry)? else {
                return Ok(file_ids);
            };
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

/// The walk step's entry, or `None` for a dangling symlink the walk cannot read; every other error fails the scan.
fn walked_entry(
    entry: Result<globwalk::DirEntry, WalkError>,
) -> Result<Option<globwalk::DirEntry>, String> {
    match entry {
        Ok(entry) => Ok(Some(entry)),
        Err(err) if is_dangling_link(&err) => Ok(None),
        Err(err) => Err(scan_failed(format!("failed to walk scan root: {err}"))),
    }
}

/// True when the walk failed on a symlink whose target does not exist: the error names the link, carries
/// NotFound, and the link itself is still on disk. A loop or any other io failure is not dangling.
fn is_dangling_link(err: &WalkError) -> bool {
    let (Some(path), Some(io)) = (err.path(), err.io_error()) else {
        return false;
    };
    io.kind() == std::io::ErrorKind::NotFound
        && std::fs::symlink_metadata(path).is_ok_and(|meta| meta.file_type().is_symlink())
}

fn build_glob_walker(root_dir: &Path, include: &[String]) -> Result<globwalk::GlobWalker, String> {
    GlobWalkerBuilder::from_patterns(root_dir, include)
        .follow_links(true)
        .build()
        .map_err(|err| scan_failed(format!("failed to build glob walker: {err}")))
}

fn is_supported_source_entry(entry: &globwalk::DirEntry) -> bool {
    entry.file_type().is_file() && has_supported_source_extension(entry.path())
}

fn has_supported_source_extension(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|ext| ext.to_str()),
        Some("ts" | "tsx" | "mts" | "cts")
    )
}

fn normalized_file_id(root_dir: &Path, path: &Path) -> Result<String, String> {
    let relative = path.strip_prefix(root_dir).map_err(|err| {
        scan_failed(format!(
            "failed to normalize path {}: {err}",
            path.display()
        ))
    })?;
    Ok(path_to_unix(relative))
}
