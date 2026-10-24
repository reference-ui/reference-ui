//! Observation pass: counts configured elements, such as a library's primitives, at JSX call sites.
//! Takes the app's parsed modules plus the `observe` specs and emits one `ObservedElement` per
//! (name, source) it saw. A tag binds to an element through a named or aliased import from the
//! spec's source, a namespace member of that source, or, when the file imports from the source
//! and nothing else declares the name, as an unbound tag. Scoring follows the component policy:
//! element usage over all observed counts, prop usage over the element's count, and usedWith
//! among observed names only. It reads the occurrences and scope names the parser stored on each module.

use crate::config::ObserveSpec;
use crate::internal::{JsxOccurrence, ModuleInfo};
use crate::model::{ComponentProp, ObservedElement};
use crate::usage_policy::{score_usage, score_used_with};
use std::collections::{BTreeMap, BTreeSet, HashSet};

#[cfg(test)]
mod tests;

const MAX_EXAMPLES: usize = 5;

/// An observed element's identity: its name and the source it is observed from.
type ElementKey = (String, String);

pub fn observe_elements(modules: &[&ModuleInfo], specs: &[ObserveSpec]) -> Vec<ObservedElement> {
    if specs.is_empty() {
        return Vec::new();
    }

    let index = SpecIndex::new(specs);
    let mut pass = ObservePass::default();
    for module in modules {
        pass.observe_module(module, &index);
    }
    pass.finish()
}

/// The configured names grouped by source. Specs that share a source merge, and sources keep
/// config order so an unbound tag listed under several imported sources resolves to the first.
struct SpecIndex {
    sources: Vec<(String, BTreeSet<String>)>,
}

impl SpecIndex {
    fn new(specs: &[ObserveSpec]) -> Self {
        let mut sources: Vec<(String, BTreeSet<String>)> = Vec::new();
        for spec in specs {
            match sources
                .iter_mut()
                .find(|(source, _)| *source == spec.source)
            {
                Some((_, names)) => names.extend(spec.names.iter().cloned()),
                None => sources.push((spec.source.clone(), spec.names.iter().cloned().collect())),
            }
        }
        Self { sources }
    }

    fn lists(&self, source: &str, name: &str) -> bool {
        self.sources
            .iter()
            .any(|(listed, names)| listed == source && names.contains(name))
    }

    fn resolve(&self, tag: &str, scope: &FileScope<'_>) -> Option<ElementKey> {
        if let Some((namespace, member)) = tag.split_once('.') {
            let source = scope.module.namespace_imports.get(namespace)?;
            return self
                .lists(source, member)
                .then(|| (member.to_string(), source.clone()));
        }
        if let Some(binding) = scope.module.imports.get(tag) {
            let imported = binding.imported.as_deref()?;
            return self
                .lists(&binding.source, imported)
                .then(|| (imported.to_string(), binding.source.clone()));
        }
        if scope.declared.contains(tag) {
            return None;
        }
        self.sources
            .iter()
            .filter(|(source, _)| scope.imported_sources.contains(source.as_str()))
            .find(|(_, names)| names.contains(tag))
            .map(|(source, _)| (tag.to_string(), source.clone()))
    }
}

/// What one file's imports and declarations say about a tag name.
struct FileScope<'a> {
    module: &'a ModuleInfo,
    /// Observed sources the file imports anything from.
    imported_sources: HashSet<&'a str>,
    declared: &'a HashSet<String>,
}

impl<'a> FileScope<'a> {
    /// `None` when the file imports from no observed source: no binding rule can match then.
    fn new(module: &'a ModuleInfo, index: &'a SpecIndex) -> Option<Self> {
        let imported_sources: HashSet<&str> = index
            .sources
            .iter()
            .map(|(source, _)| source.as_str())
            .filter(|source| {
                module
                    .imports
                    .values()
                    .any(|binding| binding.source == *source)
            })
            .collect();
        if imported_sources.is_empty() {
            return None;
        }
        Some(Self {
            module,
            imported_sources,
            declared: &module.scope_declarations,
        })
    }
}

#[derive(Default)]
struct ObservePass {
    elements: BTreeMap<ElementKey, ElementTally>,
}

impl ObservePass {
    fn observe_module(&mut self, module: &ModuleInfo, index: &SpecIndex) {
        let Some(scope) = FileScope::new(module, index) else {
            return;
        };

        let mut seen_in_file = BTreeSet::new();
        for occurrence in &module.jsx_occurrences {
            let Some(key) = index.resolve(&occurrence.tag_name, &scope) else {
                continue;
            };
            self.elements
                .entry(key.clone())
                .or_default()
                .record(occurrence);
            seen_in_file.insert(key);
        }
        self.record_file(&seen_in_file);
    }

    /// Counts the file once for each element it holds and once for each pair seen together.
    fn record_file(&mut self, seen_in_file: &BTreeSet<ElementKey>) {
        for key in seen_in_file {
            let Some(tally) = self.elements.get_mut(key) else {
                continue;
            };
            tally.file_presence += 1;
            for (other_name, _) in seen_in_file.iter().filter(|other| other.0 != key.0) {
                *tally.used_with.entry(other_name.clone()).or_default() += 1;
            }
        }
    }

    fn finish(self) -> Vec<ObservedElement> {
        let total = self.elements.values().map(|tally| tally.count).sum::<u32>();
        self.elements
            .into_iter()
            .map(|((name, source), tally)| tally.into_element(name, source, total))
            .collect()
    }
}

#[derive(Default)]
struct ElementTally {
    count: u32,
    examples: Vec<String>,
    file_presence: u32,
    props: BTreeMap<String, PropTally>,
    used_with: BTreeMap<String, u32>,
}

#[derive(Default)]
struct PropTally {
    count: u32,
    values: BTreeMap<String, u32>,
}

impl ElementTally {
    fn record(&mut self, occurrence: &JsxOccurrence) {
        self.count += 1;
        if self.examples.len() < MAX_EXAMPLES && !self.examples.contains(&occurrence.snippet) {
            self.examples.push(occurrence.snippet.clone());
        }

        // A repeated attribute is one prop passed once, so a prop never outcounts its element.
        let mut passed = BTreeSet::new();
        for attribute in &occurrence.attributes {
            if !passed.insert(attribute.name.as_str()) {
                continue;
            }
            let prop = self.props.entry(attribute.name.clone()).or_default();
            prop.count += 1;
            if let Some(value) = &attribute.literal_value {
                *prop.values.entry(value.clone()).or_default() += 1;
            }
        }

        if occurrence.has_children && !passed.contains("children") {
            self.props.entry("children".to_string()).or_default().count += 1;
        }
    }

    fn into_element(self, name: String, source: String, total: u32) -> ObservedElement {
        let count = self.count;
        ObservedElement {
            name,
            source,
            count,
            usage: score_usage(count, total),
            examples: self.examples,
            file_presence: self.file_presence,
            props: self
                .props
                .into_iter()
                .map(|(prop_name, prop)| prop.into_prop(prop_name, count))
                .collect(),
            used_with: score_used_with(&self.used_with, self.file_presence),
        }
    }
}

impl PropTally {
    fn into_prop(self, name: String, element_count: u32) -> ComponentProp {
        let count = self.count;
        let values = self
            .values
            .into_iter()
            .map(|(value, value_count)| (value, score_usage(value_count, count)))
            .collect::<BTreeMap<_, _>>();

        ComponentProp {
            name,
            count,
            usage: score_usage(count, element_count),
            values: (!values.is_empty()).then_some(values),
        }
    }
}
