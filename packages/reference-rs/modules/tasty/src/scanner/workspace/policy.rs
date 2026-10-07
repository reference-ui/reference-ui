//! Discovery-phase import policy: which imports to follow and when.

use std::collections::BTreeSet;

use crate::scanner::model::ResolvedModule;
use crate::scanner::packages::{resolve_relative_import, FileLookup, ImportResolver};
use crate::scanner::paths::{
    is_external_file_id, module_specifier_for_file_id, package_name_from_file_id,
    split_package_specifier,
};

/// Everything known about the file currently being crawled.
pub(super) struct DiscoveryContext<'a> {
    pub(super) resolver: &'a ImportResolver,
    pub(super) file_id: &'a str,
    pub(super) is_user_file: bool,
    pub(super) current_library: &'a str,
    pub(super) external_depth: usize,
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

    // User files bridge external libraries via re-exports and follow scoped
    // plain imports for resolution; other plain imports stay local.
    let should_skip_external_import =
        should_skip_user_external_import(ctx.is_user_file, ctx.reexport_specifiers, source_module);
    if should_skip_external_import {
        return None;
    }

    let resolved = ctx.resolver.resolve_external(source_module)?;
    let external_depth = next_external_depth(ctx, &resolved.library)?;

    Some(ResolvedModule {
        external_depth,
        ..resolved
    })
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
        ctx.resolver.root_dir(),
        ctx.file_id,
        source_module,
        file_ids,
        file_lookup,
    )?;

    Some(resolved_module_from_file_id(file_id, ctx.external_depth))
}

fn resolved_module_from_file_id(file_id: String, external_depth: usize) -> ResolvedModule {
    ResolvedModule {
        module_specifier: module_specifier_for_file_id(&file_id),
        library: package_name_from_file_id(&file_id),
        file_id,
        external_depth,
    }
}

fn next_external_depth(ctx: &DiscoveryContext<'_>, target_library: &str) -> Option<usize> {
    if ctx.is_user_file {
        return Some(1);
    }

    if target_library == ctx.current_library {
        return Some(ctx.external_depth);
    }

    // Scan boundary (scanner README): from a library file we only follow
    // imports that stay within the same package. Cross-library hops end here.
    None
}

fn should_skip_user_external_import(
    is_user_file: bool,
    reexport_specifiers: &BTreeSet<String>,
    source_module: &str,
) -> bool {
    // Library files are governed by the same-package rule in
    // `next_external_depth`, not by this gate.
    if !is_user_file {
        return false;
    }
    // A user re-export bridges the library into the name index.
    if reexport_specifiers.contains(source_module) {
        return false;
    }
    // Scan boundary (scanner README): scoped plain imports are followed for
    // resolution (targets emit chunks without name entries); unscoped plain
    // imports stay local; dev-only packages are never followed.
    !is_scoped_module_specifier(source_module) || is_dev_dependency_specifier(source_module)
}

fn is_scoped_module_specifier(source_module: &str) -> bool {
    split_package_specifier(source_module)
        .is_some_and(|(package_name, _)| package_name.starts_with('@'))
}

fn is_dev_dependency_specifier(source_module: &str) -> bool {
    source_module.starts_with("@types/")
        || source_module.starts_with("vitest")
        || source_module.starts_with("@vitest")
        || source_module.starts_with("test")
}
