//! Joins one JSX tag in an app module to the tracked component it names. A dotted tag resolves through a namespace
//! import, a bare tag through the module's alias table or its direct import binding, and the answer counts only
//! when the resolved `name@@source` key is one the usage pass tracks. `build_alias_map` precomputes the alias table
//! for a module so that each occurrence is a single lookup. It takes the module, an `OccurrenceScope`, and a tag
//! name, and emits the tracked component key or `None`.

use super::exports::{resolve_default_component_export, resolve_named_component_export};
use super::packages::resolve_package_component_export;
use super::paths::resolve_relative_module;
use crate::internal::{component_key, ImportBinding, ImportKind, ModuleInfo, UsageState};
use std::collections::{BTreeMap, HashMap};
use std::path::PathBuf;

/// The maps one module's tag lookups read: the module graph, its alias table and namespace imports, and the
/// usage snapshot that decides which keys are tracked.
pub(crate) struct OccurrenceScope<'a> {
    pub(crate) modules: &'a HashMap<PathBuf, ModuleInfo>,
    pub(crate) alias_map: &'a HashMap<String, String>,
    pub(crate) namespace_map: &'a HashMap<String, String>,
    pub(crate) states: &'a BTreeMap<String, UsageState>,
}

pub(crate) fn resolve_occurrence_key(
    module: &ModuleInfo,
    scope: &OccurrenceScope<'_>,
    tag_name: &str,
) -> Option<String> {
    if let Some((namespace, member)) = tag_name.split_once('.') {
        return resolve_member_tag(module, scope, namespace, member);
    }
    if let Some(key) = scope.alias_map.get(tag_name) {
        return Some(key.clone());
    }

    let binding = module.imports.get(tag_name)?;
    if binding.is_type || binding.kind == ImportKind::Namespace {
        return None;
    }
    let resolved = resolve_binding_export(module, scope.modules, binding)?;
    let key = component_key(&resolved.0, &resolved.1);
    scope.states.contains_key(&key).then_some(key)
}

/// `Ns.Member`: the member is resolved through the namespace's source. When that fails, the key falls back to the
/// member name under the namespace's own source.
fn resolve_member_tag(
    module: &ModuleInfo,
    scope: &OccurrenceScope<'_>,
    namespace: &str,
    member: &str,
) -> Option<String> {
    let source = scope.namespace_map.get(namespace)?;
    let resolved = if source.starts_with('@') {
        resolve_package_component_export(scope.modules, source, member)
    } else {
        resolve_relative_module(scope.modules, &module.path, source)
            .and_then(|target| resolve_named_component_export(scope.modules, &target, member))
    };

    match resolved {
        Some((name, resolved_source)) => {
            let key = component_key(&name, &resolved_source);
            scope.states.contains_key(&key).then_some(key)
        }
        None => {
            let fallback_key = component_key(member, source);
            scope.states.contains_key(&fallback_key).then_some(fallback_key)
        }
    }
}

/// The `(name, source)` a non-namespace import binding names, through a package index or a relative module.
fn resolve_binding_export(
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    binding: &ImportBinding,
) -> Option<(String, String)> {
    if binding.source.starts_with('@') {
        let export_name = binding.imported.as_deref().unwrap_or(&binding.local);
        return resolve_package_component_export(modules, &binding.source, export_name);
    }
    let target_module = resolve_relative_module(modules, &module.path, &binding.source)?;
    match binding.kind {
        ImportKind::Named => resolve_named_component_export(
            modules,
            &target_module,
            binding.imported.as_deref().unwrap_or(&binding.local),
        ),
        ImportKind::Default => resolve_default_component_export(modules, &target_module),
        ImportKind::Namespace => None,
    }
}

pub(crate) fn build_alias_map(
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    states: &BTreeMap<String, UsageState>,
) -> HashMap<String, String> {
    let mut aliases = HashMap::new();
    for binding in module.imports.values() {
        if binding.is_type || binding.kind == ImportKind::Namespace {
            continue;
        }
        let Some(key) = resolve_binding_export(module, modules, binding)
            .map(|(name, source)| component_key(&name, &source))
        else {
            continue;
        };
        if states.contains_key(&key) {
            aliases.insert(binding.local.clone(), key);
        }
    }
    aliases
}
