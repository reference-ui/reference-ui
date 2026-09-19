//! Closed evaluation for the pure-helper fence (SPEC-V2-39).
//!
//! `eval_expr` applies lowered [`PureExpr`] IR to bound argument values with
//! v2's `pure_fn` eval semantics one for one: JS `+` keeps its string split,
//! arithmetic refuses division by zero and non-finite results, comparisons
//! follow strict, loose, and relational coercion, and member reads resolve
//! over folded objects and arrays. Anything without a single static outcome
//! — a multi-leaf coercion, a missed key, an out-of-range index — returns
//! `None`, and the call site refuses with today's call diagnostic. Whitespace
//! is never collapsed here: canonicalization belongs to SPEC-V2-14, which
//! will normalize fence results together with every other want.

use super::fence::{FenceKey, FenceLogical, FenceUnary, FenceValue, PureExpr};
use super::fence_arith::eval_binary_expr;
use super::fence_coerce::{
    coerce_to_number, coerce_to_string, is_string_like, leaf_number, leaf_string, property_key,
    single_leaf, truthy,
};
use crate::atom::AtomValue;

/// Apply closed IR to bound param values, or refuse without a static outcome.
pub(crate) fn eval_expr(expr: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    if let Some(value) = eval_scalar(expr, bound) {
        return Some(value);
    }
    if let Some(value) = eval_math(expr, bound) {
        return Some(value);
    }
    if let Some(value) = eval_branch(expr, bound) {
        return Some(value);
    }
    eval_shape(expr, bound)
}

/// Evaluate values, params, templates, and concatenation.
fn eval_scalar(expr: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    match expr {
        PureExpr::Value(value) => Some(value.clone()),
        PureExpr::Param(index) => bound.get(*index).cloned(),
        PureExpr::Template { quasis, parts } => eval_template(quasis, parts, bound),
        PureExpr::Concat(left, right) => eval_concat(left, right, bound),
        _ => None,
    }
}

/// Evaluate the binary and unary math operators.
fn eval_math(expr: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    match expr {
        PureExpr::Binary { op, left, right } => eval_binary_expr(*op, left, right, bound),
        PureExpr::Unary { op, arg } => eval_unary_expr(*op, arg, bound),
        _ => None,
    }
}

/// Evaluate the logical and conditional branching operators.
fn eval_branch(expr: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    match expr {
        PureExpr::Logical { op, left, right } => eval_logical_expr(*op, left, right, bound),
        PureExpr::Conditional {
            test,
            consequent,
            alternate,
        } => eval_conditional_expr(test, consequent, alternate, bound),
        _ => None,
    }
}

/// Evaluate objects, arrays, and member reads.
fn eval_shape(expr: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    match expr {
        PureExpr::Object(entries) => eval_object(entries, bound),
        PureExpr::Array(items) => eval_array(items, bound),
        PureExpr::Member { object, prop } => eval_member(object, prop, bound),
        PureExpr::Index { object, index } => eval_index(object, index, bound),
        _ => None,
    }
}

/// Join quasis with single-leaf parts; a multi-leaf part refuses the call.
fn eval_template(
    quasis: &[Box<str>],
    parts: &[PureExpr],
    bound: &[FenceValue],
) -> Option<FenceValue> {
    let mut out = String::new();
    for (index, quasi) in quasis.iter().enumerate() {
        out.push_str(quasi);
        if let Some(part) = parts.get(index) {
            out.push_str(&coerce_to_string(&single_leaf(&eval_expr(part, bound)?)?)?);
        }
    }
    Some(leaf_string(out))
}

/// JS `+`: any string side concatenates, otherwise both sides add numerically.
fn eval_concat(left: &PureExpr, right: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    let left_val = single_leaf(&eval_expr(left, bound)?)?;
    let right_val = single_leaf(&eval_expr(right, bound)?)?;
    if is_string_like(&left_val) || is_string_like(&right_val) {
        return concat_strings(&left_val, &right_val);
    }
    add_numbers(&left_val, &right_val)
}

/// Concatenate two string-coerced leaves.
fn concat_strings(left: &AtomValue, right: &AtomValue) -> Option<FenceValue> {
    let mut out = coerce_to_string(left)?;
    out.push_str(&coerce_to_string(right)?);
    Some(leaf_string(out))
}

/// Add two number-coerced leaves.
fn add_numbers(left: &AtomValue, right: &AtomValue) -> Option<FenceValue> {
    let sum = coerce_to_number(left)? + coerce_to_number(right)?;
    Some(leaf_number(sum))
}

/// Evaluate one unary operator: `+` coerces, `-` needs a number, `!` negates.
/// The asymmetric `-` (no string coercion) is v2's quirk, adopted verbatim.
fn eval_unary_expr(op: FenceUnary, arg: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    let value = eval_expr(arg, bound)?;
    match op {
        FenceUnary::Plus => {
            let number = coerce_to_number(&single_leaf(&value)?)?;
            Some(leaf_number(number))
        }
        FenceUnary::Minus => eval_negate(&value),
        FenceUnary::Not => Some(FenceValue::Leaves(vec![AtomValue::Bool(!truthy(&value))])),
    }
}

/// Negate a numeric leaf; anything else refuses without coercing.
fn eval_negate(value: &FenceValue) -> Option<FenceValue> {
    let AtomValue::Number(text) = single_leaf(value)? else {
        return None;
    };
    let negated = -text.parse::<f64>().ok()?;
    if !negated.is_finite() {
        return None;
    }
    Some(leaf_number(negated))
}

