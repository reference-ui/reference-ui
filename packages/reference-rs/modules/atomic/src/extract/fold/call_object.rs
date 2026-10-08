//! Compound argument folding for pure-helper calls (SPEC-V2-39).
//!
//! Array and object arguments fold here with v2's general leniency: array
//! elements fold with unfoldable slots keeping arity as diagnosed nulls,
//! inline and const spreads splice in place, and object members keep their
//! static entries while dynamic ones skip with a diagnostic. Only an
//! all-unresolvable object refuses, verbatim v2's object rule.

use oxc_ast::ast::{ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKind};
use oxc_span::{GetSpan, Span};

use super::call_args::ArgFold;
use super::fence::FenceValue;
use super::fence_lower::{bake_capture, const_array_value, const_object_value};
use crate::atom::AtomValue;
use crate::extract::expressions::walk::{is_guard_expression, unwrap_wrapper_target};

/// Fold an array argument: elements fold, holes are null slots, inline
/// and const spreads splice in place, and an unfoldable element keeps
/// arity honest as a diagnosed null slot, verbatim v2's array rule.
pub(crate) fn fold_array_arg(
    fold: &mut ArgFold,
    arr: &oxc_ast::ast::ArrayExpression<'_>,
) -> Option<FenceValue> {
    let mut out = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        fold_array_elem(fold, elem, &mut out)?;
    }
    Some(FenceValue::Array(out))
}

/// Fold one array element: a hole, a spliced spread, or a plain value.
fn fold_array_elem(
    fold: &mut ArgFold,
    elem: &ArrayExpressionElement<'_>,
    out: &mut Vec<FenceValue>,
) -> Option<()> {
    match elem {
        ArrayExpressionElement::Elision(_) => {
            out.push(null_slot());
            Some(())
        }
        ArrayExpressionElement::SpreadElement(spread) => {
            out.extend(fold_array_spread(fold, &spread.argument)?);
            Some(())
        }
        _ => fold_plain_elem(fold, elem.as_expression()?, out),
    }
}

/// Fold one plain element, keeping arity as a diagnosed null when it fails.
fn fold_plain_elem(
    fold: &mut ArgFold,
    expr: &Expression<'_>,
    out: &mut Vec<FenceValue>,
) -> Option<()> {
    match fold.fold_arg(expr) {
        Some(value) => out.push(value),
        None => {
            fold.refuse(expr.span(), "array element");
            out.push(null_slot());
        }
    }
    Some(())
}

/// A null slot standing in for a hole or an unfoldable element.
fn null_slot() -> FenceValue {
    FenceValue::Leaves(vec![AtomValue::Null])
}

/// Splice one array-argument spread: inline arrays recurse, const arrays
/// convert whole, and anything else refuses the whole argument.
pub(crate) fn fold_array_spread(
    fold: &mut ArgFold,
    arg: &Expression<'_>,
) -> Option<Vec<FenceValue>> {
    let mut arg = arg;
    while let Some(inner) = unwrap_wrapper_target(arg) {
        arg = inner;
    }
    if let Expression::ArrayExpression(arr) = arg {
        let FenceValue::Array(items) = fold_array_arg(fold, arr)? else {
            return None;
        };
        return Some(items);
    }
    if let Expression::Identifier(ident) = arg {
        let elements = fold.scoped().array(ident.name.as_str())?;
        let FenceValue::Array(items) = const_array_value(elements) else {
            return None;
        };
        return Some(items);
    }
    None
}

/// Fold an object argument leniently per member: static members stay,
/// dynamic members and spreads skip with a diagnostic, and only an
/// all-unresolvable object refuses, verbatim v2's object rule.
pub(crate) fn fold_object_arg(
    fold: &mut ArgFold,
    obj: &oxc_ast::ast::ObjectExpression<'_>,
) -> Option<FenceValue> {
    let mut entries = Vec::with_capacity(obj.properties.len());
    let mut kept = false;
    let mut refused = false;
    for prop_kind in &obj.properties {
        let outcome = fold_object_prop(fold, prop_kind, &mut entries);
        apply_outcome(outcome, &mut kept, &mut refused);
    }
    if kept || !refused {
        return Some(FenceValue::Object(entries));
    }
    None
}

/// Fold one outcome into the kept/refused tally.
fn apply_outcome(outcome: PropOutcome, kept: &mut bool, refused: &mut bool) {
    match outcome {
        PropOutcome::Kept => *kept = true,
        PropOutcome::Dropped => *refused = true,
        PropOutcome::Skipped => {}
    }
}

/// What one object property contributed: an entry, a refusal, or neither.
enum PropOutcome {
    Kept,
    Skipped,
    Dropped,
}

