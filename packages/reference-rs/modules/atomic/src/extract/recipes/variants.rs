//! Variant matrices of a recipe: the `variants` map, each axis, and each axis's value map. A map
//! may be written inline or name a const object literal, and a spread inside a map contributes the
//! entries of a const object literal (`source.rs`); any other shape refuses the definition at its
//! field. Each value lowers to the wants of one style position, so a slotted recipe reads its own
//! slot's entry of every value. Takes the walk and the `variants` value and fills the draft's axes.

use indexmap::IndexMap;
use oxc_ast::ast::Expression;

use super::source::{map_entries, recorded_map, recorded_style, EntryValue, MapEntry};
use super::walk::RecipeWalk;
use crate::atom::Want;

/// Fill the draft's variant axes from the `variants` value, in source order.
pub(super) fn handle_recipe_variants(walk: &mut RecipeWalk<'_, '_>, val: &Expression<'_>) {
    let Some(axes) = map_entries(walk, "variants", val) else {
        return;
    };
    for axis in axes {
        let group = axis.name.clone();
        let field = format!("variants.{group}");
        if let Some(items) = axis_items(walk, &field, axis) {
            walk_variant_items(walk, &group, items);
        }
    }
}

/// The value entries of one axis: an inline value map, or the recorded map a const entry holds.
fn axis_items<'x, 'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    field: &str,
    axis: MapEntry<'x, 'b>,
) -> Option<Vec<MapEntry<'x, 'b>>> {
    match axis.value {
        EntryValue::Inline(val) => map_entries(walk, field, val),
        EntryValue::Recorded(_) if walk.site.slot.is_some() => {
            // SlotKeyCheck admits only inline maps in a slotted recipe, so this is never read.
            walk.refuse_unreadable(field, axis.span);
            None
        }
        EntryValue::Recorded(prop) => recorded_map(walk, field, prop, axis.span),
    }
}

/// Lower each value of one axis into its wants. A slot keeps only the axes it styles; a plain
/// recipe keeps every authored axis, even one with no values.
fn walk_variant_items(walk: &mut RecipeWalk<'_, '_>, group: &str, items: Vec<MapEntry<'_, '_>>) {
    let mut values: IndexMap<String, Vec<Want>> = IndexMap::new();
    for item in items {
        let field = format!("variants.{group}.{}", item.name);
        if let Some(wants) = value_wants(walk, &field, &item) {
            values.insert(item.name, wants);
        }
    }
    if walk.site.slot.is_none() || !values.is_empty() {
        walk.draft.variants.insert(group.to_string(), values);
    }
}

/// The wants of one variant value: an inline value through its style position (its slot's entry
/// when slotted), or a recorded entry read as a style object.
fn value_wants(
    walk: &mut RecipeWalk<'_, '_>,
    field: &str,
    item: &MapEntry<'_, '_>,
) -> Option<Vec<Want>> {
    match item.value {
        EntryValue::Inline(val) => walk.style_at(field, val),
        EntryValue::Recorded(_) if walk.site.slot.is_some() => {
            // SlotKeyCheck admits only inline slot maps, so a recorded value has no slot to read.
            walk.refuse_unreadable(field, item.span);
            None
        }
        EntryValue::Recorded(prop) => recorded_style(walk, field, prop, item.span),
    }
}
