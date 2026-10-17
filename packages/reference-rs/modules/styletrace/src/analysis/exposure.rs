//! Lists the names a module exposes, each with the owned props its declaration keeps.
//! A module exposes its own exports, the names behind its `export *` barrels (which skip `default` and any name the module exports itself), its compound-member aliases, the aliases of its re-exported namespaces, and each `export * as Name` namespace, whose names read `Name.<exposed name>`.
//! An export whose target traces is a traced exposure and lists a binding; one that does not trace, but whose declared component owns props, is a declared exposure that only feeds the owned map.
//! A default re-export takes the name of the binding it re-exports, since a JSX consumer spells that name; a local default keeps the literal `default`.
//! Emits unlabelled exposures: the caller stamps the module label, lists bindings for the traced ones and records owned props for both, so a namespace's names never leak under their bare spelling.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use super::aliases::{alias_exposures, remapped_aliases, WalkModule};
use super::analyzer::StyleTraceAnalyzer;
use super::model::{ExportTarget, MemberAlias, TraceModule};
use super::parser::exports::{ANONYMOUS_DEFAULT, DEFAULT_EXPORT};
use crate::resolver::StyleTraceError;

/// One name a module exposes, with the owned props its declaration keeps. Only a traced exposure
/// lists a binding; a declared one carries owned props for a component that does not trace.
pub(super) struct Exposure {
    pub(super) name: String,
    pub(super) owned: BTreeSet<String>,
    pub(super) traced: bool,
}

impl Exposure {
    fn traced(name: String, owned: BTreeSet<String>) -> Self {
        Self {
            name,
            owned,
            traced: true,
        }
    }

    fn declared(name: String, owned: BTreeSet<String>) -> Self {
        Self {
            name,
            owned,
            traced: false,
        }
    }
}

/// Alias exposures trace or stay silent, so every one of them is a traced exposure.
fn traced_exposures(pairs: Vec<(String, BTreeSet<String>)>) -> Vec<Exposure> {
    pairs
        .into_iter()
        .map(|(name, owned)| Exposure::traced(name, owned))
        .collect()
}

/// Whether a star source of `module` re-exports `name`: never `default`, and never a name `module`
/// exports itself.
fn star_reexports(module: &TraceModule, name: &str) -> bool {
    // ECMA-262 GetExportedNames: a star skips `default`, and a local export shadows a star name.
    name != DEFAULT_EXPORT && !module.exports.contains_key(name)
}

