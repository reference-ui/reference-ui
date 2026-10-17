//! Package-level lookups: which external packages the app imports or includes, which parsed module is a
//! package's index file, which modules belong to the app, and how a package-scoped name finds its component.
//! A package is named by its `@scope/name` specifier and matched against each module's display source. Nothing
//! here reads from disk; every answer comes from the parsed graph the caller already holds.

use super::exports::{resolve_default_component_export, resolve_named_component_export};
use crate::config::AtlasConfig;
use crate::internal::ModuleInfo;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

pub(crate) fn collect_referenced_packages<'a, I>(modules: I) -> BTreeSet<String>
where
    I: Iterator<Item = &'a ModuleInfo>,
{
    let mut packages = BTreeSet::new();
    for module in modules {
        for binding in module.imports.values() {
            if binding.source.starts_with('@') {
                packages.insert(binding.source.clone());
            }
        }
    }
    packages
}

pub(crate) fn collect_included_packages(config: &AtlasConfig) -> BTreeMap<String, BTreeSet<String>> {
    let mut packages = BTreeMap::new();
    for pattern in config.include.clone().unwrap_or_default() {
        if !pattern.starts_with('@') {
            continue;
        }
        if let Some((source, component)) = pattern.split_once(':') {
            packages
                .entry(source.to_string())
                .or_insert_with(BTreeSet::new)
                .insert(component.to_string());
        } else {
            packages.entry(pattern).or_insert_with(BTreeSet::new);
        }
    }
    packages
}

pub(crate) fn resolve_package_index<'a, I>(paths: I) -> Option<PathBuf>
where
    I: Iterator<Item = &'a PathBuf>,
{
    paths
        .into_iter()
        .filter(|path| is_package_index_module(path))
        .min_by(|left, right| {
            left.components()
                .count()
                .cmp(&right.components().count())
                .then_with(|| left.cmp(right))
        })
        .cloned()
}

pub(crate) fn is_local_component_module(module: &ModuleInfo, app_root: &Path) -> bool {
    module.path.starts_with(app_root.join("src/components"))
}

fn is_package_index_module(path: &Path) -> bool {
    matches!(
        path.file_name().and_then(|name| name.to_str()),
        Some("index.ts") | Some("index.tsx") | Some("index.js") | Some("index.jsx")
    )
}

pub(super) fn resolve_package_component_export(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_name: &str,
    export_name: &str,
) -> Option<(String, String)> {
    let package_paths = modules
        .iter()
        .filter(|(_, module)| module.display_source == package_name)
        .map(|(path, _)| path)
        .collect::<Vec<_>>();

    if let Some(index_path) = resolve_package_index(package_paths.into_iter()) {
        let resolved = if export_name == "default" {
            resolve_default_component_export(modules, &index_path)
        } else {
            resolve_named_component_export(modules, &index_path, export_name)
        };

        if resolved.is_some() {
            return resolved;
        }
    }

    modules.values().find_map(|module| {
        if module.display_source != package_name {
            return None;
        }

        if export_name == "default" {
            return resolve_default_component_export(modules, &module.path);
        }

        module
            .components
            .get(export_name)
            .map(|component| (component.name.clone(), component.source_display.clone()))
    })
}
