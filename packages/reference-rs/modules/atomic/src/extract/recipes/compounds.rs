//! Compound variant rules of a recipe: each `compoundVariants` entry, its predicates, and its `css`.
//! Takes the walk and the `compoundVariants` value and appends one compound per inline entry to the
//! draft. The list and each entry must be written inline, since a const array records no predicate
//! values, and a `css` reads through the same style positions as a base or variant value. A predicate
//! reads a literal, a same-file const string, or a non-empty list of them (`source.rs`); one that reads
//! as none refuses its field, so a compound is never widened by a predicate it could not read.
//! A compound with no predicate or no style lowers nothing, as before.

use indexmap::IndexMap;
use oxc_ast::ast::{ArrayExpression, Expression, ObjectExpression, ObjectPropertyKind};
use oxc_span::GetSpan;

use super::source::predicate_values;
use super::walk::{inline_hint, static_key, unwrap_expression, RecipeWalk};
use crate::recipes::RecipeCompound;

pub(super) fn handle_recipe_compounds(walk: &mut RecipeWalk<'_, '_>, val: &Expression<'_>) {
    let Expression::ArrayExpression(arr) = unwrap_expression(val) else {
        let message = format!(
            "recipe '{}': 'compoundVariants' must be an inline array literal",
            walk.site.class_name
        );
        walk.refuse(
            val.span(),
            message,
            "write compoundVariants inline as an array literal".to_string(),
        );
        return;
    };
    walk_compound_variants(walk, arr);
}

fn walk_compound_variants(walk: &mut RecipeWalk<'_, '_>, arr: &ArrayExpression<'_>) {
    for (index, elem) in arr.elements.iter().enumerate() {
        let field = format!("compoundVariants[{index}]");
        let Some(Expression::ObjectExpression(item_obj)) =
            elem.as_expression().map(unwrap_expression)
        else {
            let message = format!(
                "recipe '{}': '{field}' must be an inline object literal",
                walk.site.class_name
            );
            walk.refuse(elem.span(), message, inline_hint(&field));
            continue;
        };
        if let Some(compound) = extract_compound(walk, &field, item_obj) {
            walk.draft.compounds.push(compound);
        }
    }
}

fn extract_compound(
    walk: &mut RecipeWalk<'_, '_>,
    field: &str,
    item_obj: &ObjectExpression<'_>,
) -> Option<RecipeCompound> {
    let mut predicates = IndexMap::new();
    let mut wants = Vec::new();
    for prop_kind in &item_obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            // A spread would hide predicates or css from the walk, so it refuses the entry.
            walk.refuse(
                prop_kind.span(),
                format!(
                    "recipe '{}': '{field}' spreads a value; write its predicates and css inline",
                    walk.site.class_name
                ),
                inline_hint(field),
            );
            continue;
        };
        let Some(key) = static_key(&prop.key) else {
            walk.refuse_computed(field, prop.key.span());
            continue;
        };
        if key == "css" {
            if let Some(css) = walk.style_at(&format!("{field}.css"), &prop.value) {
                wants.extend(css);
            }
            continue;
        }
        if let Some(values) = read_predicate(walk, field, &key, &prop.value) {
            predicates.insert(key, values);
        }
    }
    if wants.is_empty() || predicates.is_empty() {
        return None;
    }
    Some(RecipeCompound { predicates, wants })
}

/// The values of one predicate of the compound entry at `entry`, or `None` once it refused. A value
/// that reads as no scalar, and no non-empty list of scalars, refuses the predicate's own field.
pub(super) fn read_predicate(
    walk: &mut RecipeWalk<'_, '_>,
    entry: &str,
    key: &str,
    val: &Expression<'_>,
) -> Option<Vec<String>> {
    let values = predicate_values(walk.ctx, val);
    if values.is_none() {
        let field = format!("{entry}.{key}");
        let message = format!(
            "recipe '{}': '{field}' is not a string literal, a const string, or a non-empty list of them",
            walk.site.class_name
        );
        let help = format!(
            "write {field} as a string literal or a list of them, or name a const string declared in this file"
        );
        walk.refuse(val.span(), message, help);
    }
    values
}