/// Evaluate one logical operator with v2 short-circuiting: a folded left
/// picks its side, and an unfoldable left yields to the right operand.
fn eval_logical_expr(
    op: FenceLogical,
    left: &PureExpr,
    right: &PureExpr,
    bound: &[FenceValue],
) -> Option<FenceValue> {
    let Some(left_val) = eval_expr(left, bound) else {
        return eval_expr(right, bound);
    };
    match op {
        FenceLogical::And => eval_and(&left_val, right, bound),
        FenceLogical::Or => eval_or(&left_val, right, bound),
        FenceLogical::Coalesce => eval_coalesce(&left_val, right, bound),
    }
}

/// Short-circuit `&&`: the right side when the left is truthy.
fn eval_and(
    left: &FenceValue,
    right: &PureExpr,
    bound: &[FenceValue],
) -> Option<FenceValue> {
    if truthy(left) {
        eval_expr(right, bound)
    } else {
        Some(left.clone())
    }
}

/// Short-circuit `||`: the left side when it is truthy.
fn eval_or(left: &FenceValue, right: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    if truthy(left) {
        Some(left.clone())
    } else {
        eval_expr(right, bound)
    }
}

/// Short-circuit `??`: the right side only when the left is null.
fn eval_coalesce(
    left: &FenceValue,
    right: &PureExpr,
    bound: &[FenceValue],
) -> Option<FenceValue> {
    if is_null(left) {
        eval_expr(right, bound)
    } else {
        Some(left.clone())
    }
}

/// Evaluate a ternary: a folded test picks its arm, an unfoldable test
/// unions both arms keeping whatever folds, verbatim v2's general rule.
/// Compound unions have no fence representation and refuse.
fn eval_conditional_expr(
    test: &PureExpr,
    consequent: &PureExpr,
    alternate: &PureExpr,
    bound: &[FenceValue],
) -> Option<FenceValue> {
    if let Some(test_val) = eval_expr(test, bound) {
        if truthy(&test_val) {
            return eval_expr(consequent, bound);
        }
        return eval_expr(alternate, bound);
    }
    union_arms(eval_expr(consequent, bound), eval_expr(alternate, bound))
}

/// Union two unfolded arms: both leaves concatenate, a lone folded arm
/// survives on its own, and compound unions refuse without a silent half.
fn union_arms(first: Option<FenceValue>, second: Option<FenceValue>) -> Option<FenceValue> {
    match (first, second) {
        (Some(FenceValue::Leaves(mut left)), Some(FenceValue::Leaves(right))) => {
            left.extend(right);
            Some(FenceValue::Leaves(left))
        }
        (Some(only), None) | (None, Some(only)) => Some(only),
        (None, None) => None,
        _ => None,
    }
}

/// Evaluate an object: folded keys upsert in order, values must all fold.
fn eval_object(entries: &[(FenceKey, PureExpr)], bound: &[FenceValue]) -> Option<FenceValue> {
    let mut out = Vec::with_capacity(entries.len());
    for (key, value) in entries {
        let name = match key {
            FenceKey::Static(name) => name.clone(),
            FenceKey::Computed(expr) => property_key(&eval_expr(expr, bound)?)?.into(),
        };
        let folded = eval_expr(value, bound)?;
        out.push((name, folded));
    }
    Some(FenceValue::Object(out))
}

/// Evaluate an array: elements must all fold, holes bake to null leaves.
fn eval_array(items: &[super::fence::FenceArrayElem], bound: &[FenceValue]) -> Option<FenceValue> {
    let mut out = Vec::with_capacity(items.len());
    for item in items {
        match item {
            super::fence::FenceArrayElem::Elem(expr) => out.push(eval_expr(expr, bound)?),
            super::fence::FenceArrayElem::Hole => {
                out.push(FenceValue::Leaves(vec![AtomValue::Null]));
            }
        }
    }
    Some(FenceValue::Array(out))
}

/// Read a static member over a folded object; arrays and leaves refuse,
/// so `.length` never folds inside the fence, verbatim v2.
fn eval_member(object: &PureExpr, prop: &str, bound: &[FenceValue]) -> Option<FenceValue> {
    let FenceValue::Object(entries) = eval_expr(object, bound)? else {
        return None;
    };
    entries
        .iter()
        .rev()
        .find(|(key, _)| key.as_ref() == prop)
        .map(|(_, value)| value.clone())
}

/// Read a computed index over a folded object or array.
fn eval_index(object: &PureExpr, index: &PureExpr, bound: &[FenceValue]) -> Option<FenceValue> {
    let base = eval_expr(object, bound)?;
    let key = property_key(&eval_expr(index, bound)?)?;
    match base {
        FenceValue::Object(entries) => entries
            .iter()
            .rev()
            .find(|(name, _)| name.as_ref() == key)
            .map(|(_, value)| value.clone()),
        FenceValue::Array(items) => {
            let position: usize = key.parse().ok()?;
            items.get(position).cloned()
        }
        FenceValue::Leaves(_) => None,
    }
}

/// True for a single null leaf, the `??` trigger.
fn is_null(value: &FenceValue) -> bool {
    matches!(
        value,
        FenceValue::Leaves(leaves)
            if matches!(leaves.as_slice(), [AtomValue::Null])
    )
}
