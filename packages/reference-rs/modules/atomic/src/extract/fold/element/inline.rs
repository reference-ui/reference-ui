//! Inline element access: `['red', 'blue'][0]` and `({ a: 'red' })['a']` read the literal's own
//! slots, with no binding involved. Array slots flatten through the shared slot model, a hole reads
//! as omitted, and each slot element lowers to its literal or to the leaves of a scoped name.
//! Object literals answer from their own entries. Takes an inline object or array expression and a
//! key; emits leaves or refusals into the element fold.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, Expression};

use super::super::array::flatten_value_slots;
use super::super::key::fold_property_key;
use super::{ElementFold, ElementRefusal};
use crate::atom::AtomValue;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// Look one key up in an inline object or array literal, or false.
pub(super) fn lookup_inline_base(
    object: &Expression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> bool {
    match object {
        Expression::ObjectExpression(obj) => {
            // ({ a: 'red' })['a']
            lookup_inline_entry(obj, key, scoped, fold);
            true
        }
        Expression::ArrayExpression(arr) => {
            // ['red', 'blue'][0]
            lookup_inline_slot(arr, key, scoped, fold);
            true
        }
        _ => false,
    }
}

/// Look one key up in an inline object's literal entries.
fn lookup_inline_entry(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) {
    use oxc_ast::ast::ObjectPropertyKind;
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        if fold_property_key(&prop.key, scoped).as_deref() != Some(key) {
            continue;
        }
        if let Some(leaf) = inline_leaf(&prop.value) {
            fold.values.push(leaf);
        } else {
            fold.refusals.push(ElementRefusal::NonScalar {
                key: key.to_string(),
            });
        }
        return;
    }
    fold.refusals.push(ElementRefusal::Missing {
        key: key.to_string(),
    });
}

/// Look one key up in an inline array's flattened slots.
fn lookup_inline_slot(
    arr: &ArrayExpression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) {
    let Some(slots) = flatten_value_slots(&arr.elements, scoped) else {
        fold.refusals.push(ElementRefusal::DynamicBase(arr.span));
        return;
    };
    let Some(pos) = array_position(key) else {
        fold.refusals.push(ElementRefusal::Missing {
            key: key.to_string(),
        });
        return;
    };
    match slots.get(pos) {
        Some(super::super::array::ValueSlot::Leaf(leaf)) => fold.values.push(leaf.clone()),
        Some(super::super::array::ValueSlot::Hole) => {
            fold.omitted = true;
        }
        Some(super::super::array::ValueSlot::Walk(elem)) => {
            lookup_slot_element(elem, key, scoped, fold)
        }
        None => {
            fold.refusals.push(ElementRefusal::Missing {
                key: key.to_string(),
            });
        }
    }
}

/// Lower one inline slot element to its leaves: literals, const names, holes.
fn lookup_slot_element(
    elem: &ArrayExpressionElement<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) {
    if matches!(elem, ArrayExpressionElement::Elision(_)) {
        fold.omitted = true;
        return;
    }
    let Some(expr) = elem.as_expression() else {
        return;
    };
    match slot_leaf(expr, scoped, fold) {
        Some(leaves) => fold.values.extend(leaves),
        None => fold.refusals.push(ElementRefusal::NonScalar {
            key: key.to_string(),
        }),
    }
}

/// The leaves of one inline slot expression, or None when not static.
fn slot_leaf(
    expr: &Expression<'_>,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> Option<Vec<AtomValue>> {
    if let Some(leaf) = inline_leaf(expr) {
        return Some(vec![leaf]);
    }
    match expr {
        // ([w])[0]  after  const w = 'red'
        Expression::Identifier(ident) => identifier_slot_leaves(ident.name.as_str(), scoped),
        Expression::StaticMemberExpression(mem) => member_slot_leaves(mem, scoped, fold),
        _ => None,
    }
}

/// The scalar leaves a bound identifier holds, or None when it holds none.
fn identifier_slot_leaves(name: &str, scoped: Scoped<'_>) -> Option<Vec<AtomValue>> {
    let leaves = scoped.scalar_leaves(name);
    if leaves.is_empty() {
        None
    } else {
        Some(leaves.to_vec())
    }
}

/// The leaves of a bound object's member, recording its residue flag when it has leaves.
fn member_slot_leaves(
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> Option<Vec<AtomValue>> {
    let Expression::Identifier(obj) = &mem.object else {
        return None;
    };
    let (base, prop) = (obj.name.as_str(), mem.property.name.as_str());
    let leaves = scoped.object_prop_leaves(base, prop);
    if leaves.is_empty() {
        return None;
    }
    fold.residue |= scoped.object_prop_residue(base, prop);
    Some(leaves.to_vec())
}

/// One literal leaf of an inline entry, through transparent wrappers.
fn inline_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        return inline_leaf(inner);
    }
    match expr {
        Expression::StringLiteral(lit) => Some(AtomValue::String(lit.value.as_str().into())),
        Expression::NumericLiteral(lit) => {
            Some(AtomValue::Number(lit.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(lit) => Some(AtomValue::Bool(lit.value)),
        _ => None,
    }
}

/// An array position for a key: canonical indices only (`1`, never `01`).
pub(super) fn array_position(key: &str) -> Option<usize> {
    let pos: usize = key.parse().ok()?;
    if pos.to_string() != key {
        return None;
    }
    Some(pos)
}
