//! Slotted `recipe()` definitions: the `slots` list, its slot-keyed style maps, and per-slot lowering.
//! Takes a recipe object literal that carries `slots`, with its className, origin and call site, and
//! emits one plain `Recipe` per slot under the stem `{className}__{slot}`, walked from that slot's
//! entries in base, every variant value and every compound `css`. A malformed list, a slot map that is
//! not an inline object, or a slot-map key the list does not name refuses the whole definition with
//! `ATM-E-RECIPE-SLOT`. A slotted recipe also takes its `variants` maps and compound entries inline: a
//! named or spread map, or a compound that is not an inline object, refuses with `ATM-E-RECIPE-FIELD`,
//! as does a slot entry the walk cannot read.

use oxc_ast::ast::{
    ArrayExpressionElement, Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind,
};
use oxc_span::{GetSpan, Span};

use super::slot_check::SlotKeyCheck;
use super::walk::{static_key_is, unwrap_expression, walk_recipe_object, RecipeSite};
use super::{from_draft, located_error};
use crate::diagnostics::{DiagnosticCode, DiagnosticLocation};
use crate::extract::ExtractContext;
use crate::recipes::{name, Recipe, RecipeSlot};

/// One slotted definition awaiting validation and lowering.
pub(super) struct SlottedDefinition<'a, 'b> {
    pub(super) obj: &'a ObjectExpression<'b>,
    pub(super) slots_prop: &'a ObjectProperty<'b>,
    pub(super) class_name: &'a str,
    pub(super) origin: &'a str,
    pub(super) location: &'a DiagnosticLocation,
}

/// The `slots` property of a recipe object, if it has one.
pub(super) fn find_slots_prop<'a, 'b>(
    obj: &'a ObjectExpression<'b>,
) -> Option<&'a ObjectProperty<'b>> {
    for kind in &obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = kind {
            if static_key_is(&prop.key, "slots") {
                return Some(prop);
            }
        }
    }
    None
}

/// Validate one slotted definition, then lower one plain recipe per slot in list order.
/// `None` once any refusal is pushed: a definition with a refused field lowers nothing, and every
/// slot is walked so one definition reports each refusal it has.
pub(super) fn lower(
    def: &SlottedDefinition<'_, '_>,
    ctx: &mut ExtractContext<'_>,
) -> Option<Vec<Recipe>> {
    let slots = parse_slots(def, ctx)?;
    if !slot_keys_known(def, &slots, ctx) {
        return None;
    }
    let lowered: Vec<Option<Recipe>> = slots
        .iter()
        .map(|slot| lower_slot(def, slot, ctx))
        .collect();
    lowered.into_iter().collect()
}

/// One slot's recipe: the walk reads only this slot's entries. `None` when a field refused.
fn lower_slot(
    def: &SlottedDefinition<'_, '_>,
    slot: &str,
    ctx: &mut ExtractContext<'_>,
) -> Option<Recipe> {
    let site = RecipeSite {
        class_name: def.class_name,
        origin: def.origin,
        slot: Some(slot),
    };
    let draft = walk_recipe_object(def.obj, site, ctx)?;
    let identity = RecipeSlot {
        recipe: def.class_name.to_string(),
        name: slot.to_string(),
    };
    let stem = name::slot_class_name(def.class_name, slot);
    Some(from_draft(
        draft,
        stem,
        Some(identity),
        def.location.clone(),
    ))
}

/// Read the `slots` list: an inline, non-empty array of distinct string literals with no whitespace.
fn parse_slots(
    def: &SlottedDefinition<'_, '_>,
    ctx: &mut ExtractContext<'_>,
) -> Option<Vec<String>> {
    let value = unwrap_expression(&def.slots_prop.value);
    let Expression::ArrayExpression(list) = value else {
        let message = format!(
            "recipe '{}': 'slots' must be an inline array of string literals",
            def.class_name
        );
        push_refusal(ctx, &message, value.span());
        return None;
    };
    if list.elements.is_empty() {
        let message = format!(
            "recipe '{}': 'slots' must name at least one slot",
            def.class_name
        );
        push_refusal(ctx, &message, list.span);
        return None;
    }
    let mut slots: Vec<String> = Vec::with_capacity(list.elements.len());
    let mut clean = true;
    for element in &list.elements {
        if let Err(message) = take_slot(def.class_name, element, &mut slots) {
            push_refusal(ctx, &message, element.span());
            clean = false;
        }
    }
    clean.then_some(slots)
}

/// Append one listed slot, or return the refusal message for an element that is not one.
fn take_slot(
    class_name: &str,
    element: &ArrayExpressionElement<'_>,
    slots: &mut Vec<String>,
) -> Result<(), String> {
    let Some(slot) = slot_name(element) else {
        return Err(format!(
            "recipe '{}': each slot must be a non-empty string literal with no whitespace",
            class_name
        ));
    };
    if slots.contains(&slot) {
        return Err(format!(
            "recipe '{}' lists slot '{}' twice",
            class_name, slot
        ));
    }
    slots.push(slot);
    Ok(())
}

/// A slot name: a string literal, non-empty, with no whitespace (it joins a class list).
fn slot_name(element: &ArrayExpressionElement<'_>) -> Option<String> {
    let Expression::StringLiteral(lit) = unwrap_expression(element.as_expression()?) else {
        return None;
    };
    let text = lit.value.as_str();
    if text.is_empty() || text.chars().any(char::is_whitespace) {
        return None;
    }
    Some(text.to_string())
}

/// Push one `ATM-E-RECIPE-SLOT` refusal at a span.
pub(super) fn push_refusal(ctx: &mut ExtractContext<'_>, message: &str, span: Span) {
    let diagnostic = located_error(ctx, DiagnosticCode::RecipeSlot, message, span);
    ctx.diagnostics.push(diagnostic);
}

/// True when every slot map is an inline object naming only listed slots, and every variant map and
/// compound entry is written inline. Each refusal is raised where it stands, so one definition can
/// report several.
fn slot_keys_known(
    def: &SlottedDefinition<'_, '_>,
    slots: &[String],
    ctx: &mut ExtractContext<'_>,
) -> bool {
    let mut check = SlotKeyCheck {
        class_name: def.class_name,
        slots,
        ctx,
        clean: true,
    };
    for kind in &def.obj.properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = kind {
            check.field(prop);
        }
    }
    check.clean
}
