//! Walks the parsed wrapper graph to decide which exported components are
//! style-traced. It takes parsed modules plus the surface sets and follows
//! local, imported, and factory edges back to Reference primitives.
//! Emits the exported bindings whose style props reach a primitive. Entry
//! parsing and surface acquisition live in `surface.rs`; this file stays
//! the walker.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

use crate::resolver::StyleTraceError;

use super::model::{
    EdgeTarget, ExportTarget, FactoryTarget, TraceComponent, TraceModule, TracedBinding,
};
use super::module_resolution::ModuleResolver;
use super::parser::parse_trace_module;
use super::source_files::format_relative_module;
use super::surface::{StyleSurface, TraceDiagnostic, TraceSources};

pub(super) struct StyleTraceAnalyzer<'s> {
    modules: BTreeMap<PathBuf, TraceModule>,
    surface: StyleSurface,
    sync_root: PathBuf,
    sources: &'s TraceSources<'s>,
    resolver: ModuleResolver<'s>,
    component_cache: HashMap<(PathBuf, String), Option<BTreeSet<String>>>,
    factory_cache: HashMap<(PathBuf, String), Option<BTreeSet<String>>>,
    export_cache: HashMap<(PathBuf, String), Option<BTreeSet<String>>>,
    owned_props: BTreeMap<String, BTreeSet<String>>,
    diagnostics: Vec<TraceDiagnostic>,
}

impl<'s> StyleTraceAnalyzer<'s> {
    pub(super) fn new(
        modules: BTreeMap<PathBuf, TraceModule>,
        surface: StyleSurface,
        sync_root: PathBuf,
        sources: &'s TraceSources<'s>,
    ) -> Self {
        Self {
            modules,
            surface,
            sync_root,
            sources,
            resolver: ModuleResolver::new(sources.staged),
            component_cache: HashMap::new(),
            factory_cache: HashMap::new(),
            export_cache: HashMap::new(),
            owned_props: BTreeMap::new(),
            diagnostics: Vec::new(),
        }
    }

    /// Drain edge-target diagnostics recorded while walking.
    pub(super) fn take_diagnostics(&mut self) -> Vec<TraceDiagnostic> {
        std::mem::take(&mut self.diagnostics)
    }

    /// Drain the owned-props map: each traced export name to the prop
    /// names its own declaration owns. Same-named exports union.
    pub(super) fn take_owned_props(&mut self) -> BTreeMap<String, BTreeSet<String>> {
        std::mem::take(&mut self.owned_props)
    }

    /// Record one traced export's owned props under its export name.
    /// Empty sets stay out: untraced and own-nothing hosts both mean
    /// no shadow, so the map carries only real shadows.
    fn record_owned(&mut self, export_name: &str, owned: BTreeSet<String>) {
        if owned.is_empty() {
            return;
        }
        self.owned_props
            .entry(export_name.to_string())
            .or_default()
            .extend(owned);
    }

    pub(super) fn collect_exported_bindings(
        &mut self,
        source_root: &Path,
    ) -> Result<Vec<TracedBinding>, StyleTraceError> {
        let mut bindings = BTreeSet::new();
        let module_paths = self.modules.keys().cloned().collect::<Vec<_>>();
        let source_root_is_file = source_root.is_file();
        for module_path in module_paths {
            self.collect_module_bindings(
                &module_path,
                source_root,
                source_root_is_file,
                &mut bindings,
            )?;
        }
        Ok(bindings.into_iter().collect())
    }

    fn collect_module_bindings(
        &mut self,
        module_path: &Path,
        source_root: &Path,
        source_root_is_file: bool,
        bindings: &mut BTreeSet<TracedBinding>,
    ) -> Result<(), StyleTraceError> {
        let Some(module) = self.modules.get(module_path).cloned() else {
            return Ok(());
        };
        let rel_module = format_relative_module(module_path, source_root, source_root_is_file);

        for export_name in module.exports.keys() {
            if let Some(owned) = self.export_is_traced(module_path, export_name, &mut Vec::new())? {
                bindings.insert(TracedBinding::new(&rel_module, export_name));
                self.record_owned(export_name, owned);
            }
        }

        for source in &module.export_all_sources {
            let Some(target) =
                self.resolver.resolve_imported_module(module_path, source, &self.sync_root)?
            else {
                continue;
            };
            self.ensure_module_loaded(&target)?;
            let Some(target_module) = self.modules.get(&target).cloned() else {
                continue;
            };
            for export_name in target_module.exports.keys() {
                if let Some(owned) = self.export_is_traced(&target, export_name, &mut Vec::new())? {
                    bindings.insert(TracedBinding::new(&rel_module, export_name));
                    self.record_owned(export_name, owned);
                }
            }
        }
        Ok(())
    }

