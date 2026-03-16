use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

use super::model::ResolvedModule;
use super::paths::{
    is_external_file_id, module_specifier_for_file_id, normalize_relative_path,
    package_name_from_file_id, path_to_unix, split_package_specifier,
};

pub(crate) fn resolve_import(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
) -> Option<String> {
    if source_module.starts_with('.') {
        let allow_file_lookup = is_external_file_id(current_file_id);
        return resolve_relative_import(
            root_dir,
            current_file_id,
            source_module,
            file_id_set,
            allow_file_lookup,
        );
    }

    resolve_external_import(root_dir, source_module).map(|resolved| resolved.file_id)
}

pub(super) fn resolve_external_import(
    root_dir: &Path,
    source_module: &str,
) -> Option<ResolvedModule> {
    let (package_name, subpath) = split_package_specifier(source_module)?;

    resolve_package_import_from_root(root_dir, &package_name, subpath.as_deref())
        .or_else(|| find_installed_declaration_provider(root_dir, source_module))
}

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

fn find_installed_declaration_provider(
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

fn installed_package_dirs(root_dir: &Path) -> Vec<PathBuf> {
    let node_modules_dir = root_dir.join("node_modules");
    let Ok(entries) = fs::read_dir(node_modules_dir) else {
        return Vec::new();
    };

    let mut package_dirs = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };

        if name.starts_with('@') {
            let Ok(scoped_entries) = fs::read_dir(&path) else {
                continue;
            };
            for scoped_entry in scoped_entries.flatten() {
                let scoped_path = scoped_entry.path();
                if scoped_path.is_dir() {
                    package_dirs.push(scoped_path);
                }
            }
            continue;
        }

        package_dirs.push(path);
    }

    package_dirs
}

fn resolve_package_import_from_root(
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

fn read_package_json(path: &Path) -> Option<Value> {
    let source = fs::read_to_string(path).ok()?;
    serde_json::from_str(&source).ok()
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

fn package_export_target(exports: &Value, key: &str) -> Option<String> {
    match exports {
        Value::String(value) => (key == ".").then(|| value.to_string()),
        Value::Array(values) => values
            .iter()
            .find_map(|value| package_export_target(value, key)),
        Value::Object(map) => {
            if let Some(entry) = map.get(key) {
                return package_export_target(entry, ".");
            }

            if key == "." {
                for condition in ["types", "import", "default", "require"] {
                    if let Some(entry) = map.get(condition) {
                        if let Some(target) = package_export_target(entry, ".") {
                            return Some(target);
                        }
                    }
                }
            }

            None
        }
        _ => None,
    }
}

fn first_existing_candidate(package_dir: &Path, entry: &str) -> Option<PathBuf> {
    declaration_candidates(&PathBuf::from(entry), false)
        .into_iter()
        .map(|candidate| package_dir.join(candidate))
        .find(|candidate| candidate.is_file())
}

fn declaration_candidates(path: &Path, include_runtime_entry: bool) -> Vec<PathBuf> {
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

fn source_module_for_package_path(package_name: &str, subpath: Option<&str>) -> String {
    match subpath {
        Some(subpath) => format!("{package_name}/{subpath}"),
        None => package_name.to_string(),
    }
}
