//! Spread flattening for value arrays, shared by the want walker and element access.
//!
//! `flatten_value_slots` splices literal and const-array spreads into the slot
//! list in place, so every surviving sibling keeps its breakpoint index and
//! wants stay arity-honest. A spread that is not a literal or a fully static
//! const array refuses the whole expansion (the caller warns), and object
//! elements refuse a value-array expansion because breakpoints take scalars.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, Expression};

use crate::atom::AtomValue;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// One flattened value-array slot: a walked element, a spliced leaf, or a hole.
pub enum ValueSlot<'e, 'a> {
    /// An authored element, walked at its slot (literals, ternaries, holes).
    Walk(&'e ArrayExpressionElement<'a>),
    /// A leaf spliced from a const-array spread, pushed at its slot.
    Leaf(AtomValue),
    /// A hole spliced from a const-array spread, consuming its slot silently.
    Hole,
}

/// Flatten an element list, splicing literal and const-array spreads in place.
///
/// Returns None when any spread is dynamic or carries object elements — the
/// caller refuses the whole array with a located diagnostic. Nesting recurses
/// structurally, so `...[1, ...[2]]` flattens and `...[1, ...dyn]` refuses.
pub fn flatten_value_slots<'e, 'a>(
    elements: &'e [ArrayExpressionElement<'a>],
    scoped: Scoped<'a>,
) -> Option<Vec<ValueSlot<'e, 'a>>> {
    let mut slots = Vec::with_capacity(elements.len());
    for elem in elements {
        if let ArrayExpressionElement::SpreadElement(spread) = elem {
            // padding: [1, ...[2, 3], 4]  /  padding: [1, ...sizes, 4]
            flatten_spread(&spread.argument, scoped, &mut slots)?;
        } else {
            slots.push(ValueSlot::Walk(elem));
        }
    }
    Some(slots)
}

/// True when one spread argument splices cleanly: an inline array whose
/// own spreads flatten, or a const array with no object elements.
pub fn spread_flattens(arg: &Expression<'_>, scoped: Scoped<'_>) -> bool {
    let mut slots = Vec::new();
    flatten_spread(arg, scoped, &mut slots).is_some()
}

/// One merge-list spread that flattens: borrowed inline elements, or a
/// const array's recorded elements. The caller lowers each element with its
/// own site: objects merge, literal leaves and holes skip silently.
pub enum MergeSpread<'x, 'a> {
    /// An inline array's elements, lowered one by one (nested spreads recurse).
    Inline(&'x [ArrayExpressionElement<'x>]),
    /// A const array's recorded elements.
    Const(&'a [ConstArrayElement]),
}

/// The base name of a spread argument through wrappers, for stale checks.
pub fn spread_base_name<'a>(arg: &'a Expression<'a>) -> Option<&'a str> {
    let mut arg = arg;
    while let Some(inner) = unwrap_wrapper_target(arg) {
        arg = inner;
    }
    if let Expression::Identifier(ident) = arg {
        return Some(ident.name.as_str());
    }
    None
}

/// Classify one merge-list spread argument, peeling transparent wrappers.
///
/// Returns None for dynamic spreads, which the caller refuses with the
/// merge position kept — siblings on either side still merge.
pub fn merge_spread<'x, 'a>(
    arg: &'x Expression<'x>,
    scoped: Scoped<'a>,
) -> Option<MergeSpread<'x, 'a>> {
    let mut arg = arg;
    while let Some(inner) = unwrap_wrapper_target(arg) {
        // ...([{...}])  /  ...(extras as const)
        arg = inner;
    }
    if let Expression::ArrayExpression(arr) = arg {
        return Some(MergeSpread::Inline(&arr.elements));
    }
    if let Expression::Identifier(ident) = arg {
        // css([{...}, ...extras])  after  const extras = [{...}]
        return scoped.array(ident.name.as_str()).map(MergeSpread::Const);
    }
    None
}

/// Splice one spread argument's slots, or None when it does not flatten.
fn flatten_spread<'e, 'a>(
    arg: &'e Expression<'a>,
    scoped: Scoped<'a>,
    slots: &mut Vec<ValueSlot<'e, 'a>>,
) -> Option<()> {
    if let Some(inner) = unwrap_wrapper_target(arg) {
        // ...([2, 3])  /  ...(sizes as const)
        return flatten_spread(inner, scoped, slots);
    }
    if let Expression::ArrayExpression(arr) = arg {
        return flatten_inline(arr, scoped, slots);
    }
    if let Expression::Identifier(ident) = arg {
        return flatten_const(ident.name.as_str(), scoped, slots);
    }
    None
}

/// Splice an inline array's elements, recursing through nested spreads.
fn flatten_inline<'e, 'a>(
    arr: &'e ArrayExpression<'a>,
    scoped: Scoped<'a>,
    slots: &mut Vec<ValueSlot<'e, 'a>>,
) -> Option<()> {
    let nested = flatten_value_slots(&arr.elements, scoped)?;
    slots.extend(nested);
    Some(())
}

/// Splice a const array's recorded elements; object elements refuse.
fn flatten_const(name: &str, scoped: Scoped<'_>, slots: &mut Vec<ValueSlot<'_, '_>>) -> Option<()> {
    let elements = scoped.array(name)?;
    for element in elements {
        match element {
            ConstArrayElement::Leaf(leaf) => slots.push(ValueSlot::Leaf(leaf.clone())),
            ConstArrayElement::Hole => slots.push(ValueSlot::Hole),
            // const mixed = [{...}]  — objects are not breakpoint slots
            ConstArrayElement::Object(_) => return None,
        }
    }
    Some(())
}
