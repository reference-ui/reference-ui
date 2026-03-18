use std::collections::BTreeSet;
use std::path::Path;

use super::super::model::ResolvedModule;
use super::super::packages::{resolve_external_import, resolve_relative_import};
use super::super::paths::{
    is_external_file_id, module_specifier_for_file_id, package_name_from_file_id,
};

pub(super) fn resolve_import_for_discovery(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    known_file_ids: &BTreeSet<String>,
    user_file_ids: &BTreeSet<String>,
    is_user_file: bool,
    reexport_specifiers: &BTreeSet<String>,
    current_library: &str,
) -> Option<ResolvedModule> {
    if source_module.starts_with('.') {
        let file_id = if is_external_file_id(current_file_id) {
            resolve_relative_import(
                root_dir,
                current_file_id,
                source_module,
                known_file_ids,
                true,
            )?
        } else {
            resolve_relative_import(
                root_dir,
                current_file_id,
                source_module,
                user_file_ids,
                false,
            )?
        };

        return Some(ResolvedModule {
            module_specifier: module_specifier_for_file_id(&file_id),
            library: package_name_from_file_id(&file_id),
            file_id,
        });
    }

    if is_user_file && !reexport_specifiers.contains(source_module) {
        return None;
    }
    if !is_user_file {
        let resolved = resolve_external_import(root_dir, source_module)?;
        if resolved.library != current_library {
            return None;
        }
        return Some(resolved);
    }

    resolve_external_import(root_dir, source_module)
}
