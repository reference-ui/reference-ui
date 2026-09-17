//! Serves as the public analysis entry point for coordinating wrapper-graph traversal.
//! It takes a set of target components and workspace configurations as input.
//! Traverses the JSX component tree to identify how style properties are forwarded or overridden.
//! Emits a comprehensive dependency graph or diagnostic report detailing component style relationships.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use crate::resolver::{
    collect_reference_style_prop_names, normalize_path, resolve_sync_root, StyleTraceError,
};

use super::model::{
    EdgeTarget, ExportTarget, FactoryTarget, TraceComponent, TraceModule, TracedBinding,
};
use super::module_resolution::resolve_imported_module;
use super::parser::parse_trace_module;
use super::primitive_metadata::collect_reference_primitive_jsx_names;
use super::source_files::{discover_source_files, format_relative_module};

pub fn trace_style_jsx_names(root_dir: &Path) -> Result<Vec<String>, StyleTraceError> {
    trace_style_jsx_names_with_hint(root_dir, None)
}

pub fn trace_style_jsx_names_with_hint(
    root_dir: &Path,
    sync_root_hint: Option<&Path>,
) -> Result<Vec<String>, StyleTraceError> {
    let bindings = trace_style_bindings_with_hint(root_dir, sync_root_hint)?;
    Ok(bindings
        .into_iter()
        .map(|b| b.name)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect())
}

pub fn trace_style_bindings(
    source_root: &Path,
    declaration_root: &Path,
) -> Result<Vec<TracedBinding>, StyleTraceError> {
    trace_style_bindings_with_hint(source_root, Some(declaration_root))
}

pub fn trace_style_bindings_with_hint(
    source_root: &Path,
    declaration_root: Option<&Path>,
) -> Result<Vec<TracedBinding>, StyleTraceError> {
    let normalized_source = normalize_path(source_root);
    let resolved_decl_root = match declaration_root {
        Some(hint) => normalize_path(hint),
        None => resolve_sync_root(&normalized_source, None)?,
    };

    let style_prop_names = collect_reference_style_prop_names(&resolved_decl_root)?
        .into_iter()
        .collect::<BTreeSet<_>>();
    let primitive_names = collect_reference_primitive_jsx_names(&resolved_decl_root)?;

    let mut modules = BTreeMap::new();
    for file_path in discover_source_files(&normalized_source)? {
        let module = parse_trace_module(
            &file_path,
            &resolved_decl_root,
            &style_prop_names,
            &primitive_names,
        )?;
        modules.insert(file_path, module);
    }

    let mut analyzer = StyleTraceAnalyzer::new(
        modules,
        primitive_names,
        resolved_decl_root,
        style_prop_names,
    );
    analyzer.collect_exported_bindings(&normalized_source)
}

struct StyleTraceAnalyzer {
    modules: BTreeMap<PathBuf, TraceModule>,
    primitive_names: BTreeSet<String>,
    sync_root: PathBuf,
    style_prop_names: BTreeSet<String>,
    component_cache: HashMap<(PathBuf, String), bool>,
    factory_cache: HashMap<(PathBuf, String), bool>,
    export_cache: HashMap<(PathBuf, String), bool>,
}

impl StyleTraceAnalyzer {
    fn new(
        modules: BTreeMap<PathBuf, TraceModule>,
        primitive_names: BTreeSet<String>,
        sync_root: PathBuf,
        style_prop_names: BTreeSet<String>,
    ) -> Self {
        Self {
            modules,
            primitive_names,
            sync_root,
            style_prop_names,
            component_cache: HashMap::new(),
            factory_cache: HashMap::new(),
            export_cache: HashMap::new(),
        }
    }

    fn collect_exported_bindings(
        &mut self,
        source_root: &Path,
    ) -> Result<Vec<TracedBinding>, StyleTraceError> {
        let mut bindings = BTreeSet::new();
        let module_paths = self.modules.keys().cloned().collect::<Vec<_>>();
        for module_path in module_paths {
            self.collect_module_bindings(&module_path, source_root, &mut bindings)?;
        }
        Ok(bindings.into_iter().collect())
    }

    fn collect_module_bindings(
        &mut self,
        module_path: &Path,
        source_root: &Path,
        bindings: &mut BTreeSet<TracedBinding>,
    ) -> Result<(), StyleTraceError> {
        let Some(module) = self.modules.get(module_path).cloned() else {
            return Ok(());
        };
        let rel_module = format_relative_module(module_path, source_root);

        for export_name in module.exports.keys() {
            if self.export_is_traced(module_path, export_name, &mut Vec::new())? {
                bindings.insert(TracedBinding::new(&rel_module, export_name));
            }
        }

        for source in &module.export_all_sources {
            let Some(target) = resolve_imported_module(module_path, source, &self.sync_root)?
            else {
                continue;
            };
            self.ensure_module_loaded(&target)?;
            let Some(target_module) = self.modules.get(&target).cloned() else {
                continue;
            };
            for export_name in target_module.exports.keys() {
                if self.export_is_traced(&target, export_name, &mut Vec::new())? {
                    bindings.insert(TracedBinding::new(&rel_module, export_name));
                }
            }
        }
        Ok(())
    }

