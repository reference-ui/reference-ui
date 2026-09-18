//! Responsive expansion for array and per-prop object values.
//!
//! Arrays map indices onto the breakpoint scale (`base`, `sm`, …) while
//! per-prop objects (`width: { base, md }`) ride their keys on `when` and
//! leave base-skipping plus unknown-key refusal to `resolve/conditions`.
//! Both forms recurse through `walk_expression`, so ternaries, constants,
//! and null holes behave exactly as they do on scalar props.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, ObjectExpression, ObjectPropertyKind, SpreadElement,
};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::object::resolve_property_key;
use super::walk::{walk_expression, ExpressionWalk};
use crate::diagnostics::DiagnosticCode;

/// Expand a responsive array onto breakpoint `when` scopes.
///
/// A spread anywhere in the array refuses the whole array: the spread's
/// length is unknown, so any later sibling would land on the wrong
/// breakpoint. Ph3 flattens literal / const-array spreads (SPEC-V2-63).
pub fn walk_array(
    ctx: &mut ExpressionWalk<'_>,
    arr: &ArrayExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // mt={['1r', '2r', null, '4r']}
    if let Some(spread) = first_array_spread(arr) {
        // mt={['1r', ...dyn, '4r']} — refuse all, keep arity honest.
        let prop = ctx.prop;
        ctx.warn(
            spread.span,
            DiagnosticCode::ResponsiveArraySpread,
            format!(
                "Spread in responsive array for prop '{prop}'; refusing the array to keep breakpoint arity honest"
            ),
        );
        return;
    }
    for (idx, elem) in arr.elements.iter().enumerate() {
        let Some(breakpoint) = ctx.breakpoint_for_index(idx) else {
            continue;
        };
        let mut item_when = when.clone();
        item_when.push(Box::from(breakpoint));
        walk_array_element(ctx, elem, &item_when);
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

/// The first spread element in a value array, if any.
fn first_array_spread<'a>(arr: &'a ArrayExpression<'a>) -> Option<&'a SpreadElement<'a>> {
    arr.elements.iter().find_map(|elem| match elem {
        ArrayExpressionElement::SpreadElement(spread) => Some(spread.as_ref()),
        _ => None,
    })
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
        let Some(key) = resolve_property_key(&prop.key) else {
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::UnfoldableKey,
                "Dynamic computed property key encountered in style object",
            );
            continue;
        };
        let mut entry_when = when.clone();
        entry_when.push(key.into());
        walk_expression(ctx, &prop.value, &entry_when);
    }
}
