//! Gathers what the walk reports beyond its bindings: the owned props each traced name keeps, the owned props each module's own components keep, and the warnings the finished walk owns.
//! Edge-target skips are recorded while walking; class components are read from the parsed modules and unresolved higher-order arguments from the walk's facts, once the walk has settled.
//! Takes the analyzer's accumulated state and emits the drained owned-props map and the diagnostics in a stable order.

use std::collections::{BTreeMap, BTreeSet};
use std::path::PathBuf;

use crate::diagnostics::{class_component, unresolved_hoc_argument, StyletraceDiagnostic};

use super::analyzer::StyleTraceAnalyzer;

impl StyleTraceAnalyzer<'_> {
    /// Drain the walk's diagnostics: edge-target skips recorded while walking, then the class and
    /// unresolved-argument warnings that the finished walk owns.
    pub(super) fn take_diagnostics(&mut self) -> Vec<StyletraceDiagnostic> {
        let mut diagnostics = std::mem::take(&mut self.diagnostics);
        diagnostics.extend(self.structural_warnings());
        diagnostics
    }

    /// Class-component warnings in module order, then unresolved-argument warnings in binding order,
    /// so the report is the same on every run.
    fn structural_warnings(&self) -> Vec<StyletraceDiagnostic> {
        let classes = self.modules.iter().flat_map(|(path, module)| {
            let file = path.to_string_lossy().to_string();
            module
                .class_components
                .iter()
                .filter_map(move |name| class_component(&file, name))
        });
        let holes = self
            .unresolved_hocs
            .iter()
            .filter_map(|((path, binding), (hoc, index))| {
                unresolved_hoc_argument(&path.to_string_lossy(), binding, hoc, *index)
            });
        classes.chain(holes).collect()
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
