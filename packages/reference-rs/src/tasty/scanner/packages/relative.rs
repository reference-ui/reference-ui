use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use super::super::paths::{normalize_relative_path, path_to_unix};

pub(super) fn resolve_relative_import(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
    allow_file_lookup: bool,
) -> Option<String> {
    let current_path = Path::new(current_file_id);
    let base_dir = current_path.parent().unwrap_or_else(|| Path::new(""));
    let joined = normalize_relative_path(&base_dir.join(source_module));

    for candidate in declaration_candidates(&joined, true) {
        let file_id = path_to_unix(&candidate);
        if file_id_set.contains(&file_id)
            || (allow_file_lookup && root_dir.join(&file_id).is_file())
        {
            return Some(file_id);
        }
    }

    None
}

pub(super) fn declaration_candidates(path: &Path, include_runtime_entry: bool) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    let mut push = |candidate: PathBuf| {
        if !candidates.contains(&candidate) {
            candidates.push(candidate);
        }
    };

    let has_extension = path.extension().is_some();
    if !has_extension {
        push(path.to_path_buf());
        for extension in ["d.ts", "d.mts", "d.cts", "ts", "tsx"] {
            push(path.with_extension(extension));
        }
    } else if let Some(declaration_path) = declaration_path_for_runtime_entry(path) {
        push(declaration_path);
        if include_runtime_entry {
            push(path.to_path_buf());
        }
    } else {
        push(path.to_path_buf());
    }

    for index_name in [
        "index.d.ts",
        "index.d.mts",
        "index.d.cts",
        "index.ts",
        "index.tsx",
    ] {
        push(path.join(index_name));
    }

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
