//! Public analysis entry point and wrapper-graph traversal.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use crate::styletrace::resolver::{
    collect_reference_style_prop_names, normalize_path, resolve_workspace_root, StyleTraceError,
};

use super::discovery::{
    collect_reference_primitive_jsx_names, discover_source_files, resolve_imported_module,
};
use super::model::{EdgeTarget, ExportTarget, FactoryTarget, TraceComponent, TraceModule};
use super::parser::parse_trace_module;

pub fn trace_style_jsx_names(root_dir: &Path) -> Result<Vec<String>, StyleTraceError> {
    trace_style_jsx_names_with_hint(root_dir, None)
}

pub fn trace_style_jsx_names_with_hint(
    root_dir: &Path,
    workspace_hint: Option<&Path>,
) -> Result<Vec<String>, StyleTraceError> {
    let normalized_root = normalize_path(root_dir);
    let workspace_root = resolve_workspace_root(&normalized_root, workspace_hint)?;
    let style_prop_names = collect_reference_style_prop_names(&workspace_root)?
        .into_iter()
        .collect::<BTreeSet<_>>();
    let primitive_names = collect_reference_primitive_jsx_names(&workspace_root)?;

    let source_files = discover_source_files(&normalized_root)?;
    let mut modules = BTreeMap::new();
    for file_path in source_files {
        let module = parse_trace_module(
            &file_path,
            &workspace_root,
            &style_prop_names,
            &primitive_names,
        )?;
        modules.insert(file_path, module);
    }

    let mut analyzer =
        StyleTraceAnalyzer::new(modules, primitive_names, workspace_root, style_prop_names);
    analyzer.collect_exported_jsx_names()
}

struct StyleTraceAnalyzer {
    modules: BTreeMap<PathBuf, TraceModule>,
    primitive_names: BTreeSet<String>,
    workspace_root: PathBuf,
    style_prop_names: BTreeSet<String>,
    component_cache: HashMap<(PathBuf, String), bool>,
    factory_cache: HashMap<(PathBuf, String), bool>,
    export_cache: HashMap<(PathBuf, String), bool>,
}

impl StyleTraceAnalyzer {
    fn new(
        modules: BTreeMap<PathBuf, TraceModule>,
        primitive_names: BTreeSet<String>,
        workspace_root: PathBuf,
        style_prop_names: BTreeSet<String>,
    ) -> Self {
        Self {
            modules,
            primitive_names,
            workspace_root,
            style_prop_names,
            component_cache: HashMap::new(),
            factory_cache: HashMap::new(),
            export_cache: HashMap::new(),
        }
    }

    fn collect_exported_jsx_names(&mut self) -> Result<Vec<String>, StyleTraceError> {
        let mut names = BTreeSet::new();

        let module_paths = self.modules.keys().cloned().collect::<Vec<_>>();
        for module_path in module_paths {
            let Some(module) = self.modules.get(&module_path) else {
                continue;
            };

            let export_names = module.exports.keys().cloned().collect::<Vec<_>>();
            for export_name in export_names {
                if self.export_is_traced(&module_path, &export_name, &mut Vec::new())? {
                    names.insert(export_name);
                }
            }
        }

        Ok(names.into_iter().collect())
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

        Ok(component.edges.iter().any(|edge| match &edge.target {
            EdgeTarget::Primitive(name) => self.primitive_names.contains(name),
            EdgeTarget::Local(local_name) => self
                .component_is_traced(module_path, local_name, stack)
                .unwrap_or(false),
            EdgeTarget::Imported {
                source,
                imported_name,
            } => self
                .import_target_is_traced(module_path, source, imported_name, stack)
                .unwrap_or(false),
        }))
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
                let Some(resolved_module) =
                    resolve_imported_module(module_path, source, &self.workspace_root)?
                else {
                    return Ok(false);
                };
                self.ensure_module_loaded(&resolved_module)?;
                self.factory_is_traced(&resolved_module, imported_name, stack)
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

        let Some(resolved_module) =
            resolve_imported_module(module_path, source, &self.workspace_root)?
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
            &self.workspace_root,
            &self.style_prop_names,
            &self.primitive_names,
        )?;
        self.modules.insert(module_path.to_path_buf(), module);
        Ok(())
    }
}
