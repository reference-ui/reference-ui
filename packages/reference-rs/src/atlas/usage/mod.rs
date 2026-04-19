use crate::atlas::internal::UsageState;
use crate::atlas::model::Component;
use crate::atlas::resolver::{build_alias_map, resolve_occurrence_key};
use crate::atlas::usage_policy::score_usage;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::PathBuf;

mod literals;
mod walker;

use walker::find_jsx_occurrences;

pub fn collect_usage_for_module(
    module: &crate::atlas::internal::ModuleInfo,
    modules: &HashMap<PathBuf, crate::atlas::internal::ModuleInfo>,
    state_snapshot: &BTreeMap<String, UsageState>,
    states: &mut BTreeMap<String, UsageState>,
) {
    let alias_map = build_alias_map(module, modules, state_snapshot);
    let namespace_map = module.namespace_imports.clone();
    let mut seen_in_file = BTreeSet::new();

    for occurrence in find_jsx_occurrences(module) {
        let resolved_key = resolve_occurrence_key(
            module,
            modules,
            &occurrence.tag_name,
            &alias_map,
            &namespace_map,
            state_snapshot,
        );
        let Some(key) = resolved_key else {
            continue;
        };
        let Some(state) = states.get_mut(&key) else {
            continue;
        };

        state.component.count += 1;
        if state.example_set.insert(occurrence.snippet.clone())
            && state.component.examples.len() < 5
        {
            state.component.examples.push(occurrence.snippet.clone());
        }
        seen_in_file.insert(key.clone());

        let mut explicit_names = BTreeSet::new();
        for attribute in occurrence.attributes {
            explicit_names.insert(attribute.name.clone());
            if let Some(prop) = state
                .component
                .props
                .iter_mut()
                .find(|prop| prop.name == attribute.name)
            {
                prop.count += 1;
            }
            if let Some(value) = attribute.literal_value {
                state
                    .prop_value_counts
                    .entry(attribute.name)
                    .or_default()
                    .entry(value)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
        }

        if occurrence.has_children && !explicit_names.contains("children") {
            if let Some(prop) = state
                .component
                .props
                .iter_mut()
                .find(|prop| prop.name == "children")
            {
                prop.count += 1;
            }
        }
    }

    for key in &seen_in_file {
        if let Some(state) = states.get_mut(key) {
            state.file_presence_count += 1;
        }
    }

    let seen_keys = seen_in_file.into_iter().collect::<Vec<_>>();
    for left_key in &seen_keys {
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

        for prop in &mut state.component.props {
            prop.usage = score_usage(prop.count, state.component.count);

            let mut values = BTreeMap::new();
            if let Some(allowed) = state.prop_allowed_values.get(&prop.name) {
                for value in allowed {
                    let count = state
                        .prop_value_counts
                        .get(&prop.name)
                        .and_then(|counts| counts.get(value))
                        .copied()
                        .unwrap_or(0);
                    values.insert(value.clone(), score_usage(count, prop.count));
                }
            }

            if let Some(observed) = state.prop_value_counts.get(&prop.name) {
                for (value, count) in observed {
                    values.insert(value.clone(), score_usage(*count, prop.count));
                }
            }

            prop.values = (!values.is_empty()).then_some(values);
        }

        state
            .component
            .props
            .sort_by(|left, right| left.name.cmp(&right.name));
        state.component.used_with = state
            .used_with_counts
            .into_iter()
            .map(|(name, count)| (name, score_usage(count, state.file_presence_count)))
            .collect();
        components.push(state.component);
    }

    components.sort_by(|left, right| {
        left.name
            .cmp(&right.name)
            .then(left.source.cmp(&right.source))
    });
    components
}
