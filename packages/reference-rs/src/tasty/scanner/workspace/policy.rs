//! Discovery-phase import policy: which imports to follow and when.

use std::collections::BTreeSet;
use std::path::Path;

use crate::tasty::scanner::model::ResolvedModule;
use crate::tasty::scanner::packages::{resolve_external_import, resolve_relative_import, FileLookup};
use crate::tasty::scanner::paths::{
    is_external_file_id, module_specifier_for_file_id, package_name_from_file_id,
};

/// Everything known about the file currently being crawled.
pub(super) struct DiscoveryContext<'a> {
    pub(super) root_dir: &'a Path,
    pub(super) file_id: &'a str,
    pub(super) current_library: &'a str,
    pub(super) is_user_file: bool,
    pub(super) known_file_ids: &'a BTreeSet<String>,
    pub(super) user_file_ids: &'a BTreeSet<String>,
    pub(super) reexport_specifiers: &'a BTreeSet<String>,
}

pub(super) fn resolve_import_for_discovery(
    ctx: &DiscoveryContext<'_>,
    source_module: &str,
) -> Option<ResolvedModule> {
    let is_relative_import = source_module.starts_with('.');
    if is_relative_import {
        return resolve_relative_import_for_discovery(ctx, source_module);
    }

    // User files only pull external libraries into the graph when the user
    // re-exports them. Plain imports are not part of the public bridge.
    let should_skip_external_import =
        should_skip_user_external_import(ctx.is_user_file, ctx.reexport_specifiers, source_module);
    if should_skip_external_import {
        return None;
    }

    // Once we are traversing inside an external package, stay inside that same
    // package. This keeps discovery scoped to the declarations that back the
    // symbols we already chose to bridge.
    if !ctx.is_user_file {
        return resolve_external_import_in_current_library(
            ctx.root_dir,
            source_module,
            ctx.current_library,
        );
    }

    resolve_external_import(ctx.root_dir, source_module)
}

fn resolve_relative_import_for_discovery(
    ctx: &DiscoveryContext<'_>,
    source_module: &str,
) -> Option<ResolvedModule> {
    let is_external = is_external_file_id(ctx.file_id);
    let (file_ids, file_lookup) = if is_external {
        // External declaration files are allowed to walk the filesystem because we
        // discover them incrementally from package entrypoints rather than from the
        // original user include globs.
        (ctx.known_file_ids, FileLookup::Allowed)
    } else {
        (ctx.user_file_ids, FileLookup::Denied)
    };
    let file_id = resolve_relative_import(
        ctx.root_dir,
        ctx.file_id,
        source_module,
        file_ids,
        file_lookup,
    )?;

    Some(resolved_module_from_file_id(file_id))
}

fn resolved_module_from_file_id(file_id: String) -> ResolvedModule {
    ResolvedModule {
        module_specifier: module_specifier_for_file_id(&file_id),
        library: package_name_from_file_id(&file_id),
        file_id,
    }
}

fn should_skip_user_external_import(
    is_user_file: bool,
    reexport_specifiers: &BTreeSet<String>,
    source_module: &str,
) -> bool {
    is_user_file && !reexport_specifiers.contains(source_module)
}

fn resolve_external_import_in_current_library(
    root_dir: &Path,
    source_module: &str,
    current_library: &str,
) -> Option<ResolvedModule> {
    let resolved = resolve_external_import(root_dir, source_module)?;
    (resolved.library == current_library).then_some(resolved)
}