/// Fold one object property, spread or member, to its outcome.
fn fold_object_prop(
    fold: &mut ArgFold,
    prop_kind: &ObjectPropertyKind<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> PropOutcome {
    match prop_kind {
        ObjectPropertyKind::SpreadProperty(spread) => {
            fold_spread_prop(fold, &spread.argument, entries)
        }
        ObjectPropertyKind::ObjectProperty(prop) => {
            if fold_object_member(fold, prop, entries) {
                PropOutcome::Kept
            } else {
                PropOutcome::Dropped
            }
        }
    }
}

/// Fold one spread property, tracking whether it grew the entries.
fn fold_spread_prop(
    fold: &mut ArgFold,
    arg: &Expression<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> PropOutcome {
    let before = entries.len();
    if !fold_object_spread(fold, arg, entries) {
        return PropOutcome::Dropped;
    }
    if entries.len() > before {
        PropOutcome::Kept
    } else {
        PropOutcome::Skipped
    }
}

/// Fold one object-argument member; shorthand resolves through captures.
pub(crate) fn fold_object_member(
    fold: &mut ArgFold,
    prop: &oxc_ast::ast::ObjectProperty<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> bool {
    if prop.method || prop.kind != PropertyKind::Init {
        fold.refuse(prop.span, "object member");
        return false;
    }
    let Some(key) = fold_member_key(fold, prop) else {
        fold.refuse(prop.key.span(), "computed key");
        return false;
    };
    let value = if prop.shorthand {
        bake_capture(key.as_ref(), fold.scoped())
    } else {
        fold.fold_arg(&prop.value)
    };
    let Some(value) = value else {
        fold.refuse(prop.value.span(), &format!("member '{key}'"));
        return false;
    };
    entries.push((key, value));
    true
}

/// Fold one member key: static spellings direct, computed keys folded.
pub(crate) fn fold_member_key(
    fold: &mut ArgFold,
    prop: &oxc_ast::ast::ObjectProperty<'_>,
) -> Option<Box<str>> {
    if !prop.computed {
        return static_member_key(&prop.key);
    }
    super::key::fold_property_key(&prop.key, fold.scoped()).map(Box::from)
}

/// Fold one static member-key spelling.
fn static_member_key(key: &oxc_ast::ast::PropertyKey<'_>) -> Option<Box<str>> {
    match key {
        oxc_ast::ast::PropertyKey::StaticIdentifier(id) => Some(id.name.as_str().into()),
        oxc_ast::ast::PropertyKey::StringLiteral(lit) => Some(lit.value.as_str().into()),
        oxc_ast::ast::PropertyKey::NumericLiteral(lit) => {
            Some(super::unary::canon_number(lit.value))
        }
        _ => None,
    }
}

/// Merge one object-argument spread: inline and const objects merge,
/// branching spreads union their inline arms, the rest skip diagnosed.
pub(crate) fn fold_object_spread(
    fold: &mut ArgFold,
    arg: &Expression<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> bool {
    let mut arg = arg;
    while let Some(inner) = unwrap_wrapper_target(arg) {
        arg = inner;
    }
    if let Some(inline) = fold_inline_spread(fold, arg, entries) {
        return inline;
    }
    if let Some(value) = fold_named_spread(fold, arg, entries) {
        return value;
    }
    fold.refuse(arg.span(), "spread member");
    false
}

/// Merge an inline-object spread, refusing when it will not fold.
fn fold_inline_spread(
    fold: &mut ArgFold,
    arg: &Expression<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> Option<bool> {
    let Expression::ObjectExpression(obj) = arg else {
        return None;
    };
    let Some(FenceValue::Object(spread)) = fold_object_arg(fold, obj) else {
        fold.refuse(arg.span(), "spread member");
        return Some(false);
    };
    entries.extend(spread);
    Some(true)
}

/// Merge a named or branching spread: const objects, ternaries, logicals.
fn fold_named_spread(
    fold: &mut ArgFold,
    arg: &Expression<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> Option<bool> {
    match arg {
        Expression::Identifier(ident) => Some(fold_const_spread(
            fold,
            ident.name.as_str(),
            arg.span(),
            entries,
        )),
        Expression::ConditionalExpression(cond) => Some(fold_branch_spread(
            fold,
            &cond.consequent,
            &cond.alternate,
            entries,
        )),
        Expression::LogicalExpression(logical) => Some(fold_branch_spread(
            fold,
            &logical.left,
            &logical.right,
            entries,
        )),
        _ => None,
    }
}

/// Merge a const-object spread, diagnosing entries with no static value.
pub(crate) fn fold_const_spread(
    fold: &mut ArgFold,
    name: &str,
    span: Span,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> bool {
    let Some(obj) = fold.scoped().object(name) else {
        fold.refuse(span, &format!("spread '{name}'"));
        return false;
    };
    for (key, prop) in obj.iter() {
        if prop.is_empty() {
            fold.refuse(span, &format!("member '{key}'"));
            continue;
        }
        if !prop.leaves.is_empty() {
            entries.push((
                Box::from(key.as_str()),
                FenceValue::Leaves(prop.leaves.clone()),
            ));
        } else {
            entries.push((Box::from(key.as_str()), const_object_value(&prop.nested)));
        }
    }
    true
}

/// Union the inline-object sides of a branching spread, skipping the rest.
pub(crate) fn fold_branch_spread(
    fold: &mut ArgFold,
    first: &Expression<'_>,
    second: &Expression<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> bool {
    let mut kept = false;
    for side in [first, second] {
        kept = fold_spread_side(fold, side, entries) || kept;
    }
    kept
}

/// Fold one side of a branching spread: guards skip, inline and const
/// objects merge, and anything else skips with a diagnostic.
fn fold_spread_side(
    fold: &mut ArgFold,
    side: &Expression<'_>,
    entries: &mut Vec<(Box<str>, FenceValue)>,
) -> bool {
    let mut side_arg = side;
    while let Some(inner) = unwrap_wrapper_target(side_arg) {
        side_arg = inner;
    }
    if is_guard_expression(side_arg) {
        return false;
    }
    if let Expression::ObjectExpression(obj) = side_arg {
        if let Some(FenceValue::Object(spread)) = fold_object_arg(fold, obj) {
            entries.extend(spread);
            return true;
        }
    }
    if let Expression::Identifier(ident) = side_arg {
        return fold_const_spread(fold, ident.name.as_str(), side_arg.span(), entries);
    }
    fold.refuse(side_arg.span(), "spread member");
    false
}
