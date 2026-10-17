//! Resolves a props type name to the type that declares it, then flattens that declaration into the prop list a
//! component exposes. The lookup follows the module's own declarations, its imports, its named re-exports and its
//! star re-exports, in that order; a package import is resolved through the package's index file with a scan of
//! that package's modules as the fallback. The visited sets break re-export cycles, and an unresolved name answers
//! `None` so the caller can keep the name as written. It takes the `TypeScope` plus a module path or type
//! expression and emits resolved types, prop templates or allowed-value lists.

use super::paths::resolve_relative_module;
use super::TypeScope;
use crate::internal::{
    ImportBinding, ModuleInfo, PropDef, PropTemplate, PropValueType, ResolvedType, TypeDef, TypeExpr,
};
use std::collections::{BTreeMap, HashMap, HashSet};
use std::path::{Path, PathBuf};

pub(super) fn resolve_named_type(
    scope: TypeScope<'_>,
    module_path: &Path,
    type_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let visit_key = format!("{}::{type_name}", module_path.display());
    if !visited.insert(visit_key) {
        return None;
    }

    let module = scope.modules.get(module_path)?;
    if let Some(type_def) = module.types.get(type_name) {
        return Some(resolved_from_module(module, type_name, type_def));
    }
    if let Some(binding) = module.imports.get(type_name) {
        if let Some(answer) = resolve_through_import(scope, module_path, binding, visited) {
            return answer;
        }
    }
    resolve_reexported_type(scope, module_path, type_name, visited)
}

/// `Some(answer)` when the binding decides the name: a package import, or a relative import whose module is in the
/// graph. `None` leaves the name to the re-export search. The import map is keyed by local name, so a binding's
/// local name is the lookup key.
fn resolve_through_import(
    scope: TypeScope<'_>,
    module_path: &Path,
    binding: &ImportBinding,
    visited: &mut HashSet<String>,
) -> Option<Option<ResolvedType>> {
    let imported = binding.imported.clone().unwrap_or_else(|| binding.local.clone());
    if binding.source.starts_with('@') {
        let answer = resolve_package_type(scope, &binding.source, &imported, visited)
            .or_else(|| scan_source_type(scope.modules, &binding.source, &imported));
        return Some(answer);
    }
    let target_module = resolve_relative_module(scope.modules, module_path, &binding.source)?;
    Some(
        resolve_named_type_export(scope, &target_module, &imported, visited)
            .or_else(|| scan_module_type(scope.modules, &target_module, &imported)),
    )
}

/// Follows a named re-export of `type_name`, then each star re-export, in declaration order.
fn resolve_reexported_type(
    scope: TypeScope<'_>,
    module_path: &Path,
    type_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let module = scope.modules.get(module_path)?;
    if let Some(reexport) = module.named_type_reexports.get(type_name) {
        if let Some(target_module) = resolve_relative_module(scope.modules, module_path, &reexport.source) {
            return resolve_named_type_export(scope, &target_module, &reexport.imported, visited);
        }
    }
    module.star_reexports.iter().find_map(|source| {
        let target_module = resolve_relative_module(scope.modules, module_path, source)?;
        resolve_named_type_export(scope, &target_module, type_name, visited)
    })
}

fn resolve_named_type_export(
    scope: TypeScope<'_>,
    module_path: &Path,
    export_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let module = scope.modules.get(module_path)?;
    if module.types.contains_key(export_name) {
        return resolve_named_type(scope, module_path, export_name, visited);
    }
    resolve_reexported_type(scope, module_path, export_name, visited)
}

fn resolve_package_type(
    scope: TypeScope<'_>,
    package_name: &str,
    export_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let index_path = scope.package_indexes.get(package_name)?;
    resolve_named_type_export(scope, index_path, export_name, visited)
}

fn scan_source_type(
    modules: &HashMap<PathBuf, ModuleInfo>,
    source: &str,
    type_name: &str,
) -> Option<ResolvedType> {
    modules
        .values()
        .find(|module| module.display_source == source && module.types.contains_key(type_name))
        .and_then(|module| scan_module_type(modules, &module.path, type_name))
}

