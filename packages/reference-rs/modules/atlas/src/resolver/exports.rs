//! Resolves component exports across re-export chains: a named export, the default export, and the full set of
//! public components a package index exposes, including components reached through star re-exports. Each walk
//! follows named re-exports first and star re-exports second, and a visited set stops cycles. It takes the module
//! map plus an export name or module path, and answers with the component's `(name, source)` pair or its
//! public-component record.

use super::paths::resolve_relative_module;
use crate::internal::{component_key, ModuleInfo};
use std::collections::{BTreeMap, HashMap, HashSet};
use std::path::{Path, PathBuf};

pub(crate) struct PublicPackageComponent {
    pub export_name: String,
    pub component_name: String,
    pub module_path: PathBuf,
}

pub(crate) fn collect_public_package_components(
    modules: &HashMap<PathBuf, ModuleInfo>,
    index_path: &Path,
) -> Vec<PublicPackageComponent> {
    let Some(module) = modules.get(index_path) else {
        return Vec::new();
    };

    let mut components = BTreeMap::new();

    for component in module.components.values() {
        components.insert(
            component_key(&component.name, &component.source_display),
            PublicPackageComponent {
                export_name: component.name.clone(),
                component_name: component.name.clone(),
                module_path: index_path.to_path_buf(),
            },
        );
    }

    if let Some((module_path, component_name, source)) =
        resolve_default_component_export_target(modules, index_path)
    {
        components
            .entry(component_key(&component_name, &source))
            .or_insert(PublicPackageComponent {
                export_name: "default".to_string(),
                component_name,
                module_path,
            });
    }

    for export_name in module.named_component_reexports.keys() {
        if let Some((module_path, component_name, source)) =
            resolve_named_component_export_target(modules, index_path, export_name)
        {
            components.insert(
                component_key(&component_name, &source),
                PublicPackageComponent {
                    export_name: export_name.clone(),
                    component_name,
                    module_path,
                },
            );
        }
    }

    let mut star_visited = HashSet::new();
    collect_star_reexport_components(modules, index_path, &mut star_visited, &mut components);

    components.into_values().collect()
}

pub(super) fn resolve_named_component_export(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
    export_name: &str,
) -> Option<(String, String)> {
    resolve_named_component_export_target(modules, module_path, export_name)
        .map(|(_, name, source)| (name, source))
}

pub(super) fn resolve_default_component_export(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
) -> Option<(String, String)> {
    resolve_default_component_export_target(modules, module_path)
        .map(|(_, name, source)| (name, source))
}

/// Adds the components a module's star re-exports bring in, recursing through each re-exported module in turn.
fn collect_star_reexport_components(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
    visited: &mut HashSet<PathBuf>,
    out: &mut BTreeMap<String, PublicPackageComponent>,
) {
    let Some(module) = modules.get(module_path) else {
        return;
    };
    for source in &module.star_reexports {
        let Some(target_path) = resolve_relative_module(modules, module_path, source) else {
            continue;
        };
        if !visited.insert(target_path.clone()) {
            continue;
        }
        let Some(target_module) = modules.get(&target_path) else {
            continue;
        };
        insert_star_components(modules, &target_path, target_module, out);
        collect_star_reexport_components(modules, &target_path, visited, out);
    }
}

fn insert_star_components(
    modules: &HashMap<PathBuf, ModuleInfo>,
    target_path: &Path,
    target: &ModuleInfo,
    out: &mut BTreeMap<String, PublicPackageComponent>,
) {
    for component in target.components.values() {
        out.insert(
            component_key(&component.name, &component.source_display),
            PublicPackageComponent {
                export_name: component.name.clone(),
                component_name: component.name.clone(),
                module_path: target_path.to_path_buf(),
            },
        );
    }
    for export_name in target.named_component_reexports.keys() {
        if let Some((module_path, comp_name, source_display)) =
            resolve_named_component_export_target(modules, target_path, export_name)
        {
            out.insert(
                component_key(&comp_name, &source_display),
                PublicPackageComponent {
                    export_name: export_name.clone(),
                    component_name: comp_name,
                    module_path,
                },
            );
        }
    }
}

fn resolve_named_component_export_target(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
    export_name: &str,
) -> Option<(PathBuf, String, String)> {
    let mut visited = HashSet::new();
    resolve_named_component_export_target_inner(modules, module_path, export_name, &mut visited)
}

fn resolve_named_component_export_target_inner(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
    export_name: &str,
    visited: &mut HashSet<PathBuf>,
) -> Option<(PathBuf, String, String)> {
    if export_name == "default" {
        return resolve_default_component_export_target(modules, module_path);
    }

    if !visited.insert(module_path.to_path_buf()) {
        return None;
    }

    let module = modules.get(module_path)?;
    if let Some(component) = module.components.get(export_name) {
        return Some((
            module.path.clone(),
            component.name.clone(),
            component.source_display.clone(),
        ));
    }
    if let Some(reexport) = module.named_component_reexports.get(export_name) {
        if let Some(target_module) = resolve_relative_module(modules, module_path, &reexport.source) {
            return resolve_named_component_export_target_inner(
                modules,
                &target_module,
                &reexport.imported,
                visited,
            );
        }
    }
    module.star_reexports.iter().find_map(|source| {
        let target_module = resolve_relative_module(modules, module_path, source)?;
        resolve_named_component_export_target_inner(modules, &target_module, export_name, visited)
    })
}

fn resolve_default_component_export_target(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
) -> Option<(PathBuf, String, String)> {
    let module = modules.get(module_path)?;
    if let Some(name) = module.default_component.as_ref() {
        let component = module.components.get(name)?;
        return Some((
            module.path.clone(),
            component.name.clone(),
            component.source_display.clone(),
        ));
    }

    if let Some(reexport) = module.named_component_reexports.get("default") {
        if let Some(target_module) = resolve_relative_module(modules, module_path, &reexport.source) {
            return resolve_named_component_export_target(
                modules,
                &target_module,
                &reexport.imported,
            );
        }
    }

    None
}
