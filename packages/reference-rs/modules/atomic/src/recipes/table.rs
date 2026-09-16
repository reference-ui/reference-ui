//! Variant lookup table construction for runtime `recipe()`.
//! Computes the Cartesian product of declared variant axes and matches compound selectors.
//! Emits an authoritative combination map where each key addresses pre-composed class strings.
//! Multi-value compound predicates expand to discrete selection entries sharing class names.

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
}

/// Assemble the runtime recipe table from compiled variants and compounds.
pub fn build(input: &RecipeTableInput<'_>) -> RecipeRuntimeTable {
    let base = name::base_class(input.qualified_name);
    let variant_keys: Vec<String> = input.variant_map.keys().cloned().collect();
    let compound_variants = build_compound_variants(input.compounds);
    let combinations = build_combinations(&base, &variant_keys, input.variant_map, input.compounds);

    RecipeRuntimeTable {
        qualified_name: input.qualified_name.to_string(),
        class_name: input.class_name.to_string(),
        base,
        variant_keys,
        variant_map: input.variant_map.clone(),
        default_variants: input.default_variants.clone(),
        compound_variants,
        combinations,
    }
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

fn expand_predicates(
    predicates: &IndexMap<String, Vec<String>>,
) -> Vec<IndexMap<String, String>> {
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

fn format_combination_key(
    variant_keys: &[String],
    row: &IndexMap<String, String>,
) -> String {
    if variant_keys.len() == 1 {
        return row.values().next().cloned().unwrap_or_default();
    }
    variant_keys
        .iter()
        .filter_map(|k| row.get(k).map(String::as_str))
        .collect::<Vec<_>>()
        .join("|")
}

fn format_combination_classes(
    ctx: &CombinationCtx<'_>,
    row: &IndexMap<String, String>,
) -> String {
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

        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &defaults,
            compounds: &[],
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

        let input = RecipeTableInput {
            qualified_name: stem,
            class_name: "button",
            variant_map: &variant_map,
            default_variants: &IndexMap::new(),
            compounds: &[compound],
        };
        let table = build(&input);
        assert_eq!(table.compound_variants.len(), 2);
        assert_eq!(table.compound_variants[0].class_name, table.compound_variants[1].class_name);
        assert_eq!(table.compound_variants[0].selection.get("size"), Some(&"sm".to_string()));
        assert_eq!(table.compound_variants[1].selection.get("size"), Some(&"md".to_string()));
    }
}
