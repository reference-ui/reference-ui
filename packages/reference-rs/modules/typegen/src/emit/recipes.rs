//! Recipe `.d.ts` aliases from `RecipeDefinition` tables.
//! `PascalCase(name)VariantProps` has every axis optional and lexicographic
//! value unions. When the dump lists at least one valid compound row, a matching
//! `PascalCase(name)CompoundVariant` repeats those axis unions plus a `css`
//! declaration map. Compound `when` keys that name an unknown axis or value
//! are skipped so they cannot introduce `'nope'` literals. Names that cannot
//! PascalCase to a TypeScript identifier are skipped.

use super::ts::{is_ts_ident, join_union, push_prop_name, to_pascal_case};
use base_system::{BaseSystem, CompoundVariant, RecipeDefinition};
use std::collections::BTreeSet;

const CSS_MAP: &str = "css: { [property: string]: string }";

pub(super) fn recipe_types(system: &BaseSystem) -> String {
    let mut out = String::new();
    for (name, recipe) in system.list_recipes() {
        let Some(stem) = recipe_type_stem(name) else {
            continue;
        };
        let Some(variant_body) = variant_props_body(recipe) else {
            continue;
        };
        push_type_alias(&mut out, &format!("{stem}VariantProps"), &variant_body);
        if let Some(compound_body) = compound_variant_body(recipe) {
            push_type_alias(
                &mut out,
                &format!("{stem}CompoundVariant"),
                &compound_body,
            );
        }
    }
    out
}

fn recipe_type_stem(name: &str) -> Option<String> {
    let pascal = to_pascal_case(name);
    if !is_ts_ident(&pascal) {
        return None;
    }
    Some(pascal)
}

fn push_type_alias(out: &mut String, name: &str, body: &str) {
    if !out.is_empty() {
        out.push('\n');
    }
    out.push_str("export type ");
    out.push_str(name);
    out.push_str(" = ");
    out.push_str(body);
    out.push_str(";\n");
}

fn variant_props_body(recipe: &RecipeDefinition) -> Option<String> {
    let fields = variant_fields(recipe)?;
    Some(format!("{{ {} }}", fields.join("; ")))
}

fn compound_variant_body(recipe: &RecipeDefinition) -> Option<String> {
    if !has_valid_compound_row(recipe) {
        return None;
    }
    let mut fields = variant_fields(recipe)?;
    fields.push(String::from(CSS_MAP));
    Some(format!("{{ {} }}", fields.join("; ")))
}

fn has_valid_compound_row(recipe: &RecipeDefinition) -> bool {
    recipe
        .compound_variants
        .iter()
        .any(|row| compound_row_is_valid(recipe, row))
}

fn compound_row_is_valid(recipe: &RecipeDefinition, row: &CompoundVariant) -> bool {
    row.when
        .iter()
        .all(|(axis, value)| match recipe.variants.get(axis) {
            Some(values) => values.contains_key(value),
            None => false,
        })
}

fn variant_fields(recipe: &RecipeDefinition) -> Option<Vec<String>> {
    let mut fields = Vec::new();
    for (axis, values) in &recipe.variants {
        if values.is_empty() {
            continue;
        }
        let lits: BTreeSet<String> = values.keys().cloned().collect();
        let mut field = String::new();
        push_prop_name(&mut field, axis);
        field.push_str("?: ");
        field.push_str(&join_union(&lits));
        fields.push(field);
    }
    if fields.is_empty() {
        None
    } else {
        Some(fields)
    }
}
