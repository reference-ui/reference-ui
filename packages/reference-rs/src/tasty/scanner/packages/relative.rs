//! Relative import path resolution and declaration candidate enumeration.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use crate::tasty::constants::scanner::{TS_INDEX_FILENAMES, TS_PATH_EXTENSIONS};

use crate::tasty::scanner::paths::{normalize_relative_path, path_to_unix};

/// Whether filesystem lookup is allowed when resolving relative imports beyond the known set.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum FileLookup {
    Allowed,
    Denied,
}

pub(super) fn resolve_relative_import(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
    file_lookup: FileLookup,
) -> Option<String> {
    let current_path = Path::new(current_file_id);
    let base_dir = current_path.parent().unwrap_or_else(|| Path::new(""));
    let joined = normalize_relative_path(&base_dir.join(source_module));

    declaration_candidates(&joined, true)
        .into_iter()
        .map(|candidate| path_to_unix(&candidate))
        .find(|file_id| candidate_matches(root_dir, file_id, file_id_set, file_lookup))
}

pub(super) fn declaration_candidates(path: &Path, include_runtime_entry: bool) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    push_path_candidates(&mut candidates, path, include_runtime_entry);
    push_index_candidates(&mut candidates, path);

    candidates
}

fn declaration_path_for_runtime_entry(path: &Path) -> Option<PathBuf> {
    let extension = path.extension()?.to_str()?;
    let stem = path.file_stem()?.to_str()?;
    let parent = path.parent().unwrap_or_else(|| Path::new(""));

    match extension {
        "js" | "mjs" | "cjs" => Some(parent.join(format!("{stem}.d.ts"))),
        _ => None,
    }
}

fn candidate_matches(
    root_dir: &Path,
    file_id: &str,
    file_id_set: &BTreeSet<String>,
    file_lookup: FileLookup,
) -> bool {
    file_id_set.contains(file_id)
        || (matches!(file_lookup, FileLookup::Allowed) && root_dir.join(file_id).is_file())
}

fn push_path_candidates(candidates: &mut Vec<PathBuf>, path: &Path, include_runtime_entry: bool) {
    if path.extension().is_none() {
        push_unique_candidate(candidates, path.to_path_buf());
        push_extension_candidates(candidates, path);
        return;
    }

    if let Some(declaration_path) = declaration_path_for_runtime_entry(path) {
        push_unique_candidate(candidates, declaration_path);
        if include_runtime_entry {
            push_unique_candidate(candidates, path.to_path_buf());
        }
        return;
    }

    push_unique_candidate(candidates, path.to_path_buf());
}

fn push_extension_candidates(candidates: &mut Vec<PathBuf>, path: &Path) {
    for extension in TS_PATH_EXTENSIONS {
        push_unique_candidate(candidates, path.with_extension(extension));
    }
}

fn push_index_candidates(candidates: &mut Vec<PathBuf>, path: &Path) {
    for index_name in TS_INDEX_FILENAMES {
        push_unique_candidate(candidates, path.join(index_name));
    }
}

fn push_unique_candidate(candidates: &mut Vec<PathBuf>, candidate: PathBuf) {
    if !candidates.contains(&candidate) {
        candidates.push(candidate);
    }
}
