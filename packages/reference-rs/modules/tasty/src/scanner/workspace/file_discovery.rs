//! Lists the TypeScript sources the include globs reach, through the shared alias-aware walk.
//! The walk enters a directory only when an include can still reach it, never enters `node_modules`, and walks a symlink
//! once per directory and include state, so a loop or a clique of links stays bounded. Each real file is listed once,
//! under its real path when one is in scope, else under its first link alias in walk order. A candidate needs a ts, tsx,
//! mts or cts extension and must be a regular file through its metadata, so a dangling link is skipped, not a failure.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use shared::includes::IncludeScope;
use shared::walk::{walk_tree, WalkScope, WalkSink};

use crate::diagnostics::scan_failed;
use crate::scanner::paths::{is_external_file_id, path_to_unix};

/// The directory name the walk never enters, at any depth: installed packages reach the graph through imports instead.
const SKIPPED_DIR: &str = "node_modules";

/// The sorted root-relative ids of the in-scope sources, one per real file.
pub(super) fn discover_file_ids(root_dir: &Path, include: &[String]) -> Result<Vec<String>, String> {
    let root_text = root_dir.to_string_lossy().into_owned();
    let scope = IncludeScope::compile(include);
    let matcher = scope.matcher(Some(root_text.as_str()));
    let walk = WalkScope::new(include, &matcher);
    let mut sink = SourceSink::default();
    walk_tree(root_dir, &walk, Default::default(), &mut sink);
    let mut file_ids = BTreeSet::new();
    for path in &sink.listed {
        let file_id = normalized_file_id(root_dir, path)?;
        if !is_external_file_id(&file_id) {
            file_ids.insert(file_id);
        }
    }
    Ok(file_ids.into_iter().collect())
}

/// Tasty's walk sink: it keeps the TypeScript sources that are regular files, never enters `node_modules`, and records
/// each file the walk lists, in walk order.
#[derive(Default)]
struct SourceSink {
    listed: Vec<PathBuf>,
}

impl WalkSink for SourceSink {
    fn keeps_file(&self, path: &Path) -> bool {
        has_supported_source_extension(path) && is_regular_file(path)
    }

    fn skips_dir(&self, name: &str) -> bool {
        name == SKIPPED_DIR
    }

    fn file(&mut self, path: &Path) {
        self.listed.push(path.to_path_buf());
    }
}

fn has_supported_source_extension(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|ext| ext.to_str()),
        Some("ts" | "tsx" | "mts" | "cts")
    )
}

/// True when the path resolves, through its metadata, to a regular file. A link counts by its target, so a dangling link
/// does not; a FIFO, socket or device does not either, because the walk must never open one.
fn is_regular_file(path: &Path) -> bool {
    fs::metadata(path).is_ok_and(|meta| meta.is_file())
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

#[cfg(test)]
mod tests {
    use shared::walk::canonical_or_self;

    /// A canonical parent carries no verbatim prefix, so the walk's identity joins compare equal on Windows. The test runs on
    /// every platform; the prefix check only bites on Windows.
    #[test]
    fn canonical_paths_carry_no_verbatim_prefix() {
        let dir = std::env::temp_dir().join(format!("tasty-canonical-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("src")).expect("temp root");
        let canonical = canonical_or_self(&dir);
        assert!(!canonical.to_string_lossy().starts_with(r"\\?\"), "{}", canonical.display());
        assert!(canonical.join("src").is_dir(), "{}", canonical.display());
        std::fs::remove_dir_all(&dir).expect("cleanup");
    }
}
