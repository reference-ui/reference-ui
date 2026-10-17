//! Source resolution for array destructuring: the positional slots of an inline array literal or of
//! a recorded const array. An inline element keeps its literal leaf and provenance, a spread
//! splices the recorded leaves of an identifier source, and anything unresolvable turns dynamic and
//! blinds the tail. A bound identifier resolves to its recorded array with root provenance, so rest
//! and default deps can trace back to it. Takes a pattern context and an optional init expression;
//! emits an `ArraySource`, or None when the init names no array.

use std::collections::BTreeMap;

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, Expression, IdentifierReference};

use super::super::super::binding::BindingInit;
use super::super::super::value::{self, KeyProvenance};
use super::super::{slot_value, PatternCtx};
use super::{ArraySlot, ArraySource};
use crate::extract::constants::ConstArrayElement;

/// Resolve an array pattern's source: an inline array or a bound array.
pub(super) fn resolve_array_source(
    ctx: &PatternCtx<'_, '_>,
    init: Option<&Expression<'_>>,
) -> Option<ArraySource> {
    let init = value::peel(init?);
    if let Expression::ArrayExpression(arr) = init {
        // const [a, b] = ['red', 'blue']
        return Some(inline_array_source(ctx, arr));
    }
    if let Expression::Identifier(id) = init {
        // const [small, medium] = sizes
        return bound_array_source(ctx, id);
    }
    None
}

/// The recorded array a bound identifier names, carrying the identifier as its root.
fn bound_array_source(
    ctx: &PatternCtx<'_, '_>,
    id: &IdentifierReference<'_>,
) -> Option<ArraySource> {
    let (src_scope, binding) = ctx.table.resolve_from(id.name.as_str(), ctx.scope)?;
    let Some(BindingInit::Array(elements)) = &binding.init else {
        return None;
    };
    Some(ArraySource {
        elements: elements.iter().map(recorded_slot).collect(),
        provenances: BTreeMap::new(),
        root: Some((src_scope, id.name.to_string())),
    })
}

/// One recorded element as a positional slot. An object element holds its runtime value, never a
/// leaf.
fn recorded_slot(element: &ConstArrayElement) -> ArraySlot {
    match element {
        ConstArrayElement::Leaf(leaf) => ArraySlot::Leaf(leaf.clone()),
        ConstArrayElement::Hole => ArraySlot::Hole,
        ConstArrayElement::Object(_) => ArraySlot::Dynamic,
    }
}

/// Slots being resolved from an inline array, until a blind spread ends them.
#[derive(Default)]
struct InlineSlots {
    elements: Vec<ArraySlot>,
    provenances: BTreeMap<usize, KeyProvenance>,
    blind: bool,
}

/// Positional slots of an inline array; a blind spread ends resolution.
fn inline_array_source(ctx: &PatternCtx<'_, '_>, arr: &ArrayExpression<'_>) -> ArraySource {
    let mut slots = InlineSlots::default();
    for elem in &arr.elements {
        if slots.blind {
            slots.elements.push(ArraySlot::Dynamic);
            continue;
        }
        inline_array_element(ctx, elem, &mut slots);
    }
    ArraySource {
        elements: slots.elements,
        provenances: slots.provenances,
        root: None,
    }
}

/// Push one inline slot; an unresolvable spread blinds the tail.
fn inline_array_element(
    ctx: &PatternCtx<'_, '_>,
    elem: &ArrayExpressionElement<'_>,
    slots: &mut InlineSlots,
) {
    if matches!(elem, ArrayExpressionElement::Elision(_)) {
        slots.elements.push(ArraySlot::Hole);
        return;
    }
    if let ArrayExpressionElement::SpreadElement(spread) = elem {
        if !splice_spread(ctx, &spread.argument, slots) {
            // [...unknown] shifts every later index unknowably — tail is dark.
            slots.elements.push(ArraySlot::Dynamic);
            slots.blind = true;
        }
        return;
    }
    let Some(expr) = elem.as_expression() else {
        slots.elements.push(ArraySlot::Dynamic);
        return;
    };
    let index = slots.elements.len();
    let Some((leaf, prov, false)) = slot_value(ctx, value::peel(expr)) else {
        // Unresolvable — or partially static ([isSelected] holds its runtime
        // value on the dynamic arm) — so the slot stays dark.
        slots.elements.push(ArraySlot::Dynamic);
        return;
    };
    if let Some(prov) = prov {
        slots.provenances.insert(index, prov);
    }
    slots.elements.push(ArraySlot::Leaf(leaf));
}

/// Splice a recorded array's leaves, or false when the spread is unresolvable.
fn splice_spread(
    ctx: &PatternCtx<'_, '_>,
    argument: &Expression<'_>,
    slots: &mut InlineSlots,
) -> bool {
    let Expression::Identifier(id) = value::peel(argument) else {
        return false;
    };
    let Some((src_scope, binding)) = ctx.table.resolve_from(id.name.as_str(), ctx.scope) else {
        return false;
    };
    let Some(BindingInit::Array(recorded)) = &binding.init else {
        return false;
    };
    for element in recorded {
        let index = slots.elements.len();
        slots.elements.push(recorded_slot(element));
        slots.provenances.insert(
            index,
            KeyProvenance {
                key: index.to_string(),
                src_scope,
                src_name: id.name.to_string(),
                src_key: None,
            },
        );
    }
    true
}
