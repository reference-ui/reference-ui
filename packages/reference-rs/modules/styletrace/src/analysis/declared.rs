//! Reads the owned props of an export's declared component, whether or not that component traces.
//! A name follows its re-export, or the first `export *` source that declares it, down to the component record that holds its owned props.
//! One query enters each module and name at most once: `explored` records every entry, and an entry met again answers nothing, so a star cycle cannot multiply its paths. Pruning that way keeps the first declaration in source order: a branch that yields nothing holds no declaration reachable from it, so skipping it later cannot change which one comes first.
//! It takes a module and an export name and emits the owned set, or nothing when the component keeps no prop. Trace verdicts and host decisions stay in `analyzer.rs` and `memo.rs`; this walk never marks a host.

use std::collections::BTreeSet;
use std::path::Path;

use super::analyzer::StyleTraceAnalyzer;
use super::model::ExportTarget;
use crate::resolver::StyleTraceError;

impl StyleTraceAnalyzer<'_> {
    /// The owned props of the component `export_name` names in `module_path`, traced or not.
    /// `explored` is this query's sorted list of entered nodes; a node already on it answers nothing.
    pub(super) fn declared_export_owned(
        &mut self,
        module_path: &Path,
        export_name: &str,
        explored: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        let visit = format!("{}::{export_name}", module_path.display());
        match explored.binary_search(&visit) {
            Ok(_) => Ok(None),
            Err(at) => {
                explored.insert(at, visit);
                self.declared_export_target(module_path, export_name, explored)
            }
        }
    }

    /// What an export names: a local component, an import, or, for a name with no direct export,
    /// the `export *` sources in order.
    fn declared_export_target(
        &mut self,
        module_path: &Path,
        export_name: &str,
        explored: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        let target = self
            .modules
            .get(module_path)
            .and_then(|module| module.exports.get(export_name))
            .cloned();
        match target {
            Some(ExportTarget::Local(local)) => {
                Ok(self.declared_component_owned(module_path, &local))
            }
            Some(ExportTarget::Imported {
                source,
                imported_name,
            }) => self.declared_import_owned(module_path, &source, &imported_name, explored),
            None => self.declared_export_all_owned(module_path, export_name, explored),
        }
    }

    /// The owned props of a component this module declares, when it keeps any.
    fn declared_component_owned(
        &self,
        module_path: &Path,
        component_name: &str,
    ) -> Option<BTreeSet<String>> {
        self.modules
            .get(module_path)
            .and_then(|module| module.components.get(component_name))
            .map(|component| component.owned_props.clone())
            .filter(|owned| !owned.is_empty())
    }

    /// The owned props an import names in its source module. Primitives declare nothing here.
    fn declared_import_owned(
        &mut self,
        module_path: &Path,
        source: &str,
        imported_name: &str,
        explored: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        if source == "@reference-ui/react" {
            return Ok(None);
        }
        let Some(resolved) =
            self.resolver
                .resolve_imported_module(module_path, source, &self.sync_root)?
        else {
            return Ok(None);
        };
        self.ensure_module_loaded(&resolved)?;
        self.declared_export_owned(&resolved, imported_name, explored)
    }

    /// The owned props of a name with no direct export: the first `export *` source that declares it.
    fn declared_export_all_owned(
        &mut self,
        module_path: &Path,
        export_name: &str,
        explored: &mut Vec<String>,
    ) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
        let sources = self
            .modules
            .get(module_path)
            .map(|module| module.export_all_sources.clone())
            .unwrap_or_default();
        for source in sources {
            if let Some(owned) =
                self.declared_import_owned(module_path, &source, export_name, explored)?
            {
                return Ok(Some(owned));
            }
        }
        Ok(None)
    }
}