fn scan_module_type(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
    type_name: &str,
) -> Option<ResolvedType> {
    let module = modules.get(module_path)?;
    let type_def = module.types.get(type_name)?;
    Some(resolved_from_module(module, type_name, type_def))
}

fn resolved_from_module(module: &ModuleInfo, type_name: &str, type_def: &TypeDef) -> ResolvedType {
    ResolvedType {
        name: type_name.to_string(),
        source: module.display_source.clone(),
        owner_module: module.path.clone(),
        expr: type_def.expr.clone(),
    }
}

/// The prop map and the cycle guard shared by one component's whole type walk.
struct PropCollector {
    props: BTreeMap<String, PropTemplate>,
    visited: HashSet<String>,
}

pub(super) fn resolve_component_props(scope: TypeScope<'_>, resolved_type: &ResolvedType) -> Vec<PropTemplate> {
    let mut collector = PropCollector {
        props: BTreeMap::new(),
        visited: HashSet::new(),
    };
    collect_props_from_expr(scope, &resolved_type.owner_module, &resolved_type.expr, &mut collector);
    collector.props.into_values().collect()
}

fn collect_props_from_expr(
    scope: TypeScope<'_>,
    module_path: &Path,
    expr: &TypeExpr,
    collector: &mut PropCollector,
) {
    match expr {
        TypeExpr::Object(prop_defs) => collect_object_props(scope, module_path, prop_defs, collector),
        TypeExpr::Intersection(parts) => collect_intersection_props(scope, module_path, parts, collector),
        TypeExpr::Reference(name) => collect_referenced_props(scope, module_path, name, collector),
        // Literal unions and unknown types declare no props, so there is nothing to collect.
        TypeExpr::UnionLiterals(_) | TypeExpr::Unknown => {}
    }
}

/// The first declaration of a prop wins, matching how an intersection's earlier member shadows a later one.
fn collect_object_props(
    scope: TypeScope<'_>,
    module_path: &Path,
    prop_defs: &[PropDef],
    collector: &mut PropCollector,
) {
    for prop in prop_defs {
        collector
            .props
            .entry(prop.name.clone())
            .or_insert_with(|| PropTemplate {
                name: prop.name.clone(),
                allowed_values: resolve_allowed_values(scope, module_path, &prop.value_type),
            });
    }
}

fn collect_intersection_props(
    scope: TypeScope<'_>,
    module_path: &Path,
    parts: &[TypeExpr],
    collector: &mut PropCollector,
) {
    for part in parts {
        collect_props_from_expr(scope, module_path, part, collector);
    }
}

fn collect_referenced_props(
    scope: TypeScope<'_>,
    module_path: &Path,
    name: &str,
    collector: &mut PropCollector,
) {
    if let Some(resolved) = resolve_named_type(scope, module_path, name, &mut collector.visited) {
        collect_props_from_expr(scope, &resolved.owner_module, &resolved.expr, collector);
    }
}

fn resolve_allowed_values(
    scope: TypeScope<'_>,
    module_path: &Path,
    value_type: &PropValueType,
) -> Option<Vec<String>> {
    match value_type {
        PropValueType::UnionLiterals(values) => Some(values.clone()),
        PropValueType::Reference(name) => {
            let resolved = resolve_named_type(scope, module_path, name, &mut HashSet::new())?;
            allowed_values_of(scope, resolved)
        }
        PropValueType::Unknown => None,
    }
}

fn allowed_values_of(scope: TypeScope<'_>, resolved: ResolvedType) -> Option<Vec<String>> {
    match resolved.expr {
        TypeExpr::UnionLiterals(values) => Some(values),
        TypeExpr::Reference(inner) => {
            resolve_allowed_values(scope, &resolved.owner_module, &PropValueType::Reference(inner))
        }
        TypeExpr::Object(_) | TypeExpr::Intersection(_) | TypeExpr::Unknown => None,
    }
}
