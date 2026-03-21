//! Package entrypoint resolution from `node_modules` layout and `package.json` exports.

use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::tasty::constants::scanner::{
    NODE_MODULES_DIR, PACKAGE_INDEX_BASENAME, PACKAGE_JSON_FILENAME,
};

use super::node_modules::installed_package_dirs;
use super::package_json::{package_export_target, read_package_json};
use super::relative::declaration_candidates;
use crate::tasty::scanner::model::ResolvedModule;
use crate::tasty::scanner::paths::{
    module_specifier_for_file_id, package_name_from_file_id, path_to_unix,
};

pub(super) fn find_installed_declaration_provider(
    root_dir: &Path,
    source_module: &str,
) -> Option<ResolvedModule> {
    for package_dir in installed_package_dirs(root_dir) {
        let package_json = read_package_json(&package_dir.join(PACKAGE_JSON_FILENAME));
        let Some(entry_path) = resolve_package_root_entry(&package_dir, package_json.as_ref())
        else {
            continue;
        };
        let resolved = resolved_module_from_entry_path(root_dir, entry_path, None)?;

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
    let package_dir = root_dir.join(NODE_MODULES_DIR).join(package_name);
    if !package_dir.is_dir() {
        return None;
    }

    let package_json_path = package_dir.join(PACKAGE_JSON_FILENAME);
    let package_json = read_package_json(&package_json_path);
    let entry_path = if let Some(subpath) = subpath {
        resolve_package_subpath(&package_dir, package_json.as_ref(), subpath)
    } else {
        resolve_package_root_entry(&package_dir, package_json.as_ref())
    }?;
    resolved_module_from_entry_path(
        root_dir,
        entry_path,
        Some(&source_module_for_package_path(package_name, subpath)),
    )
}

fn resolved_module_from_entry_path(
    root_dir: &Path,
    entry_path: PathBuf,
    module_specifier: Option<&str>,
) -> Option<ResolvedModule> {
    let file_id = path_to_unix(&entry_path.strip_prefix(root_dir).ok()?.to_path_buf());
    Some(ResolvedModule {
        library: package_name_from_file_id(&file_id),
        module_specifier: module_specifier
            .map(str::to_string)
            .unwrap_or_else(|| module_specifier_for_file_id(&file_id)),
        file_id,
    })
}

fn resolve_package_root_entry(package_dir: &Path, package_json: Option<&Value>) -> Option<PathBuf> {
    package_root_entry_candidates(package_json)
        .into_iter()
        .find_map(|entry| first_existing_candidate(package_dir, &entry))
        .or_else(|| first_existing_candidate(package_dir, PACKAGE_INDEX_BASENAME))
}

fn resolve_package_subpath(
    package_dir: &Path,
    package_json: Option<&Value>,
    subpath: &str,
) -> Option<PathBuf> {
    let export_key = format!("./{subpath}");
    package_json
        .and_then(|package_json| package_json.get("exports"))
        .and_then(|exports| package_export_target(exports, &export_key))
        .and_then(|target| first_existing_candidate(package_dir, &target))
        .or_else(|| first_existing_candidate(package_dir, subpath))
}

fn package_root_entry_candidates(package_json: Option<&Value>) -> Vec<String> {
    package_json
        .map(package_root_entry_candidates_from_package_json)
        .unwrap_or_default()
}

fn package_root_entry_candidates_from_package_json(package_json: &Value) -> Vec<String> {
    let mut entries = Vec::new();
    push_package_json_entries(&mut entries, package_json, ["types", "typings"]);
    push_exports_entry(&mut entries, package_json);
    push_package_json_entries(&mut entries, package_json, ["module", "main"]);
    entries
}

fn push_exports_entry(entries: &mut Vec<String>, package_json: &Value) {
    if let Some(target) = package_json
        .get("exports")
        .and_then(|exports| package_export_target(exports, "."))
    {
        entries.push(target);
    }
}

fn push_package_json_entries<const N: usize>(
    entries: &mut Vec<String>,
    package_json: &Value,
    keys: [&str; N],
) {
    for key in keys {
        if let Some(value) = package_json_string(package_json, key) {
            entries.push(value.to_string());
        }
    }
}

fn package_json_string<'a>(package_json: &'a Value, key: &str) -> Option<&'a str> {
    package_json.get(key).and_then(Value::as_str)
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
