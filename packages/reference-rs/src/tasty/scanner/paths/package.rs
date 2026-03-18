use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
use crate::tasty::constants::scanner::{
    NODE_MODULES_DIR, PACKAGE_INDEX_BASENAME, TYPES_SCOPE_NAME,
};

pub(super) fn package_name_from_file_id(file_id: &str) -> String {
    package_name_for_file_id(file_id).unwrap_or_else(|| USER_LIBRARY_NAME.to_string())
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

pub(super) fn package_name_for_file_id(file_id: &str) -> Option<String> {
    let segments = file_id.split('/').collect::<Vec<_>>();
    let node_modules_index = segments
        .iter()
        .position(|segment| *segment == NODE_MODULES_DIR)?;
    let package_segments = segments.get(node_modules_index + 1..)?;

    if package_segments.first()? == &TYPES_SCOPE_NAME {
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

pub(super) fn join_package_module(package_name: String, subpath: String) -> String {
    if subpath.is_empty() || subpath == PACKAGE_INDEX_BASENAME {
        package_name
    } else {
        format!("{package_name}/{subpath}")
    }
}

pub(super) fn types_package_to_library_name(package_name: &str) -> String {
    if let Some((scope, name)) = package_name.split_once("__") {
        return format!("@{scope}/{name}");
    }

    package_name.to_string()
}
