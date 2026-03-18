use std::path::Path;

use crate::tasty::constants::scanner::{NODE_MODULES_DIR, TYPES_SCOPE_NAME};

use super::package::{join_package_module, types_package_to_library_name};
use super::{path_to_unix, strip_typescript_extension, strip_typescript_suffix};

pub(super) fn module_specifier_for_file_id(file_id: &str) -> String {
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

fn external_module_specifier_for_file_id(file_id: &str) -> Option<String> {
    let segments = file_id.split('/').collect::<Vec<_>>();
    let node_modules_index = segments
        .iter()
        .position(|segment| *segment == NODE_MODULES_DIR)?;
    let package_segments = segments.get(node_modules_index + 1..)?;

    if package_segments.first()? == &TYPES_SCOPE_NAME {
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
