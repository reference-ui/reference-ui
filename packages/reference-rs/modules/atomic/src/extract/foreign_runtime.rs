//! Foreign-runtime import bindings for the JSX tag gate.
//!
//! A published Reference package such as `@reference-ui/lib` (and its
//! `/primitives` subpath) or `@reference-ui/icons` ships its own runtime,
//! bound to its own system name, so every class its components mint carries
//! that name. A local name imported from one is therefore never an own host,
//! even when it spells a primitive (`Button`): the gate sends it down the
//! external path, which backs the upstream-qualified class the runtime mints.

use oxc_allocator::Vec as ArenaVec;
use oxc_ast::ast::{ImportDeclarationSpecifier, ImportOrExportKind};
use rustc_hash::FxHashSet;

/// Published Reference packages whose components render through their own runtime.
const FOREIGN_RUNTIME_PACKAGES: [&str; 2] = ["@reference-ui/lib", "@reference-ui/icons"];

/// True for a foreign-runtime package or any subpath of one.
fn is_foreign_runtime_package(source: &str) -> bool {
    FOREIGN_RUNTIME_PACKAGES.iter().any(|package| {
        source
            .strip_prefix(package)
            .is_some_and(|rest| rest.is_empty() || rest.starts_with('/'))
    })
}

/// Record every value local of a foreign-runtime import into `foreign`.
/// True when `source` is foreign, so the caller stops there.
pub(super) fn record(
    foreign: &mut FxHashSet<String>,
    source: &str,
    specifiers: &ArenaVec<'_, ImportDeclarationSpecifier<'_>>,
) -> bool {
    if !is_foreign_runtime_package(source) {
        return false;
    }
    foreign.extend(specifiers.iter().filter_map(value_local));
    true
}

/// The local name a specifier binds at runtime; type-only specifiers bind none.
fn value_local(spec: &ImportDeclarationSpecifier<'_>) -> Option<String> {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            (named.import_kind != ImportOrExportKind::Type).then(|| named.local.name.to_string())
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            Some(default.local.name.to_string())
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => Some(ns.local.name.to_string()),
    }
}
