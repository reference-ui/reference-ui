//! Maps an import specifier to the module in the parsed graph that it names. The candidates follow the order a
//! TypeScript or JavaScript resolver tries: the bare path, then each source extension, then the index file of a
//! directory. A candidate counts only when the graph holds it, so a lookup answers `None` for bare specifiers and
//! for files outside the graph. Only the fallback path touches the filesystem, to canonicalize a candidate.

use crate::internal::ModuleInfo;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

pub(super) fn resolve_relative_module(
    modules: &HashMap<PathBuf, ModuleInfo>,
    from_module: &Path,
    specifier: &str,
) -> Option<PathBuf> {
    let base_dir = from_module.parent()?;
    let base = base_dir.join(specifier);
    let candidates = vec![
        base.clone(),
        base.with_extension("ts"),
        base.with_extension("tsx"),
        base.with_extension("js"),
        base.with_extension("jsx"),
        base.join("index.ts"),
        base.join("index.tsx"),
        base.join("index.js"),
        base.join("index.jsx"),
    ];

    candidates
        .iter()
        .find(|candidate| modules.contains_key(*candidate))
        .cloned()
        .or_else(|| {
            candidates
                .into_iter()
                .filter_map(normalize_existing_path)
                .find(|candidate| modules.contains_key(candidate))
        })
}

fn normalize_existing_path(path: PathBuf) -> Option<PathBuf> {
    std::fs::canonicalize(path).ok()
}
