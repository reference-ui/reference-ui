use crate::atlas::config::AtlasConfig;
use crate::atlas::internal::{
    component_key, ComponentDecl, ComponentTemplate, ImportKind, ModuleInfo, PropTemplate,
    PropValueType, ResolvedType, TypeExpr, UsageState,
};
use crate::atlas::output::{AtlasDiagnostic, AtlasDiagnosticCode};
use regex::Regex;
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::path::{Path, PathBuf};

pub fn collect_referenced_packages<'a, I>(modules: I) -> BTreeSet<String>
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

pub fn collect_included_packages(config: &AtlasConfig) -> BTreeMap<String, BTreeSet<String>> {
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

pub fn resolve_package_index<'a, I>(paths: I) -> Option<PathBuf>
where
    I: Iterator<Item = &'a PathBuf>,
{
    paths.into_iter().find(|path| is_package_index_module(path)).cloned()
}

pub fn is_local_component_module(module: &ModuleInfo, app_root: &Path) -> bool {
    module.path.starts_with(app_root.join("src/components"))
}

pub fn is_package_index_module(path: &Path) -> bool {
    matches!(
        path.file_name().and_then(|name| name.to_str()),
        Some("index.ts") | Some("index.tsx") | Some("index.js") | Some("index.jsx")
    )
}

pub fn build_component_template(
    component: &ComponentDecl,
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    diagnostics: &mut Vec<AtlasDiagnostic>,
) -> Option<ComponentTemplate> {
    let (interface_name, interface_source, resolved_type) = match &component.props {
        crate::atlas::internal::PropsAnnotation::InlineObject => {
            diagnostics.push(AtlasDiagnostic {
                code: AtlasDiagnosticCode::UnsupportedPropsAnnotation,
                message: format!(
                    "Component {} uses an inline props type annotation that Atlas does not index.",
                    component.name
                ),
                source: component.source_display.clone(),
                component_name: Some(component.name.clone()),
                interface_name: None,
            });
            return None;
        }
        crate::atlas::internal::PropsAnnotation::Named(type_name) => match resolve_named_type(
            modules,
            package_indexes,
            &module.path,
            type_name,
            &mut HashSet::new(),
        ) {
            Some(resolved) => (
                resolved.name.clone(),
                resolved.source.clone(),
                Some(resolved),
            ),
            None => {
                diagnostics.push(AtlasDiagnostic {
                    code: AtlasDiagnosticCode::UnresolvedPropsType,
                    message: format!(
                        "Component {} references props type {} which Atlas could not resolve.",
                        component.name, type_name
                    ),
                    source: component.source_display.clone(),
                    component_name: Some(component.name.clone()),
                    interface_name: Some(type_name.clone()),
                });
                (type_name.clone(), guess_interface_source(module, type_name), None)
            }
        },
        crate::atlas::internal::PropsAnnotation::None => (
            "UnknownProps".to_string(),
            component.source_display.clone(),
            None,
        ),
    };

    let props = resolved_type
        .as_ref()
        .map(|resolved| resolve_component_props(modules, package_indexes, resolved))
        .unwrap_or_default();

    Some(ComponentTemplate {
        name: component.name.clone(),
        source: component.source_display.clone(),
        interface_name,
        interface_source,
        file_path: component.file_path.clone(),
        app_relative_path: component.app_relative_path.clone(),
        props,
    })
}

pub fn apply_excludes(
    tracked: &mut BTreeMap<String, ComponentTemplate>,
    config: &AtlasConfig,
    app_root: &Path,
) {
    let excludes = config.exclude.clone().unwrap_or_default();
    if excludes.is_empty() {
        return;
    }

    tracked.retain(|_, template| {
        !excludes.iter().any(|pattern| {
            if let Some((source, name)) = pattern.split_once(':') {
                return template.source == source && template.name == name;
            }
            if pattern.starts_with('@') {
                return false;
            }
            let relative = template.app_relative_path.clone().unwrap_or_else(|| {
                template
                    .file_path
                    .strip_prefix(app_root)
                    .ok()
                    .map(|path| path.to_string_lossy().replace('\\', "/"))
                    .unwrap_or_default()
            });
            glob_match(pattern, &relative)
        })
    });
}

pub fn resolve_named_type(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    module_path: &Path,
    type_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let visit_key = format!("{}::{type_name}", module_path.display());
    if !visited.insert(visit_key) {
        return None;
    }

    let module = modules.get(module_path)?;
    if let Some(type_def) = module.types.get(type_name) {
        return Some(ResolvedType {
            name: type_name.to_string(),
            source: module.display_source.clone(),
            owner_module: module.path.clone(),
            expr: type_def.expr.clone(),
        });
    }

    if let Some(binding) = module.imports.get(type_name) {
        let imported = binding.imported.clone().unwrap_or_else(|| type_name.to_string());
        if binding.source.starts_with('@') {
            return resolve_package_type(modules, package_indexes, &binding.source, &imported, visited)
                .or_else(|| scan_source_type(modules, &binding.source, &imported));
        }
        if let Some(target_module) = resolve_relative_module(modules, module_path, &binding.source) {
            return resolve_named_type_export(modules, package_indexes, &target_module, &imported, visited)
                .or_else(|| scan_module_type(modules, &target_module, &imported));
        }
    }

    if let Some(reexport) = module.named_type_reexports.get(type_name) {
        if let Some(target_module) = resolve_relative_module(modules, module_path, &reexport.source) {
            return resolve_named_type_export(modules, package_indexes, &target_module, &reexport.imported, visited);
        }
    }

    None
}

pub fn resolve_named_component_export(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
    export_name: &str,
) -> Option<(String, String)> {
    let module = modules.get(module_path)?;
    if let Some(component) = module.components.get(export_name) {
        return Some((component.name.clone(), component.source_display.clone()));
    }
    if let Some(reexport) = module.named_component_reexports.get(export_name) {
        if let Some(target_module) = resolve_relative_module(modules, module_path, &reexport.source) {
            return resolve_named_component_export(modules, &target_module, &reexport.imported);
        }
    }
    None
}

pub fn resolve_default_component_export(
    modules: &HashMap<PathBuf, ModuleInfo>,
    module_path: &Path,
) -> Option<(String, String)> {
    let module = modules.get(module_path)?;
    let name = module.default_component.as_ref()?;
    let component = module.components.get(name)?;
    Some((component.name.clone(), component.source_display.clone()))
}

pub fn resolve_occurrence_key(
    tag_name: &str,
    alias_map: &HashMap<String, String>,
    namespace_map: &HashMap<String, String>,
    states: &BTreeMap<String, UsageState>,
) -> Option<String> {
    if let Some((namespace, member)) = tag_name.split_once('.') {
        let package_name = namespace_map.get(namespace)?;
        let key = component_key(member, package_name);
        return states.contains_key(&key).then_some(key);
    }
    alias_map.get(tag_name).cloned()
}

pub fn build_alias_map(
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    states: &BTreeMap<String, UsageState>,
) -> HashMap<String, String> {
    let mut aliases = HashMap::new();
    for binding in module.imports.values() {
        if binding.is_type || binding.kind == ImportKind::Namespace {
            continue;
        }

        let key = if binding.source.starts_with('@') {
            let imported = binding.imported.clone().unwrap_or_else(|| binding.local.clone());
            let component_name = if imported == "default" {
                binding.local.clone()
            } else {
                imported
            };
            let key = component_key(&component_name, &binding.source);
            states.contains_key(&key).then_some(key)
        } else if let Some(target_module) = resolve_relative_module(modules, &module.path, &binding.source) {
            match binding.kind {
                ImportKind::Named => resolve_named_component_export(
                    modules,
                    &target_module,
                    binding.imported.as_deref().unwrap_or(&binding.local),
                )
                .map(|(name, source)| component_key(&name, &source)),
                ImportKind::Default => resolve_default_component_export(modules, &target_module)
                    .map(|(name, source)| component_key(&name, &source)),
                ImportKind::Namespace => None,
            }
        } else {
            None
        };

        if let Some(key) = key {
            if states.contains_key(&key) {
                aliases.insert(binding.local.clone(), key);
            }
        }
    }
    aliases
}

fn guess_interface_source(module: &ModuleInfo, type_name: &str) -> String {
    if let Some(binding) = module.imports.get(type_name) {
        if binding.source.starts_with('@') {
            return binding.source.clone();
        }
    }
    module.display_source.clone()
}

fn resolve_named_type_export(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    module_path: &Path,
    export_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let module = modules.get(module_path)?;
    if module.types.contains_key(export_name) {
        return resolve_named_type(modules, package_indexes, module_path, export_name, visited);
    }
    if let Some(reexport) = module.named_type_reexports.get(export_name) {
        if let Some(target_module) = resolve_relative_module(modules, module_path, &reexport.source) {
            return resolve_named_type_export(modules, package_indexes, &target_module, &reexport.imported, visited);
        }
    }
    None
}

fn resolve_package_type(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    package_name: &str,
    export_name: &str,
    visited: &mut HashSet<String>,
) -> Option<ResolvedType> {
    let index_path = package_indexes.get(package_name)?;
    resolve_named_type_export(modules, package_indexes, index_path, export_name, visited)
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
    Some(ResolvedType {
        name: type_name.to_string(),
        source: module.display_source.clone(),
        owner_module: module.path.clone(),
        expr: type_def.expr.clone(),
    })
}

fn resolve_component_props(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    resolved_type: &ResolvedType,
) -> Vec<PropTemplate> {
    let mut props = BTreeMap::new();
    collect_props_from_expr(
        modules,
        package_indexes,
        &resolved_type.owner_module,
        &resolved_type.expr,
        &mut props,
        &mut HashSet::new(),
    );
    props.into_values().collect()
}

fn collect_props_from_expr(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    module_path: &Path,
    expr: &TypeExpr,
    props: &mut BTreeMap<String, PropTemplate>,
    visited: &mut HashSet<String>,
) {
    match expr {
        TypeExpr::Object(prop_defs) => {
            for prop in prop_defs {
                props.entry(prop.name.clone()).or_insert_with(|| PropTemplate {
                    name: prop.name.clone(),
                    allowed_values: resolve_allowed_values(
                        modules,
                        package_indexes,
                        module_path,
                        &prop.value_type,
                    ),
                });
            }
        }
        TypeExpr::Intersection(parts) => {
            for part in parts {
                collect_props_from_expr(modules, package_indexes, module_path, part, props, visited);
            }
        }
        TypeExpr::Reference(name) => {
            if let Some(resolved) = resolve_named_type(modules, package_indexes, module_path, name, visited) {
                collect_props_from_expr(
                    modules,
                    package_indexes,
                    &resolved.owner_module,
                    &resolved.expr,
                    props,
                    visited,
                );
            }
        }
        TypeExpr::UnionLiterals(_) | TypeExpr::Unknown => {}
    }
}

fn resolve_allowed_values(
    modules: &HashMap<PathBuf, ModuleInfo>,
    package_indexes: &HashMap<String, PathBuf>,
    module_path: &Path,
    value_type: &crate::atlas::internal::PropValueType,
) -> Option<Vec<String>> {
    match value_type {
        PropValueType::UnionLiterals(values) => Some(values.clone()),
        PropValueType::Reference(name) => {
            let resolved = resolve_named_type(modules, package_indexes, module_path, name, &mut HashSet::new())?;
            match resolved.expr {
                TypeExpr::UnionLiterals(values) => Some(values),
                TypeExpr::Reference(inner) => resolve_allowed_values(
                    modules,
                    package_indexes,
                    &resolved.owner_module,
                    &PropValueType::Reference(inner),
                ),
                _ => None,
            }
        }
        PropValueType::Unknown => None,
    }
}

fn resolve_relative_module(
    modules: &HashMap<PathBuf, ModuleInfo>,
    from_module: &Path,
    specifier: &str,
) -> Option<PathBuf> {
    let base_dir = from_module.parent()?;
    let base = base_dir.join(specifier);
    let candidates = [
        base.clone(),
        base.with_extension("ts"),
        base.with_extension("tsx"),
        base.with_extension("js"),
        base.with_extension("jsx"),
        base.join("index.ts"),
        base.join("index.tsx"),
        base.join("index.js"),
        base.join("index.jsx"),
    ];
    candidates
        .into_iter()
        .filter_map(normalize_existing_path)
        .find(|candidate| modules.contains_key(candidate))
}

fn normalize_existing_path(path: PathBuf) -> Option<PathBuf> {
    std::fs::canonicalize(path).ok()
}

fn glob_match(pattern: &str, value: &str) -> bool {
    let mut regex = String::from("^");
    let mut chars = pattern.chars().peekable();
    while let Some(ch) = chars.next() {
        match ch {
            '*' => {
                if chars.peek() == Some(&'*') {
                    chars.next();
                    regex.push_str(".*");
                } else {
                    regex.push_str("[^/]*");
                }
            }
            '/' => regex.push('/'),
            other => regex.push_str(&regex::escape(&other.to_string())),
        }
    }
    regex.push('$');
    Regex::new(&regex).map(|re| re.is_match(value)).unwrap_or(false)
}