//! Responsive expansion for array and per-prop object values.
//!
//! Arrays map indices onto the breakpoint scale (`base`, `sm`, …) while
//! per-prop objects (`width: { base, md }`) ride their keys on `when` and
//! leave base-skipping plus unknown-key refusal to `resolve/conditions`.
//! Both forms recurse through `walk_expression`, so ternaries, constants,
//! and null holes behave exactly as they do on scalar props.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, ObjectExpression, ObjectPropertyKind};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::object::resolve_property_key;
use super::walk::{walk_expression, ExpressionWalk};
use crate::diagnostics::DiagnosticCode;
use crate::extract::fold::{flatten_value_slots, spread_base_name, spread_flattens, ValueSlot};

/// Expand a responsive array onto breakpoint `when` scopes.
///
/// Literal and const-array spreads flatten in place so every sibling keeps
/// its breakpoint index; any other spread refuses the whole array, since an
/// unknown spread length would shift later siblings to the wrong breakpoint.
pub fn walk_array(
    ctx: &mut ExpressionWalk<'_>,
    arr: &ArrayExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // mt={['1r', '2r', null, '4r']}  /  mt={['1r', ...['2r'], '4r']}
    let Some(slots) = flatten_value_slots(&arr.elements, ctx.scopes) else {
        // mt={['1r', ...dyn, '4r']} — refuse all, keep arity honest.
        refuse_array_spread(ctx, arr);
        return;
    };
    for (idx, slot) in slots.iter().enumerate() {
        let Some(breakpoint) = ctx.breakpoint_for_index(idx) else {
            continue;
        };
        let mut item_when = when.clone();
        item_when.push(Box::from(breakpoint));
        walk_slot(ctx, slot, &item_when);
    }
}

/// Refuse a value array carrying a dynamic spread, at the failing spread.
/// A reassigned const array names its write instead of the arity refusal.
fn refuse_array_spread(ctx: &mut ExpressionWalk<'_>, arr: &ArrayExpression<'_>) {
    let failing = arr.elements.iter().find_map(|elem| match elem {
        ArrayExpressionElement::SpreadElement(spread)
            if !spread_flattens(&spread.argument, ctx.scopes) =>
        {
            Some(spread.as_ref())
        }
        _ => None,
    });
    let Some(spread) = failing else {
        return;
    };
    if let Some(name) = spread_base_name(&spread.argument) {
        if let Some(write) = ctx.scopes.mutation(name) {
            let prop = ctx.prop;
            ctx.warn(
                spread.span,
                DiagnosticCode::MutatedBinding,
                format!(
                    "Dynamic mutated binding '{name}' spread in responsive array for prop '{prop}' (reassigned at {}; refusing the array to keep breakpoint arity honest)",
                    write.site()
                ),
            );
            return;
        }
    }
    let prop = ctx.prop;
    ctx.warn(
        spread.span,
        DiagnosticCode::ResponsiveArraySpread,
        format!(
            "Spread in responsive array for prop '{prop}'; refusing the array to keep breakpoint arity honest"
        ),
    );
}


/// Walk one flattened slot: elements walk, spliced leaves push, holes skip.
fn walk_slot(
    ctx: &mut ExpressionWalk<'_>,
    slot: &ValueSlot<'_, '_>,
    item_when: &SmallVec<[Box<str>; 2]>,
) {
    match slot {
        ValueSlot::Walk(elem) => walk_array_element(ctx, elem, item_when),
        ValueSlot::Leaf(leaf) => {
            ctx.push_want(leaf.clone(), item_when.clone(), false, None);
        }
        ValueSlot::Hole => {
            // const sizes = ['1r', , '4r']  — spliced holes consume the slot
        }
    }
}

/// Walk one responsive array slot: holes skip, expressions walk at the slot.
fn walk_array_element(
    ctx: &mut ExpressionWalk<'_>,
    elem: &ArrayExpressionElement<'_>,
    item_when: &SmallVec<[Box<str>; 2]>,
) {
    match elem {
        ArrayExpressionElement::Elision(_) => {
            // mt={['1r', , '4r']}
        }
        _ => {
            if let Some(expr) = elem.as_expression() {
                walk_expression(ctx, expr, item_when);
            }
        }
    }
}

/// Expand a per-prop responsive object onto `when` scopes keyed by entry.
pub fn walk_object(
    ctx: &mut ExpressionWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // width={{ base: '50px', md: '60px' }} — keys ride `when`, resolve lowers them
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            ctx.warn(
                prop_kind.span(),
                DiagnosticCode::UnfoldableSpread,
                "Dynamic object spread encountered in responsive object; keeping sibling entries",
            );
            continue;
        };
        let Some(key) = resolve_property_key(&prop.key, ctx.scopes) else {
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::UnfoldableKey,
                "Dynamic computed property key encountered in style object",
            );
            continue;
        };
        if let Some(path) = crate::extract::fold::key_entry_residue(&prop.key, ctx.scopes) {
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::PartialObjectProp,
                format!("property '{path}' drops a dynamic arm with no static style value"),
            );
        }
        let mut entry_when = when.clone();
        entry_when.push(key.into());
        walk_expression(ctx, &prop.value, &entry_when);
    }
}
