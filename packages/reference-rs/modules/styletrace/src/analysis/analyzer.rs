//! Walks the parsed wrapper graph to decide which exported components are style-traced.
//! It takes parsed modules plus the surface sets and follows local, imported, and factory edges back to Reference primitives.
//! Emits the exported bindings whose style props reach a primitive, plus the warnings the walk owns: class components and higher-order arguments it could not resolve.
//! Entry parsing and surface acquisition live in `surface.rs`, name exposure in `exposure.rs`, declared-only owned props in `declared.rs`, and higher-order application in `hoc.rs`; this file stays the walker.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use crate::diagnostics::{push_skipped, StyletraceDiagnostic};
use crate::resolver::StyleTraceError;

use super::hoc::{HocCall, UnresolvedHocs};
use super::memo::{TraceMemo, Verdict};
use super::model::{
    EdgeTarget, ExportTarget, FactoryTarget, TraceComponent, TraceModule, TracedBinding,
};
use super::module_resolution::ModuleResolver;
use super::parser::parse_trace_module;
use super::source_files::format_relative_module;
use super::surface::{StyleSurface, TraceSources};

pub(super) struct StyleTraceAnalyzer<'s> {
    pub(super) modules: BTreeMap<PathBuf, TraceModule>,
    pub(super) surface: StyleSurface,
    pub(super) sync_root: PathBuf,
    sources: &'s TraceSources<'s>,
    pub(super) resolver: ModuleResolver<'s>,
    pub(super) memo: TraceMemo,
    pub(super) unresolved_hocs: UnresolvedHocs,
    pub(super) owned_props: BTreeMap<String, BTreeSet<String>>,
    pub(super) diagnostics: Vec<StyletraceDiagnostic>,
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
            memo: TraceMemo::default(),
            unresolved_hocs: UnresolvedHocs::new(),
            owned_props: BTreeMap::new(),
            diagnostics: Vec::new(),
        }
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

    /// Stamp one module's traced names with its label and list them as bindings, then record the
    /// owned props of every exposure, traced or declared-only.
    fn collect_module_bindings(
        &mut self,
        module_path: &Path,
        source_root: &Path,
        source_root_is_file: bool,
        bindings: &mut BTreeSet<TracedBinding>,
    ) -> Result<(), StyleTraceError> {
        if !self.modules.contains_key(module_path) {
            return Ok(());
        }
        let rel_module = format_relative_module(module_path, source_root, source_root_is_file);
        for exposure in self.module_exposures(module_path, &mut Vec::new())? {
            if exposure.traced {
                bindings.insert(TracedBinding::new(&rel_module, &exposure.name));
            }
            self.record_owned(&exposure.name, exposure.owned);
        }
        Ok(())
    }

    /// Body of one export node. The export's owned props when its target
    /// traces: the resolved component's own declaration, so re-exports carry
    /// the origin's names. The memo in `memo.rs` settles the verdict.
    pub(super) fn export_body(
        &mut self,
        module_path: &Path,
        export_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let export_target = self
            .modules
            .get(module_path)
            .and_then(|module| module.exports.get(export_name))
            .cloned();

        match export_target {
            Some(ExportTarget::Local(local_name)) => {
                self.component_is_traced(module_path, &local_name, stack)
            }
            Some(ExportTarget::Imported {
                source,
                imported_name,
            }) => self.import_target_is_traced(module_path, &source, &imported_name, stack),
            None => self.export_all_is_traced(module_path, export_name, stack),
        }
    }

    /// A name with no direct export is looked up through each `export * from` source, in order;
    /// the first source whose target traces wins.
    fn export_all_is_traced(
        &mut self,
        module_path: &Path,
        export_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let export_all_sources = self
            .modules
            .get(module_path)
            .map(|module| module.export_all_sources.clone())
            .unwrap_or_default();

        for source in export_all_sources {
            if let Some(owned) =
                self.import_target_is_traced(module_path, &source, export_name, stack)?
            {
                return Ok(Some(owned));
            }
        }
        Ok(None)
    }

    /// Body of one component node: its own style props and edges, or the
    /// factory product it was minted from. The memo in `memo.rs` settles the verdict.
    pub(super) fn component_body(
        &mut self,
        module_path: &Path,
        component_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let component = self
            .modules
            .get(module_path)
            .and_then(|module| module.components.get(component_name))
            .cloned();

        if let Some(component) = component {
            return self.component_value_is_traced(module_path, &component, stack, None);
        }
        self.factory_component_is_traced(module_path, component_name, stack)
    }

    /// A name that is not a local component traces through the factory call that minted it, if any.
    fn factory_component_is_traced(
        &mut self,
        module_path: &Path,
        component_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let component_factory = self
            .modules
            .get(module_path)
            .and_then(|module| module.component_factories.get(component_name))
            .cloned();

        match component_factory {
            Some(call) => self.factory_call_is_traced(module_path, component_name, &call, stack),
            None => Ok(None),
        }
    }

    /// Whether a component's style props reach a primitive. `call` carries the arguments of the
    /// higher-order application that produced the component, when there is one.
    pub(super) fn component_value_is_traced(
        &mut self,
        module_path: &Path,
        component: &TraceComponent,
        stack: &mut Vec<String>,
        call: Option<&HocCall<'_>>,
    ) -> Result<Verdict, StyleTraceError> {
        if !component.exposes_style_props {
            return Ok(None);
        }
        if component.uses_style_pipeline {
            return Ok(Some(component.owned_props.clone()));
        }

        for edge in &component.edges {
            if self
                .edge_is_traced(module_path, &edge.target, stack, call)?
                .is_some()
            {
                return Ok(Some(component.owned_props.clone()));
            }
        }
        if let Some(call) = call {
            self.note_unresolved_arguments(call, component);
        }
        Ok(None)
    }

    /// The verdict of one edge: a higher-order parameter, resolved against the call, or a target
    /// that names a primitive, a local binding or an import.
    pub(super) fn edge_is_traced(
        &mut self,
        module_path: &Path,
        target: &EdgeTarget,
        stack: &mut Vec<String>,
        call: Option<&HocCall<'_>>,
    ) -> Result<Verdict, StyleTraceError> {
        if let EdgeTarget::Parameter(index) = target {
            return match call {
                Some(call) => self.parameter_is_traced(call, *index, stack),
                None => Ok(None),
            };
        }
        self.resolved_edge_is_traced(module_path, target, stack)
    }

    /// The verdict of an edge that names a primitive, a local binding or an import.
    fn resolved_edge_is_traced(
        &mut self,
        module_path: &Path,
        target: &EdgeTarget,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        match target {
            EdgeTarget::Primitive(name) => {
                Ok(self.surface.primitives.contains(name).then(BTreeSet::new))
            }
            EdgeTarget::Local(local_name) => {
                self.local_target_is_traced(module_path, local_name, stack)
            }
            EdgeTarget::Imported {
                source,
                imported_name,
            } => self.import_target_is_traced(module_path, source, imported_name, stack),
            EdgeTarget::Parameter(_) => Ok(None),
        }
    }

    /// The owned props when a local edge target traces: a local component
    /// or factory, else an ident alias chain (`const IconShell = Div`)
    /// onto a primitive, an import, or another local. One walk serves
    /// both: components classify local, aliases follow the chain.
    fn local_target_is_traced(
        &mut self,
        module_path: &Path,
        target: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let Some(module) = self.modules.get(module_path).cloned() else {
            return Ok(None);
        };
        let walk = super::aliases::WalkModule {
            path: module_path,
            module: &module,
            aliases: &[],
        };
        super::aliases::ident_alias_target_is_traced(self, &walk, target, stack)
    }

    /// The memoized no-argument verdict of a factory target.
    pub(super) fn factory_target_is_traced(
        &mut self,
        module_path: &Path,
        target: &FactoryTarget,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        match self.resolve_factory(module_path, target)? {
            Some((factory_module, factory_name)) => {
                self.factory_is_traced(&factory_module, &factory_name, stack)
            }
            None => Ok(None),
        }
    }

    /// Body of one factory node: the component its factory returns, with no
    /// arguments bound. A forwarding factory never reaches here from a call site.
    pub(super) fn factory_body(
        &mut self,
        module_path: &Path,
        factory_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let result = match self
            .modules
            .get(module_path)
            .and_then(|module| module.factories.get(factory_name))
            .cloned()
        {
            Some(factory) => {
                self.component_value_is_traced(module_path, &factory.component, stack, None)?
            }
            None => None,
        };

        Ok(result)
    }

    pub(super) fn import_target_is_traced(
        &mut self,
        module_path: &Path,
        source: &str,
        imported_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
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

    pub(super) fn ensure_module_loaded(
        &mut self,
        module_path: &Path,
    ) -> Result<(), StyleTraceError> {
        if self.modules.contains_key(module_path) {
            return Ok(());
        }

        match parse_trace_module(module_path, &self.sync_root, &self.surface, self.sources) {
            Ok(module) => {
                self.modules.insert(module_path.to_path_buf(), module);
            }
            Err(error) => {
                let file = module_path.to_string_lossy().to_string();
                push_skipped(&mut self.diagnostics, Some(&file), error.to_string());
                self.modules
                    .insert(module_path.to_path_buf(), TraceModule::empty());
            }
        }
        Ok(())
    }
}
