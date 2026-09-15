//! Variant lookup table for runtime `recipe()`.
//! Builds the cartesian of declared variant axes plus matching compounds.
//! Each combination maps to a space-joined class string so the helper never
//! re-evaluates style objects.

use indexmap::IndexMap;

use super::RecipeMatch;
use super::RecipeTable;

/// Assemble the JSON table from already-named variant and compound classes.
pub fn build(
    name: &str,
    class_name: &str,
    variants: &IndexMap<String, IndexMap<String, String>>,
    compounds: &[RecipeMatch],
) -> RecipeTable {
    let mut combinations = vec![base_match(class_name)];
    for props in cartesian(variants) {
        combinations.push(combination(class_name, &props, variants, compounds));
    }
    RecipeTable {
        name: name.to_string(),
        class_name: class_name.to_string(),
        variants: variants.clone(),
        compound_variants: compounds.to_vec(),
        combinations,
    }
}

fn base_match(class_name: &str) -> RecipeMatch {
    RecipeMatch {
        props: IndexMap::new(),
        class_name: class_name.to_string(),
    }
}

fn combination(
    stem: &str,
    props: &IndexMap<String, String>,
    variants: &IndexMap<String, IndexMap<String, String>>,
    compounds: &[RecipeMatch],
) -> RecipeMatch {
    let mut classes = vec![stem.to_string()];
    append_variant_classes(&mut classes, props, variants);
    append_compound_classes(&mut classes, props, compounds);
    RecipeMatch {
        props: props.clone(),
        class_name: classes.join(" "),
    }
}

fn append_variant_classes(
    classes: &mut Vec<String>,
    props: &IndexMap<String, String>,
    variants: &IndexMap<String, IndexMap<String, String>>,
) {
    for (key, value) in props {
        if let Some(class) = variants.get(key).and_then(|map| map.get(value)) {
            classes.push(class.clone());
        }
    }
}

fn append_compound_classes(
    classes: &mut Vec<String>,
    props: &IndexMap<String, String>,
    compounds: &[RecipeMatch],
) {
    for compound in compounds {
        if compound_matches(&compound.props, props) {
            classes.push(compound.class_name.clone());
        }
    }
}

fn compound_matches(needed: &IndexMap<String, String>, props: &IndexMap<String, String>) -> bool {
    needed
        .iter()
        .all(|(key, value)| props.get(key) == Some(value))
}

fn cartesian(variants: &IndexMap<String, IndexMap<String, String>>) -> Vec<IndexMap<String, String>> {
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
    use crate::recipes::name;

    #[test]
    fn one_axis_includes_base_and_compound() {
        let mut solid = IndexMap::new();
        solid.insert("solid".into(), name::variant_class("button", "variant", "solid"));
        solid.insert(
            "outline".into(),
            name::variant_class("button", "variant", "outline"),
        );
        let mut variants = IndexMap::new();
        variants.insert("variant".into(), solid);

        let mut compound_props = IndexMap::new();
        compound_props.insert("variant".into(), "solid".into());
        let compounds = vec![RecipeMatch {
            props: compound_props,
            class_name: "button--compound-variant_solid".into(),
        }];

        let table = build("button", "button", &variants, &compounds);
        assert_eq!(table.combinations.len(), 3);
        assert_eq!(table.combinations[0].class_name, "button");
        assert_eq!(
            table.combinations[1].class_name,
            "button button--variant_solid button--compound-variant_solid"
        );
        assert_eq!(
            table.combinations[2].class_name,
            "button button--variant_outline"
        );
    }
}
