use std::collections::BTreeSet;
use std::path::Path;

use globwalk::GlobWalkerBuilder;

use super::super::paths::path_to_unix;

pub(super) fn discover_file_ids(
    root_dir: &Path,
    include: &[String],
) -> Result<Vec<String>, String> {
    let walker = GlobWalkerBuilder::from_patterns(root_dir, include)
        .follow_links(true)
        .build()
        .map_err(|err| format!("failed to build glob walker: {err}"))?;

    let mut file_ids = BTreeSet::new();
    for entry in walker {
        let entry = entry.map_err(|err| format!("failed to walk scan root: {err}"))?;
        if !entry.file_type().is_file() {
            continue;
        }

        let Some(extension) = entry.path().extension().and_then(|ext| ext.to_str()) else {
            continue;
        };
        if !matches!(extension, "ts" | "tsx") {
            continue;
        }

        let relative = entry
            .path()
            .strip_prefix(root_dir)
            .map_err(|err| format!("failed to normalize path {}: {err}", entry.path().display()))?;
        file_ids.insert(path_to_unix(relative));
    }

    Ok(file_ids.into_iter().collect())
}
