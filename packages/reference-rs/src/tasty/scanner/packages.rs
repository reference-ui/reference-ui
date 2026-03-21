//! External and relative import resolution dispatch.

mod node_modules;
mod package_entry;
mod package_json;
mod relative;

use std::collections::BTreeSet;
use std::path::Path;

use self::package_entry::{find_installed_declaration_provider, resolve_package_import_from_root};
use super::model::ResolvedModule;
use super::paths::{is_external_file_id, split_package_specifier};

pub(crate) use relative::FileLookup;

pub(crate) fn resolve_import(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
) -> Option<String> {
    if source_module.starts_with('.') {
        let file_lookup = if is_external_file_id(current_file_id) {
            FileLookup::Allowed
        } else {
            FileLookup::Denied
        };
        return resolve_relative_import(
            root_dir,
            current_file_id,
            source_module,
            file_id_set,
            file_lookup,
        );
    }

    resolve_external_import(root_dir, source_module).map(|resolved| resolved.file_id)
}

pub(super) fn resolve_relative_import(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
    file_lookup: FileLookup,
) -> Option<String> {
    relative::resolve_relative_import(
        root_dir,
        current_file_id,
        source_module,
        file_id_set,
        file_lookup,
    )
}

pub(super) fn resolve_external_import(
    root_dir: &Path,
    source_module: &str,
) -> Option<ResolvedModule> {
    let (package_name, subpath) = split_package_specifier(source_module)?;

    resolve_package_import_from_root(root_dir, &package_name, subpath.as_deref())
        .or_else(|| find_installed_declaration_provider(root_dir, source_module))
}

#[cfg(test)]
mod tests;
