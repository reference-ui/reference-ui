//! Fenced arithmetic and comparison evaluation (SPEC-V2-39).
//!
//! Binary operators over folded leaves with v2's `pure_fn` eval semantics:
//! arithmetic refuses division by zero and non-finite results, and
//! comparisons follow strict, loose, and relational coercion. Equality and
//! relational operators split into their own functions so each match stays
//! small enough to read at a glance.

use super::fence::{FenceBinary, FenceValue, PureExpr};
use super::fence_coerce::{
    coerce_to_number, coerce_to_string, is_string_like, leaf_number, single_leaf,
};
use super::fence_eval::eval_expr;
use crate::atom::AtomValue;

/// Evaluate one non-concat binary operator over two folded operands.
pub(crate) fn eval_binary_expr(
    op: FenceBinary,
    left: &PureExpr,
    right: &PureExpr,
    bound: &[FenceValue],
) -> Option<FenceValue> {
    let left_val = single_leaf(&eval_expr(left, bound)?)?;
    let right_val = single_leaf(&eval_expr(right, bound)?)?;
    eval_binary(op, &left_val, &right_val)
}

/// Arithmetic and comparison over two single leaves, verbatim v2.
pub(crate) fn eval_binary(op: FenceBinary, left: &AtomValue, right: &AtomValue) -> Option<FenceValue> {
    if let Some(number) = eval_arithmetic(op, left, right) {
        return Some(number);
    }
    let yes = eval_comparison(op, left, right)?;
    Some(FenceValue::Leaves(vec![AtomValue::Bool(yes)]))
}

/// Comparison over two single leaves: strict, loose, and relational.
pub(crate) fn eval_comparison(
    op: FenceBinary,
    left: &AtomValue,
    right: &AtomValue,
) -> Option<bool> {
    if let Some(known) = eval_equality(op, left, right) {
        return Some(known);
    }
    eval_relational(op, left, right)
}

/// Equality over two single leaves: strict and loose operators.
fn eval_equality(op: FenceBinary, left: &AtomValue, right: &AtomValue) -> Option<bool> {
    match op {
        FenceBinary::StrictEq => Some(strict_eq(left, right)),
        FenceBinary::StrictNotEq => Some(!strict_eq(left, right)),
        FenceBinary::EqEq => loose_eq(left, right),
        FenceBinary::NotEq => loose_eq(left, right).map(|yes| !yes),
        _ => None,
    }
}

/// Relational comparison over two single leaves via one-sided `<`.
fn eval_relational(op: FenceBinary, left: &AtomValue, right: &AtomValue) -> Option<bool> {
    match op {
        FenceBinary::Lt => less_than(left, right),
        FenceBinary::LtEq => less_than(right, left).map(|yes| !yes),
        FenceBinary::Gt => less_than(right, left),
        FenceBinary::GtEq => less_than(left, right).map(|yes| !yes),
        _ => None,
    }
}

/// Arithmetic over two single leaves; division by zero and non-finite
/// results refuse instead of emitting values that cannot round-trip.
pub(crate) fn eval_arithmetic(
    op: FenceBinary,
    left: &AtomValue,
    right: &AtomValue,
) -> Option<FenceValue> {
    let lhs = coerce_to_number(left)?;
    let rhs = coerce_to_number(right)?;
    let result = apply_arith(op, lhs, rhs)?;
    if !result.is_finite() {
        return None;
    }
    Some(leaf_number(result))
}

/// Apply one arithmetic operator to two coerced operands.
fn apply_arith(op: FenceBinary, lhs: f64, rhs: f64) -> Option<f64> {
    if let Some(plain) = plain_arith(op, lhs, rhs) {
        return Some(plain);
    }
    guarded_arith(op, lhs, rhs)
}

/// Apply an always-finite operator: subtraction and multiplication.
fn plain_arith(op: FenceBinary, lhs: f64, rhs: f64) -> Option<f64> {
    match op {
        FenceBinary::Sub => Some(lhs - rhs),
        FenceBinary::Mul => Some(lhs * rhs),
        _ => None,
    }
}

