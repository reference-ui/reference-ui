use std::path::{Path, PathBuf};

pub(crate) fn path_to_unix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn symbol_id(file_id: &str, name: &str) -> String {
    format!("sym:{}#{name}", file_id)
}

pub(crate) fn module_specifier_for_file_id(file_id: &str) -> String {
    if let Some(external_module_specifier) = external_module_specifier_for_file_id(file_id) {
        return external_module_specifier;
    }

    let path = Path::new(file_id);
    let without_extension = strip_typescript_extension(path);
    let mut module = path_to_unix(&without_extension);
    if !module.starts_with("./") {
        module = format!("./{module}");
    }
    module
}

pub(crate) fn package_name_from_file_id(file_id: &str) -> String {
    package_name_for_file_id(file_id).unwrap_or_else(|| "user".to_string())
}

pub(super) fn split_package_specifier(source_module: &str) -> Option<(String, Option<String>)> {
    if source_module.is_empty() || source_module.starts_with('.') {
        return None;
    }

    let segments = source_module.split('/').collect::<Vec<_>>();
    if segments.first()?.starts_with('@') {
        let package_name = format!("{}/{}", segments.first()?, segments.get(1)?);
        let subpath = (segments.len() > 2).then(|| segments[2..].join("/"));
        return Some((package_name, subpath));
    }

    let package_name = segments.first()?.to_string();
    let subpath = (segments.len() > 1).then(|| segments[1..].join("/"));
    Some((package_name, subpath))
}

pub(super) fn strip_typescript_suffix(value: &str) -> String {
    for suffix in [".d.ts", ".d.mts", ".d.cts", ".ts", ".tsx"] {
        if let Some(stripped) = value.strip_suffix(suffix) {
            return stripped.to_string();
        }
    }

    value.to_string()
}

pub(super) fn strip_typescript_extension(path: &Path) -> PathBuf {
    let unix = path_to_unix(path);
    PathBuf::from(strip_typescript_suffix(&unix))
}

pub(super) fn normalize_relative_path(path: &Path) -> PathBuf {
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

pub(super) fn is_external_file_id(file_id: &str) -> bool {
    file_id.split('/').any(|segment| segment == "node_modules")
}

fn external_module_specifier_for_file_id(file_id: &str) -> Option<String> {
    let segments = file_id.split('/').collect::<Vec<_>>();
    let node_modules_index = segments
        .iter()
        .position(|segment| *segment == "node_modules")?;
    let package_segments = segments.get(node_modules_index + 1..)?;

    if package_segments.first()? == &"@types" {
        let package_name = types_package_to_library_name(package_segments.get(1)?);
        let subpath = strip_typescript_suffix(&package_segments[2..].join("/"));
        return Some(join_package_module(package_name, subpath));
    }

    if package_segments.first()?.starts_with('@') {
        let package_name = format!("{}/{}", package_segments.first()?, package_segments.get(1)?);
        let subpath = strip_typescript_suffix(&package_segments[2..].join("/"));
        return Some(join_package_module(package_name, subpath));
    }

    let package_name = package_segments.first()?.to_string();
    let subpath = strip_typescript_suffix(&package_segments[1..].join("/"));
    Some(join_package_module(package_name, subpath))
}

fn package_name_for_file_id(file_id: &str) -> Option<String> {
    let segments = file_id.split('/').collect::<Vec<_>>();
    let node_modules_index = segments
        .iter()
        .position(|segment| *segment == "node_modules")?;
    let package_segments = segments.get(node_modules_index + 1..)?;

    if package_segments.first()? == &"@types" {
        return Some(types_package_to_library_name(package_segments.get(1)?));
    }

    if package_segments.first()?.starts_with('@') {
        return Some(format!(
            "{}/{}",
            package_segments.first()?,
            package_segments.get(1)?
        ));
    }

    Some(package_segments.first()?.to_string())
}

fn join_package_module(package_name: String, subpath: String) -> String {
    if subpath.is_empty() || subpath == "index" {
        package_name
    } else {
        format!("{package_name}/{subpath}")
    }
}

fn types_package_to_library_name(package_name: &str) -> String {
    if let Some((scope, name)) = package_name.split_once("__") {
        return format!("@{scope}/{name}");
    }

    package_name.to_string()
}
