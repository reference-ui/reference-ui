use std::path::{Path, PathBuf};

use serde_json::Value;

use super::node_modules::installed_package_dirs;
use super::package_json::{package_export_target, read_package_json};
use super::relative::declaration_candidates;
use super::super::model::ResolvedModule;
use super::super::paths::{
    module_specifier_for_file_id, package_name_from_file_id, path_to_unix,
};

pub(super) fn find_installed_declaration_provider(
    root_dir: &Path,
    source_module: &str,
) -> Option<ResolvedModule> {
    for package_dir in installed_package_dirs(root_dir) {
        let package_json = read_package_json(&package_dir.join("package.json"));
        let Some(entry_path) = resolve_package_root_entry(&package_dir, package_json.as_ref())
        else {
            continue;
        };
        let file_id = path_to_unix(&entry_path.strip_prefix(root_dir).ok()?.to_path_buf());
        let resolved = ResolvedModule {
            module_specifier: module_specifier_for_file_id(&file_id),
            library: package_name_from_file_id(&file_id),
            file_id,
        };

        if resolved.module_specifier == source_module {
            return Some(resolved);
        }
    }

    None
}

pub(super) fn resolve_package_import_from_root(
    root_dir: &Path,
    package_name: &str,
    subpath: Option<&str>,
) -> Option<ResolvedModule> {
    let package_dir = root_dir.join("node_modules").join(package_name);
    if !package_dir.is_dir() {
        return None;
    }

    let package_json_path = package_dir.join("package.json");
    let package_json = read_package_json(&package_json_path);
    let entry_path = if let Some(subpath) = subpath {
        resolve_package_subpath(&package_dir, package_json.as_ref(), subpath)
    } else {
        resolve_package_root_entry(&package_dir, package_json.as_ref())
    }?;

    let file_id = path_to_unix(&entry_path.strip_prefix(root_dir).ok()?.to_path_buf());
    let library = package_name_from_file_id(&file_id);

    Some(ResolvedModule {
        file_id,
        module_specifier: source_module_for_package_path(package_name, subpath),
        library,
    })
}

fn resolve_package_root_entry(package_dir: &Path, package_json: Option<&Value>) -> Option<PathBuf> {
    for entry in package_root_entry_candidates(package_json) {
        if let Some(path) = first_existing_candidate(package_dir, &entry) {
            return Some(path);
        }
    }

    first_existing_candidate(package_dir, "index")
}

fn resolve_package_subpath(
    package_dir: &Path,
    package_json: Option<&Value>,
    subpath: &str,
) -> Option<PathBuf> {
    let export_key = format!("./{subpath}");
    if let Some(package_json) = package_json {
        if let Some(exports) = package_json.get("exports") {
            if let Some(target) = package_export_target(exports, &export_key) {
                if let Some(path) = first_existing_candidate(package_dir, &target) {
                    return Some(path);
                }
            }
        }
    }

    first_existing_candidate(package_dir, subpath)
}

fn package_root_entry_candidates(package_json: Option<&Value>) -> Vec<String> {
    let mut entries = Vec::new();

    if let Some(package_json) = package_json {
        for key in ["types", "typings"] {
            if let Some(value) = package_json.get(key).and_then(Value::as_str) {
                entries.push(value.to_string());
            }
        }

        if let Some(exports) = package_json.get("exports") {
            if let Some(target) = package_export_target(exports, ".") {
                entries.push(target);
            }
        }

        for key in ["module", "main"] {
            if let Some(value) = package_json.get(key).and_then(Value::as_str) {
                entries.push(value.to_string());
            }
        }
    }

    entries
}

fn first_existing_candidate(package_dir: &Path, entry: &str) -> Option<PathBuf> {
    declaration_candidates(&PathBuf::from(entry), false)
        .into_iter()
        .map(|candidate| package_dir.join(candidate))
        .find(|candidate| candidate.is_file())
}

fn source_module_for_package_path(package_name: &str, subpath: Option<&str>) -> String {
    match subpath {
        Some(subpath) => format!("{package_name}/{subpath}"),
        None => package_name.to_string(),
    }
}
