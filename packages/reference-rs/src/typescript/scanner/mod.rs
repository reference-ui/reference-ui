use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use globwalk::GlobWalkerBuilder;

#[derive(Debug, Clone)]
pub(crate) struct ScannedFile {
    pub(crate) file_id: String,
    pub(crate) module_specifier: String,
    pub(crate) source: String,
}

#[derive(Debug, Clone)]
pub(crate) struct ScannedWorkspace {
    pub(crate) files: Vec<ScannedFile>,
    pub(crate) file_ids: BTreeSet<String>,
}

pub(crate) fn scan_workspace(
    root_dir: &Path,
    include: &[String],
) -> Result<ScannedWorkspace, String> {
    let file_ids = discover_file_ids(root_dir, include)?;
    let file_id_set: BTreeSet<_> = file_ids.iter().cloned().collect();
    let mut files = Vec::new();

    for file_id in file_ids {
        let absolute_path = root_dir.join(&file_id);
        let source = fs::read_to_string(&absolute_path)
            .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))?;

        files.push(ScannedFile {
            module_specifier: module_specifier_for_file_id(&file_id),
            file_id,
            source,
        });
    }

    Ok(ScannedWorkspace {
        files,
        file_ids: file_id_set,
    })
}

pub(crate) fn resolve_local_import(
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
) -> Option<String> {
    if !source_module.starts_with('.') {
        return None;
    }

    let current_path = Path::new(current_file_id);
    let base_dir = current_path.parent().unwrap_or_else(|| Path::new(""));
    let joined = normalize_relative_path(&base_dir.join(source_module));

    let candidates = [
        joined.clone(),
        joined.with_extension("ts"),
        joined.with_extension("tsx"),
        joined.join("index.ts"),
        joined.join("index.tsx"),
    ];

    for candidate in candidates {
        let file_id = path_to_unix(&candidate);
        if file_id_set.contains(&file_id) {
            return Some(file_id);
        }
    }

    None
}

pub(crate) fn path_to_unix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn symbol_id(file_id: &str, name: &str) -> String {
    format!("sym:{}#{name}", file_id)
}

fn discover_file_ids(root_dir: &Path, include: &[String]) -> Result<Vec<String>, String> {
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

fn module_specifier_for_file_id(file_id: &str) -> String {
    let path = Path::new(file_id);
    let without_extension = path.with_extension("");
    let mut module = path_to_unix(&without_extension);
    if !module.starts_with("./") {
        module = format!("./{module}");
    }
    module
}

fn normalize_relative_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}
