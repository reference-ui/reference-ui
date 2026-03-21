use std::path::Path;

use super::package::{external_package_path_for_file_id, join_package_module};
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
    let (package_name, subpath) = external_package_path_for_file_id(file_id)?;
    Some(join_package_module(
        package_name,
        strip_typescript_suffix(&subpath),
    ))
}