    fn export_is_traced(
        &mut self,
        module_path: &Path,
        export_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<bool, StyleTraceError> {
        let cache_key = (module_path.to_path_buf(), export_name.to_string());
        if let Some(cached) = self.export_cache.get(&cache_key) {
            return Ok(*cached);
        }

        let stack_key = format!("export:{}::{export_name}", module_path.display());
        if stack.contains(&stack_key) {
            return Ok(false);
        }
        stack.push(stack_key);

        let export_target = self
            .modules
            .get(module_path)
            .and_then(|module| module.exports.get(export_name))
            .cloned();

        let result = match export_target {
            Some(ExportTarget::Local(local_name)) => {
                self.component_is_traced(module_path, &local_name, stack)?
            }
            Some(ExportTarget::Imported {
                source,
                imported_name,
            }) => self.import_target_is_traced(module_path, &source, &imported_name, stack)?,
            None => {
                let export_all_sources = self
                    .modules
                    .get(module_path)
                    .map(|module| module.export_all_sources.clone())
                    .unwrap_or_default();

                let mut traced = false;
                for source in export_all_sources {
                    if self.import_target_is_traced(module_path, &source, export_name, stack)? {
                        traced = true;
                        break;
                    }
                }
                traced
            }
        };

        stack.pop();
        self.export_cache.insert(cache_key, result);
        Ok(result)
    }

    fn component_is_traced(
        &mut self,
        module_path: &Path,
        component_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<bool, StyleTraceError> {
        let cache_key = (module_path.to_path_buf(), component_name.to_string());
        if let Some(cached) = self.component_cache.get(&cache_key) {
            return Ok(*cached);
        }

        let stack_key = format!("component:{}::{component_name}", module_path.display());
        if stack.contains(&stack_key) {
            return Ok(false);
        }
        stack.push(stack_key);

        let component = self
            .modules
            .get(module_path)
            .and_then(|module| module.components.get(component_name))
            .cloned();

        let component_factory = self
            .modules
            .get(module_path)
            .and_then(|module| module.component_factories.get(component_name))
            .cloned();

        let result = match component {
            Some(component) => self.component_value_is_traced(module_path, &component, stack)?,
            None => match component_factory {
                Some(factory_target) => {
                    self.factory_target_is_traced(module_path, &factory_target, stack)?
                }
                None => false,
            },
        };

        stack.pop();
        self.component_cache.insert(cache_key, result);
        Ok(result)
    }

    fn component_value_is_traced(
        &mut self,
        module_path: &Path,
        component: &TraceComponent,
        stack: &mut Vec<String>,
    ) -> Result<bool, StyleTraceError> {
        if !component.exposes_style_props {
            return Ok(false);
        }
        if component.uses_style_pipeline {
            return Ok(true);
        }

        for edge in &component.edges {
            let matched = match &edge.target {
                EdgeTarget::Primitive(name) => self.primitive_names.contains(name),
                EdgeTarget::Local(local_name) => {
                    self.component_is_traced(module_path, local_name, stack)?
                }
                EdgeTarget::Imported {
                    source,
                    imported_name,
                } => self.import_target_is_traced(module_path, source, imported_name, stack)?,
            };
            if matched {
                return Ok(true);
            }
        }
        Ok(false)
    }

    fn factory_target_is_traced(
        &mut self,
        module_path: &Path,
        target: &FactoryTarget,
        stack: &mut Vec<String>,
    ) -> Result<bool, StyleTraceError> {
        match target {
            FactoryTarget::Local(factory_name) => {
                self.factory_is_traced(module_path, factory_name, stack)
            }
            FactoryTarget::Imported {
                source,
                imported_name,
            } => {
                let Some(resolved) = resolve_imported_module(module_path, source, &self.sync_root)?
                else {
                    return Ok(false);
                };
                self.ensure_module_loaded(&resolved)?;
                self.factory_is_traced(&resolved, imported_name, stack)
            }
        }
    }

    fn factory_is_traced(
        &mut self,
        module_path: &Path,
        factory_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<bool, StyleTraceError> {
        let cache_key = (module_path.to_path_buf(), factory_name.to_string());
        if let Some(cached) = self.factory_cache.get(&cache_key) {
            return Ok(*cached);
        }

        let stack_key = format!("factory:{}::{factory_name}", module_path.display());
        if stack.contains(&stack_key) {
            return Ok(false);
        }
        stack.push(stack_key);

        let result = match self
            .modules
            .get(module_path)
            .and_then(|module| module.factories.get(factory_name))
            .cloned()
        {
            Some(factory) => {
                self.component_value_is_traced(module_path, &factory.component, stack)?
            }
            None => false,
        };

        stack.pop();
        self.factory_cache.insert(cache_key, result);
        Ok(result)
    }

    fn import_target_is_traced(
        &mut self,
        module_path: &Path,
        source: &str,
        imported_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<bool, StyleTraceError> {
        if source == "@reference-ui/react" {
            return Ok(self.primitive_names.contains(imported_name));
        }

        let Some(resolved_module) = resolve_imported_module(module_path, source, &self.sync_root)?
        else {
            return Ok(false);
        };
        self.ensure_module_loaded(&resolved_module)?;
        self.export_is_traced(&resolved_module, imported_name, stack)
    }

    fn ensure_module_loaded(&mut self, module_path: &Path) -> Result<(), StyleTraceError> {
        if self.modules.contains_key(module_path) {
            return Ok(());
        }

        let module = parse_trace_module(
            module_path,
            &self.sync_root,
            &self.style_prop_names,
            &self.primitive_names,
        )?;
        self.modules.insert(module_path.to_path_buf(), module);
        Ok(())
    }
}
