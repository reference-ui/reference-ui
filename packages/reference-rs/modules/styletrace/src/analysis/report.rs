//! Gathers what the walk reports beyond its bindings: the owned props each traced name keeps, and the warnings the finished walk owns.
//! Edge-target skips are recorded while walking; class components are read from the parsed modules and unresolved higher-order arguments from the walk's facts, once the walk has settled.
//! Takes the analyzer's accumulated state and emits the drained owned-props map and the diagnostics in a stable order.

use std::collections::{BTreeMap, BTreeSet};

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

    /// Drain the owned-props map: each traced export name to the prop
    /// names its own declaration owns. Same-named exports union.
    pub(super) fn take_owned_props(&mut self) -> BTreeMap<String, BTreeSet<String>> {
        std::mem::take(&mut self.owned_props)
    }

    /// Record one traced export's owned props under its export name.
    /// Empty sets stay out: untraced and own-nothing hosts both mean
    /// no shadow, so the map carries only real shadows.
    pub(super) fn record_owned(&mut self, export_name: &str, owned: BTreeSet<String>) {
        if owned.is_empty() {
            return;
        }
        self.owned_props
            .entry(export_name.to_string())
            .or_default()
            .extend(owned);
    }
}
