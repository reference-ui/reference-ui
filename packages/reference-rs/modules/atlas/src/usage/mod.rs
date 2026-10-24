//! Counts each tracked component's appearances in the app, with which props and beside which others. `collect_usage_for_module` takes one module, the usage snapshot taken before the pass, and the
//! mutable states, and adds that module's JSX occurrences, which the parser stored, to them. `finalize_components`
//! then scores the counts into the sorted `Component` list the result carries.

use crate::internal::{JsxAttribute, JsxOccurrence, ModuleInfo, UsageState};
use crate::model::{Component, ComponentProp};
use crate::resolver::{build_alias_map, resolve_occurrence_key, OccurrenceScope};
use crate::usage_policy::{score_usage, score_used_with};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::PathBuf;

mod literals;
mod observe;
mod scope;
mod walker;

pub use observe::observe_elements;
pub(crate) use scope::module_scope_declarations;
pub(crate) use walker::find_jsx_occurrences;

pub fn collect_usage_for_module(
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    state_snapshot: &BTreeMap<String, UsageState>,
    states: &mut BTreeMap<String, UsageState>,
) {
    let alias_map = build_alias_map(module, modules, state_snapshot);
    let scope = OccurrenceScope {
        modules,
        alias_map: &alias_map,
        namespace_map: &module.namespace_imports,
        states: state_snapshot,
    };
    let mut seen_in_file = BTreeSet::new();

    for occurrence in &module.jsx_occurrences {
        let Some(key) = resolve_occurrence_key(module, &scope, &occurrence.tag_name) else {
            continue;
        };
        let Some(state) = states.get_mut(&key) else {
            continue;
        };
        record_occurrence(state, occurrence);
        seen_in_file.insert(key);
    }

    let seen_keys = seen_in_file.into_iter().collect::<Vec<_>>();
    record_file_presence(states, &seen_keys);
    record_used_with(state_snapshot, states, &seen_keys);
}

fn record_occurrence(state: &mut UsageState, occurrence: &JsxOccurrence) {
    state.component.count += 1;
    record_example(state, &occurrence.snippet);
    let explicit_names = record_attributes(state, &occurrence.attributes);
    if occurrence.has_children && !explicit_names.contains("children") {
        bump_prop_count(state, "children");
    }
}

fn record_example(state: &mut UsageState, snippet: &str) {
    if state.example_set.insert(snippet.to_string()) && state.component.examples.len() < 5 {
        state.component.examples.push(snippet.to_string());
    }
}

/// Counts each attribute against its prop and its literal value, and returns the attribute names it saw.
fn record_attributes(state: &mut UsageState, attributes: &[JsxAttribute]) -> BTreeSet<String> {
    let mut explicit_names = BTreeSet::new();
    for attribute in attributes {
        explicit_names.insert(attribute.name.clone());
        bump_prop_count(state, &attribute.name);
        if let Some(value) = &attribute.literal_value {
            state
                .prop_value_counts
                .entry(attribute.name.clone())
                .or_default()
                .entry(value.clone())
                .and_modify(|count| *count += 1)
                .or_insert(1);
        }
    }
    explicit_names
}

fn bump_prop_count(state: &mut UsageState, name: &str) {
    if let Some(prop) = state.component.props.iter_mut().find(|prop| prop.name == name) {
        prop.count += 1;
    }
}

fn record_file_presence(states: &mut BTreeMap<String, UsageState>, seen_keys: &[String]) {
    for key in seen_keys {
        if let Some(state) = states.get_mut(key) {
            state.file_presence_count += 1;
        }
    }
}

fn record_used_with(
    state_snapshot: &BTreeMap<String, UsageState>,
    states: &mut BTreeMap<String, UsageState>,
    seen_keys: &[String],
) {
    for left_key in seen_keys {
        let other_names = seen_keys
            .iter()
            .filter(|right_key| *right_key != left_key)
            .filter_map(|right_key| {
                state_snapshot
                    .get(right_key)
                    .map(|state| state.component.name.clone())
            })
            .collect::<Vec<_>>();
        if let Some(state) = states.get_mut(left_key) {
            for other_name in other_names {
                state
                    .used_with_counts
                    .entry(other_name)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
        }
    }
}

pub fn finalize_components(states: BTreeMap<String, UsageState>) -> Vec<Component> {
    let total_count = states
        .values()
        .map(|state| state.component.count)
        .sum::<u32>();
    let mut components = Vec::new();

    for (_, mut state) in states {
        state.component.usage = score_usage(state.component.count, total_count);
        let component_count = state.component.count;
        for prop in &mut state.component.props {
            finalize_prop(
                prop,
                component_count,
                &state.prop_allowed_values,
                &state.prop_value_counts,
            );
        }

        state
            .component
            .props
            .sort_by(|left, right| left.name.cmp(&right.name));
        state.component.used_with =
            score_used_with(&state.used_with_counts, state.file_presence_count);
        components.push(state.component);
    }

    components.sort_by(|left, right| {
        left.name
            .cmp(&right.name)
            .then(left.source.cmp(&right.source))
    });
    components
}

/// Scores one prop's usage and its value distribution. Allowed values that never occurred still appear, at zero.
fn finalize_prop(
    prop: &mut ComponentProp,
    component_count: u32,
    allowed_values: &BTreeMap<String, BTreeSet<String>>,
    value_counts: &BTreeMap<String, BTreeMap<String, u32>>,
) {
    prop.usage = score_usage(prop.count, component_count);

    let mut values = BTreeMap::new();
    if let Some(allowed) = allowed_values.get(&prop.name) {
        for value in allowed {
            let count = value_counts
                .get(&prop.name)
                .and_then(|counts| counts.get(value))
                .copied()
                .unwrap_or(0);
            values.insert(value.clone(), score_usage(count, prop.count));
        }
    }

    if let Some(observed) = value_counts.get(&prop.name) {
        for (value, count) in observed {
            values.insert(value.clone(), score_usage(*count, prop.count));
        }
    }

    prop.values = (!values.is_empty()).then_some(values);
}