/// Apply a guarded operator: division, remainder, and power.
fn guarded_arith(op: FenceBinary, lhs: f64, rhs: f64) -> Option<f64> {
    match op {
        FenceBinary::Div => guarded_div(lhs, rhs),
        FenceBinary::Rem => guarded_rem(lhs, rhs),
        FenceBinary::Exp => guarded_exp(lhs, rhs),
        _ => None,
    }
}

/// Divide with a zero divisor refusing instead of yielding infinity.
fn guarded_div(lhs: f64, rhs: f64) -> Option<f64> {
    if rhs == 0.0 {
        return None;
    }
    Some(lhs / rhs)
}

/// Take a remainder with a zero divisor refusing instead of yielding NaN.
fn guarded_rem(lhs: f64, rhs: f64) -> Option<f64> {
    if rhs == 0.0 {
        return None;
    }
    Some(lhs % rhs)
}

/// Raise to a power, refusing results that cannot round-trip.
fn guarded_exp(lhs: f64, rhs: f64) -> Option<f64> {
    let result = lhs.powf(rhs);
    if result.is_finite() {
        Some(result)
    } else {
        None
    }
}

/// JS `===`: nulls match, strings compare by text, numbers by value,
/// booleans by flag, and every cross-type or token pair is false.
pub(crate) fn strict_eq(left: &AtomValue, right: &AtomValue) -> bool {
    match (left, right) {
        (AtomValue::Null, AtomValue::Null) => true,
        (AtomValue::String(first), AtomValue::String(second)) => first == second,
        (AtomValue::Bool(first), AtomValue::Bool(second)) => first == second,
        (AtomValue::Number(first), AtomValue::Number(second)) => {
            numbers_equal(first, second)
        }
        _ => false,
    }
}

/// Compare two numeric spellings by parsed value, falling back to text.
fn numbers_equal(first: &str, second: &str) -> bool {
    match (first.parse::<f64>(), second.parse::<f64>()) {
        (Ok(left), Ok(right)) => left == right,
        _ => first == second,
    }
}

/// JS `==` for fence leaves; pairs needing `ToPrimitive` refuse.
pub(crate) fn loose_eq(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    if same_shape(left, right) {
        return Some(strict_eq(left, right));
    }
    if matches!(left, AtomValue::Null) || matches!(right, AtomValue::Null) {
        return Some(false);
    }
    loose_eq_mixed(left, right)
}

/// True when both leaves share a primitive kind.
fn same_shape(left: &AtomValue, right: &AtomValue) -> bool {
    matches!(
        (left, right),
        (AtomValue::Null, AtomValue::Null)
            | (AtomValue::String(_), AtomValue::String(_))
            | (AtomValue::Number(_), AtomValue::Number(_))
            | (AtomValue::Bool(_), AtomValue::Bool(_))
    )
}

/// Loose equality across kinds: string-number compares numerically and
/// booleans recurse as 0/1, verbatim v2's coercion order.
fn loose_eq_mixed(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    match (left, right) {
        (AtomValue::String(text), AtomValue::Number(number))
        | (AtomValue::Number(number), AtomValue::String(text)) => {
            loose_eq_string_number(text, number)
        }
        (AtomValue::Bool(flag), other) | (other, AtomValue::Bool(flag)) => {
            let digit = if *flag { "1" } else { "0" };
            let coerced = AtomValue::Number(digit.into());
            loose_eq(&coerced, other)
        }
        _ => None,
    }
}

/// Compare a string against a number by parsing both sides.
fn loose_eq_string_number(text: &str, number: &str) -> Option<bool> {
    let parsed: f64 = number.parse().ok()?;
    Some(text.trim().parse::<f64>().is_ok_and(|value| value == parsed))
}

/// JS `<`: lexicographic for two strings, otherwise numeric with `ToNumber`.
pub(crate) fn less_than(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    if is_string_like(left) && is_string_like(right) {
        return Some(coerce_to_string(left)? < coerce_to_string(right)?);
    }
    Some(coerce_to_number(left)? < coerce_to_number(right)?)
}

