//! Responsive expansion for array and per-prop object values.
//!
//! Arrays map indices onto the breakpoint scale (`base`, `sm`, …) while
//! per-prop objects (`width: { base, md }`) ride their keys on `when` and
//! leave base-skipping plus unknown-key refusal to `resolve/conditions`.
//! Both forms recurse through `walk_expression`, so ternaries, constants,
//! and null holes behave exactly as they do on scalar props.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, ObjectExpression, ObjectPropertyKind};
use smallvec::SmallVec;

use super::object::resolve_property_key;
use super::walk::{walk_expression, ExpressionWalk};

/// Expand a responsive array onto breakpoint `when` scopes.
pub fn walk_array(
    ctx: &mut ExpressionWalk<'_>,
    arr: &ArrayExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // mt={['1r', '2r', null, '4r']}
    for (idx, elem) in arr.elements.iter().enumerate() {
        let Some(breakpoint) = ctx.breakpoint_for_index(idx) else {
            continue;
        };
        let mut item_when = when.clone();
        item_when.push(Box::from(breakpoint));
        match elem {
            ArrayExpressionElement::Elision(_) => {
                // mt={['1r', , '4r']}
            }
            _ => {
                if let Some(expr) = elem.as_expression() {
                    walk_expression(ctx, expr, &item_when);
                }
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
                "Dynamic object spread encountered in responsive object; keeping sibling entries",
            );
            continue;
        };
        let Some(key) = resolve_property_key(&prop.key) else {
            ctx.warn("Dynamic computed property key encountered in style object");
            continue;
        };
        let mut entry_when = when.clone();
        entry_when.push(key.into());
        walk_expression(ctx, &prop.value, &entry_when);
    }
}