    /// The export's owned props when its component traces to a
    /// primitive; `None` when the export is not a style host. The owned
    /// set is the resolved component's own declaration, so re-exports
    /// carry the origin's names.
    fn export_is_traced(
        &mut self,
        module_path: &Path,
        export_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        let cache_key = (module_path.to_path_buf(), export_name.to_string());
        if let Some(cached) = self.export_cache.get(&cache_key) {
            return Ok(cached.clone());
        }

        let stack_key = format!("export:{}::{export_name}", module_path.display());
        if stack.contains(&stack_key) {
            return Ok(None);
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

                let mut traced = None;
                for source in export_all_sources {
                    if let Some(owned) =
                        self.import_target_is_traced(module_path, &source, export_name, stack)?
                    {
                        traced = Some(owned);
                        break;
                    }
                }
                traced
            }
        };

        stack.pop();
        self.export_cache.insert(cache_key, result.clone());
        Ok(result)
    }

    fn component_is_traced(
        &mut self,
        module_path: &Path,
        component_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        let cache_key = (module_path.to_path_buf(), component_name.to_string());
        if let Some(cached) = self.component_cache.get(&cache_key) {
            return Ok(cached.clone());
        }

        let stack_key = format!("component:{}::{component_name}", module_path.display());
        if stack.contains(&stack_key) {
            return Ok(None);
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
                None => None,
            },
        };

        stack.pop();
        self.component_cache.insert(cache_key, result.clone());
        Ok(result)
    }

    fn component_value_is_traced(
        &mut self,
        module_path: &Path,
        component: &TraceComponent,
        stack: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        if !component.exposes_style_props {
            return Ok(None);
        }
        if component.uses_style_pipeline {
            return Ok(Some(component.owned_props.clone()));
        }

        for edge in &component.edges {
            let matched = match &edge.target {
                EdgeTarget::Primitive(name) => self.surface.primitives.contains(name),
                EdgeTarget::Local(local_name) => self
                    .component_is_traced(module_path, local_name, stack)?
                    .is_some(),
                EdgeTarget::Imported {
                    source,
                    imported_name,
                } => self
                    .import_target_is_traced(module_path, source, imported_name, stack)?
                    .is_some(),
            };
            if matched {
                return Ok(Some(component.owned_props.clone()));
            }
        }
        Ok(None)
    }

    fn factory_target_is_traced(
        &mut self,
        module_path: &Path,
        target: &FactoryTarget,
        stack: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        match target {
            FactoryTarget::Local(factory_name) => {
                self.factory_is_traced(module_path, factory_name, stack)
            }
            FactoryTarget::Imported {
                source,
                imported_name,
            } => {
                let Some(resolved) = self.resolver.resolve_imported_module(
                    module_path,
                    source,
                    &self.sync_root,
                )?
                else {
                    return Ok(None);
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
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        let cache_key = (module_path.to_path_buf(), factory_name.to_string());
        if let Some(cached) = self.factory_cache.get(&cache_key) {
            return Ok(cached.clone());
        }

        let stack_key = format!("factory:{}::{factory_name}", module_path.display());
        if stack.contains(&stack_key) {
            return Ok(None);
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
            None => None,
        };

        stack.pop();
        self.factory_cache.insert(cache_key, result.clone());
        Ok(result)
    }

    fn import_target_is_traced(
        &mut self,
        module_path: &Path,
        source: &str,
        imported_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        if source == "@reference-ui/react" {
            // Primitives own nothing in the trace flow; the match is the host.
            return Ok(self
                .surface
                .primitives
                .contains(imported_name)
                .then(BTreeSet::new));
        }

        let Some(resolved_module) = self.resolver.resolve_imported_module(
            module_path,
            source,
            &self.sync_root,
        )?
        else {
            return Ok(None);
        };
        self.ensure_module_loaded(&resolved_module)?;
        self.export_is_traced(&resolved_module, imported_name, stack)
    }

    fn ensure_module_loaded(&mut self, module_path: &Path) -> Result<(), StyleTraceError> {
        if self.modules.contains_key(module_path) {
            return Ok(());
        }

        match parse_trace_module(module_path, &self.sync_root, &self.surface, self.sources) {
            Ok(module) => {
                self.modules.insert(module_path.to_path_buf(), module);
            }
            Err(error) => {
                self.diagnostics.push(TraceDiagnostic::for_file(
                    module_path.to_path_buf(),
                    error.to_string(),
                ));
                self.modules
                    .insert(module_path.to_path_buf(), TraceModule::empty());
            }
        }
        Ok(())
    }
}
