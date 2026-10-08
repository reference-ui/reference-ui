//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod module_specifier;
mod package;

use std::path::{Path, PathBuf};

use crate::constants::scanner::{NODE_MODULES_DIR, TS_PATH_SUFFIXES};

pub(crate) fn path_to_unix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

pub(crate) fn symbol_id(file_id: &str, name: &str) -> String {
    format!("sym:{}#{name}", file_id)
}

pub(crate) fn module_specifier_for_file_id(file_id: &str) -> String {
    module_specifier::module_specifier_for_file_id(file_id)
}

pub(crate) fn package_name_from_file_id(file_id: &str) -> String {
    package::package_name_from_file_id(file_id)
}

pub(crate) fn split_package_specifier(source_module: &str) -> Option<(String, Option<String>)> {
    package::split_package_specifier(source_module)
}

pub(super) fn strip_typescript_suffix(value: &str) -> String {
    for suffix in TS_PATH_SUFFIXES {
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

pub(crate) fn normalize_relative_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => push_parent_dir(&mut normalized),
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}

// Preserve leading `..` (dot-dot file ids above the scan root): popping past
// the root would swallow the escape and produce a bogus in-root candidate,
// killing barrel hops from followed packages in outDir-layout scans.
fn push_parent_dir(normalized: &mut PathBuf) {
    let pops_normal = matches!(
        normalized.components().next_back(),
        Some(std::path::Component::Normal(_))
    );
    if pops_normal {
        normalized.pop();
    } else {
        normalized.push("..");
    }
}

pub(crate) fn is_external_file_id(file_id: &str) -> bool {
    file_id
        .split('/')
        .any(|segment| segment == NODE_MODULES_DIR)
}
