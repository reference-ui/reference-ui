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
    external_package_path_for_file_id(file_id).map(|(package_name, _subpath)| package_name)
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

pub(super) fn external_package_path_for_file_id(file_id: &str) -> Option<(String, String)> {
    let package_segments = package_segments_after_node_modules(file_id)?;

    if package_segments.first()? == &TYPES_SCOPE_NAME {
        let package_name = types_package_to_library_name(package_segments.get(1)?);
        let subpath = package_segments.get(2..)?.join("/");
        return Some((package_name, subpath));
    }

    if package_segments.first()?.starts_with('@') {
        let package_name = format!("{}/{}", package_segments.first()?, package_segments.get(1)?);
        let subpath = package_segments.get(2..)?.join("/");
        return Some((package_name, subpath));
    }

    let package_name = package_segments.first()?.to_string();
    let subpath = package_segments.get(1..)?.join("/");
    Some((package_name, subpath))
}

fn package_segments_after_node_modules(file_id: &str) -> Option<Vec<&str>> {
    let segments = file_id.split('/').collect::<Vec<_>>();
    let node_modules_index = segments
        .iter()
        .position(|segment| *segment == NODE_MODULES_DIR)?;
    Some(segments.get(node_modules_index + 1..)?.to_vec())
}