impl StyleTraceAnalyzer<'_> {
    /// Every name `module_path` exposes. `expanding` lists the modules whose namespaces are
    /// being expanded, so a namespace cycle yields nothing instead of recursing forever.
    pub(super) fn module_exposures(
        &mut self,
        module_path: &Path,
        expanding: &mut Vec<PathBuf>,
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let Some(module) = self.modules.get(module_path).cloned() else {
            return Ok(Vec::new());
        };
        if expanding.iter().any(|path| path == module_path) {
            return Ok(Vec::new());
        }
        expanding.push(module_path.to_path_buf());
        let exposures = self.expose_module(module_path, &module, expanding);
        expanding.pop();
        exposures
    }

    fn expose_module(
        &mut self,
        module_path: &Path,
        module: &TraceModule,
        expanding: &mut Vec<PathBuf>,
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let mut exposures = self.own_exposures(module_path, module)?;
        exposures.extend(self.export_all_exposures(module_path, module)?);
        exposures.extend(self.alias_names(module_path, module, &module.member_aliases)?);
        exposures.extend(self.reexported_alias_exposures(module_path, module)?);
        exposures.extend(self.namespace_exposures(module_path, module, expanding)?);
        Ok(exposures)
    }

    /// The module's own exports, under their public names: traced or declared.
    fn own_exposures(
        &mut self,
        module_path: &Path,
        module: &TraceModule,
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let mut exposures = Vec::new();
        for export_name in module.exports.keys() {
            exposures.extend(self.export_exposure(module_path, export_name)?);
        }
        Ok(exposures)
    }

    /// One export's exposure: traced when its target traces, declared when its component keeps
    /// owned props without tracing, and nothing when it keeps none.
    fn export_exposure(
        &mut self,
        module_path: &Path,
        export_name: &str,
    ) -> Result<Option<Exposure>, StyleTraceError> {
        if let Some(owned) = self.export_is_traced(module_path, export_name, &mut Vec::new())? {
            let name = self.exposed_name(module_path, export_name)?;
            return Ok(Some(Exposure::traced(name, owned)));
        }
        let Some(owned) =
            self.declared_export_owned(module_path, export_name, &mut Vec::new())?
        else {
            return Ok(None);
        };
        let name = self.exposed_name(module_path, export_name)?;
        Ok(Some(Exposure::declared(name, owned)))
    }

    /// The names behind `export *` sources. One level deep, as the export-star walk has always been.
    /// A star source skips `default` and any name `module` exports itself, which shadows it.
    fn export_all_exposures(
        &mut self,
        module_path: &Path,
        module: &TraceModule,
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let mut exposures = Vec::new();
        for source in &module.export_all_sources {
            let Some(target) =
                self.resolver
                    .resolve_imported_module(module_path, source, &self.sync_root)?
            else {
                continue;
            };
            self.ensure_module_loaded(&target)?;
            let Some(target_module) = self.modules.get(&target).cloned() else {
                continue;
            };
            for export_name in target_module.exports.keys() {
                if star_reexports(module, export_name) {
                    exposures.extend(self.export_exposure(&target, export_name)?);
                }
            }
            let aliases = &target_module.member_aliases;
            exposures.extend(self.alias_names(&target, &target_module, aliases)?);
        }
        Ok(exposures)
    }

    fn alias_names(
        &mut self,
        path: &Path,
        module: &TraceModule,
        aliases: &[MemberAlias],
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let pairs = alias_exposures(self, &WalkModule { path, module, aliases })?;
        Ok(traced_exposures(pairs))
    }

    /// Aliases of each namespace this module re-exports (`export { Tabs as Accordion }`), renamed to the export.
    fn reexported_alias_exposures(
        &mut self,
        module_path: &Path,
        module: &TraceModule,
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let mut exposures = Vec::new();
        for (export_name, target) in &module.exports {
            let ExportTarget::Imported {
                source,
                imported_name,
            } = target
            else {
                continue;
            };
            let Some(resolved) =
                self.resolver
                    .resolve_imported_module(module_path, source, &self.sync_root)?
            else {
                continue;
            };
            self.ensure_module_loaded(&resolved)?;
            let Some(target_module) = self.modules.get(&resolved).cloned() else {
                continue;
            };
            let remapped = remapped_aliases(&target_module, imported_name, export_name);
            if remapped.is_empty() {
                continue;
            }
            let walk = WalkModule {
                path: &resolved,
                module: &target_module,
                aliases: &remapped,
            };
            exposures.extend(traced_exposures(alias_exposures(self, &walk)?));
        }
        Ok(exposures)
    }

    /// `export * as Name from 'source'`: every name `source` exposes, prefixed with `Name.`.
    fn namespace_exposures(
        &mut self,
        module_path: &Path,
        module: &TraceModule,
        expanding: &mut Vec<PathBuf>,
    ) -> Result<Vec<Exposure>, StyleTraceError> {
        let mut exposures = Vec::new();
        for namespace in &module.namespace_exports {
            let Some(target) = self.resolver.resolve_imported_module(
                module_path,
                &namespace.source,
                &self.sync_root,
            )?
            else {
                continue;
            };
            self.ensure_module_loaded(&target)?;
            for exposure in self.module_exposures(&target, expanding)? {
                let Exposure { name, owned, traced } = exposure;
                exposures.push(Exposure {
                    name: format!("{}.{}", namespace.namespace, name),
                    owned,
                    traced,
                });
            }
        }
        Ok(exposures)
    }

    /// The public spelling of one export. A default re-export takes the name of the binding it
    /// re-exports; a local default keeps the literal `default`.
    fn exposed_name(&mut self, module_path: &Path, export_name: &str) -> Result<String, StyleTraceError> {
        if export_name != DEFAULT_EXPORT {
            return Ok(export_name.to_string());
        }
        let is_reexport = self
            .modules
            .get(module_path)
            .and_then(|module| module.exports.get(DEFAULT_EXPORT))
            .is_some_and(|target| matches!(target, ExportTarget::Imported { .. }));
        if !is_reexport {
            return Ok(DEFAULT_EXPORT.to_string());
        }
        let binding = self.default_binding_name(module_path)?;
        Ok(binding.unwrap_or_else(|| DEFAULT_EXPORT.to_string()))
    }

    /// The binding a module's default export ultimately names, following default re-exports across
    /// modules. An anonymous default names no binding, and a cycle of re-exports names nothing.
    fn default_binding_name(&mut self, module_path: &Path) -> Result<Option<String>, StyleTraceError> {
        let mut current = module_path.to_path_buf();
        let mut visited = Vec::new();
        while !visited.contains(&current) {
            visited.push(current.clone());
            match self.default_hop(&current)? {
                DefaultHop::Settled(name) => return Ok(name),
                DefaultHop::Follow(next) => current = next,
            }
        }
        Ok(None)
    }

    /// One step of the default-binding walk: the name a module's default settles on, or the module
    /// its default is re-exported from.
    fn default_hop(&mut self, module_path: &Path) -> Result<DefaultHop, StyleTraceError> {
        let target = self
            .modules
            .get(module_path)
            .and_then(|module| module.exports.get(DEFAULT_EXPORT))
            .cloned();
        match target {
            None => Ok(DefaultHop::Settled(None)),
            Some(ExportTarget::Local(local)) => {
                Ok(DefaultHop::Settled((local != ANONYMOUS_DEFAULT).then_some(local)))
            }
            Some(ExportTarget::Imported { imported_name, .. })
                if imported_name != DEFAULT_EXPORT =>
            {
                Ok(DefaultHop::Settled(Some(imported_name)))
            }
            Some(ExportTarget::Imported { source, .. }) => {
                self.follow_default_reexport(module_path, &source)
            }
        }
    }

    /// The default is re-exported from `source`: follow it, unless the source does not resolve.
    fn follow_default_reexport(
        &mut self,
        module_path: &Path,
        source: &str,
    ) -> Result<DefaultHop, StyleTraceError> {
        let resolved =
            self.resolver
                .resolve_imported_module(module_path, source, &self.sync_root)?;
        let Some(next) = resolved else {
            return Ok(DefaultHop::Settled(None));
        };
        self.ensure_module_loaded(&next)?;
        Ok(DefaultHop::Follow(next))
    }
}

/// What one step of the default-binding walk settles on.
enum DefaultHop {
    Settled(Option<String>),
    Follow(PathBuf),
}
