//! Collects the walk's bindings and the owned props and warnings it reports beyond them.
//! The report holds the owned props each traced name keeps, the owned props each module's own components keep, and the warnings the finished walk owns.
//! Edge-target skips are recorded while walking; class components and prop-type limit cuts are read from the parsed modules, and unresolved higher-order arguments from the walk's facts, once the walk has settled.
//! Takes the analyzer's accumulated state and emits the drained owned-props map and the diagnostics in a stable order.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use crate::diagnostics::{
    class_component, type_expansion_limit, unresolved_hoc_argument, StyletraceDiagnostic,
};
use crate::resolver::StyleTraceError;

use super::analyzer::StyleTraceAnalyzer;
use super::model::TracedBinding;
use super::source_files::format_relative_module;

impl StyleTraceAnalyzer<'_> {
    pub(super) fn collect_exported_bindings(
        &mut self,
        source_root: &Path,
    ) -> Result<Vec<TracedBinding>, StyleTraceError> {
        let module_paths = self.modules.keys().cloned().collect::<Vec<_>>();
        self.outer_modules = module_paths.iter().cloned().collect();
        self.collect_bindings(&module_paths, source_root)
    }

    /// Lists the bindings of every module in `module_paths`, in order. Exposure skips a declared
    /// same-name re-export only when its source is in `outer_modules`.
    pub(super) fn collect_bindings(
        &mut self,
        module_paths: &[PathBuf],
        source_root: &Path,
    ) -> Result<Vec<TracedBinding>, StyleTraceError> {
        let mut bindings = BTreeSet::new();
        let source_root_is_file = source_root.is_file();
        for module_path in module_paths {
            self.collect_module_bindings(
                module_path,
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
        for exposure in self.module_exposures(module_path, &mut Vec::new(), true)? {
            if exposure.traced {
                bindings.insert(TracedBinding::new(&rel_module, &exposure.name));
            }
            self.record_owned(&exposure.name, exposure.owned);
        }
        Ok(())
    }

    /// Drain the walk's diagnostics: edge-target skips recorded while walking, then the class,
    /// limit-cut and unresolved-argument warnings that the finished walk owns.
    pub(super) fn take_diagnostics(&mut self) -> Vec<StyletraceDiagnostic> {
        let mut diagnostics = std::mem::take(&mut self.diagnostics);
        diagnostics.extend(self.structural_warnings());
        diagnostics
    }

    /// Class-component warnings in module order, then type-expansion-limit warnings in module order,
    /// then unresolved-argument warnings in binding order, so the report is the same on every run.
    fn structural_warnings(&self) -> Vec<StyletraceDiagnostic> {
        let classes = self.modules.iter().flat_map(|(path, module)| {
            let file = path.to_string_lossy().to_string();
            module
                .class_components
                .iter()
                .filter_map(move |name| class_component(&file, name))
        });
        let limits = self.modules.iter().flat_map(|(path, module)| {
            let file = path.to_string_lossy().to_string();
            module
                .type_cuts
                .iter()
                .filter_map(move |cut| type_expansion_limit(&file, cut))
        });
        let holes = self
            .unresolved_hocs
            .iter()
            .filter_map(|((path, binding), (hoc, index))| {
                unresolved_hoc_argument(&path.to_string_lossy(), binding, hoc, *index)
            });
        classes.chain(limits).chain(holes).collect()
    }

    /// Drain the owned-props map: each export name that declares props to the prop
    /// names its own declaration keeps for itself. Same-named exports union.
    pub(super) fn take_owned_props(&mut self) -> BTreeMap<String, BTreeSet<String>> {
        std::mem::take(&mut self.owned_props)
    }

    /// Record one export's owned props under its export name, whether or not the
    /// component traces. Empty sets stay out: an export that owns nothing means no
    /// shadow, so the map carries only real shadows.
    pub(super) fn record_owned(&mut self, export_name: &str, owned: BTreeSet<String>) {
        if owned.is_empty() {
            return;
        }
        self.owned_props
            .entry(export_name.to_string())
            .or_default()
            .extend(owned);
    }

    /// Each module's components that keep props for themselves, by local name, exported or not.
    /// A component the module never exports has no export name to carry its owned props, so its
    /// own file's call sites read them here. Modules whose components keep nothing stay out.
    pub(super) fn local_owned_props(&self) -> BTreeMap<PathBuf, BTreeMap<String, BTreeSet<String>>> {
        self.modules
            .iter()
            .filter_map(|(path, module)| {
                let owned: BTreeMap<String, BTreeSet<String>> = module
                    .components
                    .iter()
                    .filter(|(_, component)| !component.owned_props.is_empty())
                    .map(|(name, component)| (name.clone(), component.owned_props.clone()))
                    .collect();
                (!owned.is_empty()).then(|| (path.clone(), owned))
            })
            .collect()
    }
}
