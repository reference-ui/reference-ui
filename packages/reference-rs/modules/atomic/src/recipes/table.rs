//! Variant lookup table construction for runtime `recipe()`.
//! Computes the Cartesian product of declared variant axes and matches compound selectors.
//! Builds the canonical in-memory maps (combinations plus per-breakpoint classes) while the
//! serialized table ships the derivation inputs only; the runtime re-derives both maps exactly.
//! Multi-value compound predicates expand to discrete selection entries sharing class names.

use base_system::BreakpointScale;
use indexmap::IndexMap;

use super::name;
use super::CompiledCompound;
use crate::runtime::{RecipeCompoundRecord, RecipeRuntimeTable};

/// Inputs required to assemble a RecipeRuntimeTable.
pub struct RecipeTableInput<'a> {
    pub qualified_name: &'a str,
    pub class_name: &'a str,
    pub variant_map: &'a IndexMap<String, IndexMap<String, String>>,
    pub default_variants: &'a IndexMap<String, String>,
    pub compounds: &'a [CompiledCompound],
    pub breakpoints: &'a BreakpointScale,
}

/// Assemble the runtime recipe table from compiled variants and compounds.
pub fn build(input: &RecipeTableInput<'_>) -> RecipeRuntimeTable {
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

/// Breakpoint names that emit `@container` rules, in scale order.
///
/// Shared by the runtime map and the rule emitter so every table class has a
/// matching wrapped rule. `base` and widthless names never qualify.
pub fn container_breakpoints(scale: &BreakpointScale) -> Vec<String> {
    scale
        .names()
        .iter()
        .filter(|bp| bp.as_str() != "base" && scale.width_px(bp).is_some())
        .cloned()
        .collect()
}

fn build_compound_variants(compounds: &[CompiledCompound]) -> Vec<RecipeCompoundRecord> {
    let mut out = Vec::new();
    for compound in compounds {
        let selections = expand_predicates(&compound.predicates);
        for selection in selections {
            out.push(RecipeCompoundRecord {
                selection,
                class_name: compound.class_name.clone(),
            });
        }
    }
    out
}

fn expand_predicates(predicates: &IndexMap<String, Vec<String>>) -> Vec<IndexMap<String, String>> {
    let mut acc = vec![IndexMap::new()];
    for (key, values) in predicates {
        let mut next = Vec::new();
        for prefix in acc {
            for val in values {
                let mut row = prefix.clone();
                row.insert(key.clone(), val.clone());
                next.push(row);
            }
        }
        acc = next;
    }
    acc
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
            .map_or(false, |val| allowed.iter().any(|a| a == val))
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn single_axis_combination_without_pipe() {
        let stem = "lib-test-system__button";
        let mut solid_map = IndexMap::new();
        solid_map.insert("solid".into(), format!("{stem}_v_solid"));
        solid_map.insert("outline".into(), format!("{stem}_v_outline"));
        let mut variant_map = IndexMap::new();
        variant_map.insert("variant".into(), solid_map);

        let mut defaults = IndexMap::new();
        defaults.insert("variant".into(), "solid".into());
        let scale = BreakpointScale::from_names(Vec::<String>::new());

        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &defaults,
            compounds: &[],
            breakpoints: &scale,
        };
        let table = build(&input);
        assert_eq!(table.variant_keys, vec!["variant"]);
        assert_eq!(table.combinations.len(), 2);
        assert_eq!(
            table.combinations.get("solid"),
            Some(&format!("{stem}__base {stem}_v_solid"))
        );
    }

    #[test]
    fn multi_value_compound_expands_to_shared_class_name() {
        let stem = "lib-test-system__button";
        let mut variant_map = IndexMap::new();
        let mut size_map = IndexMap::new();
        size_map.insert("sm".into(), format!("{stem}_s_sm"));
        size_map.insert("md".into(), format!("{stem}_s_md"));
        variant_map.insert("size".into(), size_map);

        let mut predicates = IndexMap::new();
        predicates.insert("size".into(), vec!["sm".into(), "md".into()]);
        let compound = CompiledCompound {
            predicates,
            class_name: format!("{stem}_c_sm_md"),
        };
        let scale = BreakpointScale::from_names(Vec::<String>::new());

        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &IndexMap::new(),
            compounds: &[compound],
            breakpoints: &scale,
        };
        let table = build(&input);
        assert_eq!(table.compound_variants.len(), 2);
        assert_eq!(
            table.compound_variants[0].class_name,
            table.compound_variants[1].class_name
        );
        assert_eq!(
            table.compound_variants[0].selection.get("size"),
            Some(&"sm".to_string())
        );
        assert_eq!(
            table.compound_variants[1].selection.get("size"),
            Some(&"md".to_string())
        );
    }

    #[test]
    fn responsive_map_covers_width_breakpoints_only() {
        let stem = "lib-test-system__button";
        let mut outline_map = IndexMap::new();
        outline_map.insert("solid".into(), format!("{stem}_v_solid"));
        outline_map.insert("outline".into(), format!("{stem}_v_outline"));
        let mut variant_map = IndexMap::new();
        variant_map.insert("variant".into(), outline_map);
        let scale = BreakpointScale::standard();

        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &IndexMap::new(),
            compounds: &[],
            breakpoints: &scale,
        };
        let table = build(&input);
        let axis = &table.responsive_variant_map["variant"];
        assert_eq!(axis.len(), 5);
        assert_eq!(
            axis["md"].get("outline").map(String::as_str),
            Some("md:lib-test-system__button_v_outline")
        );
        assert_eq!(
            axis["sm"].get("solid").map(String::as_str),
            Some("sm:lib-test-system__button_v_solid")
        );
        assert!(!axis.contains_key("base"));
    }

    #[test]
    fn responsive_map_skips_widthless_breakpoints() {
        let stem = "lib-test-system__button";
        let mut outline_map = IndexMap::new();
        outline_map.insert("solid".into(), format!("{stem}_v_solid"));
        let mut variant_map = IndexMap::new();
        variant_map.insert("variant".into(), outline_map);
        let scale = BreakpointScale::from_names(["wide"]);

        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &IndexMap::new(),
            compounds: &[],
            breakpoints: &scale,
        };
        let table = build(&input);
        assert!(table.responsive_variant_map["variant"].is_empty());
    }

    #[test]
    fn serialized_table_ships_breakpoint_names_not_derived_maps() {
        let stem = "lib-test-system__button";
        let mut outline_map = IndexMap::new();
        outline_map.insert("solid".into(), format!("{stem}_v_solid"));
        let mut variant_map = IndexMap::new();
        variant_map.insert("variant".into(), outline_map);
        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &IndexMap::new(),
            compounds: &[],
            breakpoints: &BreakpointScale::standard(),
        };
        let table = build(&input);
        assert_eq!(table.responsive_breakpoints, vec!["sm", "md", "lg", "xl", "2xl"]);
        let json = serde_json::to_value(&table).expect("table serializes");
        assert!(json.get("combinations").is_none());
        assert!(json.get("responsiveVariantMap").is_none());
        let bps = Some(&serde_json::json!(["sm", "md", "lg", "xl", "2xl"]));
        assert_eq!(json.get("responsiveBreakpoints"), bps);
    }
}
