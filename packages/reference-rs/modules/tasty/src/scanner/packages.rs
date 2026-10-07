//! External and relative import resolution dispatch, memoized per scan.
//!
//! A scan resolves bare specifiers against `node_modules` and package
//! `exports` fields. Resolution depends only on the scan root and the
//! specifier text, so [`ImportResolver`] memoizes every external outcome —
//! negative results included — and every `package.json` read by absolute
//! path. One resolver is created per scan and shared across discovery and
//! extraction, so a repeated import never re-walks the disk. Relative
//! imports stay uncached: they depend on the importing file and its lookup
//! policy.

mod node_modules;
mod package_entry;
mod package_json;
mod relative;

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use serde_json::Value;

use self::package_entry::{find_installed_declaration_provider, resolve_package_import_from_root};
use super::model::ResolvedModule;
use super::paths::{is_external_file_id, split_package_specifier};

pub(crate) use relative::FileLookup;

/// Per-scan resolution state. It owns the scan root so every resolve site
/// shares one memo; `RefCell` keeps the cache behind shared borrows.
#[derive(Debug)]
pub(crate) struct ImportResolver {
    root_dir: PathBuf,
    external: RefCell<BTreeMap<String, Option<ResolvedModule>>>,
    package_json: RefCell<BTreeMap<PathBuf, Option<Value>>>,
}

impl ImportResolver {
    pub(crate) fn new(root_dir: &Path) -> Self {
        Self {
            root_dir: root_dir.to_path_buf(),
            external: RefCell::new(BTreeMap::new()),
            package_json: RefCell::new(BTreeMap::new()),
        }
    }

    pub(crate) fn root_dir(&self) -> &Path {
        &self.root_dir
    }

    /// Resolve an import to a file id. Relative imports depend on the
    /// importing file; bare specifiers go through the memo.
    pub(crate) fn resolve_import(
        &self,
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
            return self.resolve_relative_import(
                current_file_id,
                source_module,
                file_id_set,
                file_lookup,
            );
        }

        self.resolve_external(source_module)
            .map(|resolved| resolved.file_id)
    }

    pub(super) fn resolve_relative_import(
        &self,
        current_file_id: &str,
        source_module: &str,
        file_id_set: &BTreeSet<String>,
        file_lookup: FileLookup,
    ) -> Option<String> {
        relative::resolve_relative_import(
            &self.root_dir,
            current_file_id,
            source_module,
            file_id_set,
            file_lookup,
        )
    }

    /// Memoized external resolution; negative outcomes are cached too.
    pub(super) fn resolve_external(&self, source_module: &str) -> Option<ResolvedModule> {
        if let Some(cached) = self.external.borrow().get(source_module).cloned() {
            return cached;
        }

        let resolved = self.resolve_external_uncached(source_module);
        self.external
            .borrow_mut()
            .insert(source_module.to_string(), resolved.clone());
        resolved
    }

    fn resolve_external_uncached(&self, source_module: &str) -> Option<ResolvedModule> {
        let (package_name, subpath) = split_package_specifier(source_module)?;
        resolve_package_import_from_root(self, &package_name, subpath.as_deref())
            .or_else(|| find_installed_declaration_provider(self, source_module))
    }

    /// Memoized `package.json` read, keyed by absolute path.
    pub(super) fn read_package_json(&self, path: &Path) -> Option<Value> {
        if let Some(cached) = self.package_json.borrow().get(path).cloned() {
            return cached;
        }

        let value = package_json::read_package_json(path);
        self.package_json
            .borrow_mut()
            .insert(path.to_path_buf(), value.clone());
        value
    }
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
    ImportResolver::new(root_dir).resolve_external(source_module)
}

pub fn resolve_external_import_path(root_dir: &Path, source_module: &str) -> Option<PathBuf> {
    resolve_external_import(root_dir, source_module).map(|resolved| root_dir.join(resolved.file_id))
}

#[cfg(test)]
mod tests;
