//! Canonical in-memory recipe maps: the full combination map and the per-breakpoint responsive classes.
//! `build` derives both maps from stem and value names, the same derivation the runtime re-derives, so unit tests can compare shipped inputs against a full oracle.
//! Nothing in the shipped path calls these builders; the module compiles only under `cfg(test)` and the shipped table never serializes the maps.

use base_system::BreakpointScale;
use indexmap::IndexMap;

use super::{build_compound_variants, container_breakpoints, RecipeTableInput};
use crate::recipes::{name, CompiledCompound};
use crate::runtime::RecipeRuntimeTable;

/// Assemble the runtime recipe table from compiled variants and compounds.
pub(super) fn build(input: &RecipeTableInput<'_>) -> RecipeRuntimeTable {
    let base = name::base_class(input.qualified_name);
    let variant_keys: Vec<String> = input.variant_map.keys().cloned().collect();
    let compound_variants = build_compound_variants(input.compounds);
    let combinations = build_combinations(&base, &variant_keys, input.variant_map, input.compounds);
    let responsive_variant_map =
        build_responsive_map(input.qualified_name, input.variant_map, input.breakpoints);
    let responsive_breakpoints = container_breakpoints(input.breakpoints);

    RecipeRuntimeTable {
        qualified_name: input.qualified_name.to_string(),
        class_name: input.class_name.to_string(),
        base,
        variant_keys,
        variant_map: input.variant_map.clone(),
        default_variants: input.default_variants.clone(),
        compound_variants,
        combinations,
        responsive_variant_map,
        responsive_breakpoints,
    }
}

/// Map every variant value to its per-breakpoint classes.
///
/// Only breakpoints with a pixel width qualify: each entry has a matching
/// `@container` rule, and widthless names lower to selector wraps instead.
fn build_responsive_map(
    stem: &str,
    variant_map: &IndexMap<String, IndexMap<String, String>>,
    breakpoints: &BreakpointScale,
) -> IndexMap<String, IndexMap<String, IndexMap<String, String>>> {
    let mut out = IndexMap::new();
    for (axis, values) in variant_map {
        let mut per_breakpoint = IndexMap::new();
        for bp in container_breakpoints(breakpoints) {
            let mut per_value = IndexMap::new();
            for value in values.keys() {
                let class = name::responsive_variant_class(&bp, stem, axis, value);
                per_value.insert(value.clone(), class);
            }
            per_breakpoint.insert(bp, per_value);
        }
        out.insert(axis.clone(), per_breakpoint);
    }
    out
}

struct CombinationCtx<'a> {
    base: &'a str,
    variant_keys: &'a [String],
    variant_map: &'a IndexMap<String, IndexMap<String, String>>,
    compounds: &'a [CompiledCompound],
}

fn build_combinations(
    base: &str,
    variant_keys: &[String],
    variant_map: &IndexMap<String, IndexMap<String, String>>,
    compounds: &[CompiledCompound],
) -> IndexMap<String, String> {
    let mut combinations = IndexMap::new();
    if variant_keys.is_empty() {
        combinations.insert(String::new(), base.to_string());
        return combinations;
    }
    let ctx = CombinationCtx {
        base,
        variant_keys,
        variant_map,
        compounds,
    };
    for row in cartesian(variant_map) {
        let key = format_combination_key(variant_keys, &row);
        let classes = format_combination_classes(&ctx, &row);
        combinations.insert(key, classes);
    }
    combinations
}

fn format_combination_key(variant_keys: &[String], row: &IndexMap<String, String>) -> String {
    if variant_keys.len() == 1 {
        return row.values().next().cloned().unwrap_or_default();
    }
    variant_keys
        .iter()
        .filter_map(|k| row.get(k).map(String::as_str))
        .collect::<Vec<_>>()
        .join("|")
}

fn format_combination_classes(ctx: &CombinationCtx<'_>, row: &IndexMap<String, String>) -> String {
    let mut classes = vec![ctx.base.to_string()];
    for k in ctx.variant_keys {
        if let Some(val) = row.get(k) {
            if let Some(cls) = ctx.variant_map.get(k).and_then(|m| m.get(val)) {
                classes.push(cls.clone());
            }
        }
    }
    for compound in ctx.compounds {
        if compound_matches(&compound.predicates, row) {
            classes.push(compound.class_name.clone());
        }
    }
    classes.join(" ")
}

fn compound_matches(
    predicates: &IndexMap<String, Vec<String>>,
    props: &IndexMap<String, String>,
) -> bool {
    predicates.iter().all(|(key, allowed)| {
        props
            .get(key)
            .is_some_and(|val| allowed.iter().any(|a| a == val))
    })
}

fn cartesian(
    variants: &IndexMap<String, IndexMap<String, String>>,
) -> Vec<IndexMap<String, String>> {
    let mut acc = vec![IndexMap::new()];
    for (key, values) in variants {
        acc = expand_axis(acc, key, values);
    }
    acc.into_iter().filter(|row| !row.is_empty()).collect()
}

fn expand_axis(
    prefixes: Vec<IndexMap<String, String>>,
    key: &str,
    values: &IndexMap<String, String>,
) -> Vec<IndexMap<String, String>> {
    let mut next = Vec::new();
    for prefix in prefixes {
        for value in values.keys() {
            let mut row = prefix.clone();
            row.insert(key.to_string(), value.clone());
            next.push(row);
        }
    }
    next
}
