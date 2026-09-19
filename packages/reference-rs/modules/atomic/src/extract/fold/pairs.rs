//! Binary pair truth tables: one operator applied to one leaf pair.
//!
//! [`apply_pair`] folds a single pair of [`AtomValue`] leaves for one
//! operator — addition (concatenating when either side is string-like),
//! numeric arithmetic, strict and loose equality, and ordered comparison —
//! per JavaScript coercion exactly the way Panda v2's `eval_binary` does.
//! Anything NaN-producing, non-finite, or unmodeled refuses instead of
//! emitting a value that cannot round-trip. The binary node owns operands
//! and combination; this file owns pairs.

use oxc_ast::ast::BinaryOperator;

use super::binary::BinaryRefusal;
use super::coerce::{
    canon_number, is_string_like, less_than, loose_eq, strict_eq, to_js_string, to_number,
};
use crate::atom::AtomValue;

/// One folded pair: its value, or the refusal that stopped it.
pub(crate) enum PairOutcome {
    Value(AtomValue),
    Refuse(BinaryRefusal),
}

/// Fold one leaf pair for one operator, refusing what cannot fold.
pub(crate) fn apply_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    if op == BinaryOperator::Addition {
        return add_pair(op, left, right);
    }
    if is_numeric_op(op) {
        return numeric_pair(op, left, right);
    }
    if is_strict_op(op) {
        return strict_pair(op, left, right);
    }
    if is_loose_op(op) {
        return loose_pair(op, left, right);
    }
    if is_compare_op(op) {
        return compare_pair(op, left, right);
    }
    PairOutcome::Refuse(BinaryRefusal::OperatorNotFoldable(op))
}

/// True for the numeric arithmetic operators (`- * / % **`).
fn is_numeric_op(op: BinaryOperator) -> bool {
    matches!(
        op,
        BinaryOperator::Subtraction
            | BinaryOperator::Multiplication
            | BinaryOperator::Division
            | BinaryOperator::Remainder
            | BinaryOperator::Exponential
    )
}

/// True for the strict equality operators (`=== !==`).
fn is_strict_op(op: BinaryOperator) -> bool {
    matches!(
        op,
        BinaryOperator::StrictEquality | BinaryOperator::StrictInequality
    )
}

/// True for the loose equality operators (`== !=`).
fn is_loose_op(op: BinaryOperator) -> bool {
    matches!(op, BinaryOperator::Equality | BinaryOperator::Inequality)
}

/// True for the ordered comparison operators (`< <= > >=`).
fn is_compare_op(op: BinaryOperator) -> bool {
    matches!(
        op,
        BinaryOperator::LessThan
            | BinaryOperator::LessEqualThan
            | BinaryOperator::GreaterThan
            | BinaryOperator::GreaterEqualThan
    )
}

/// `+` concatenates when either side is string-like, else adds numerically.
fn add_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    if is_string_like(left) || is_string_like(right) {
        // '50' + '%'  /  1 + 'px'  — JS `String()` on both sides
        return concat_pair(op, left, right);
    }
    // 2 + 3  /  true + true  — numeric add, finite results only
    let (Some(x), Some(y)) = (to_number(left), to_number(right)) else {
        return PairOutcome::Refuse(BinaryRefusal::NonNumericOperand(op));
    };
    finite_number(op, x + y)
}

/// Join two leaves as strings, refusing what does not print.
fn concat_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    let (Some(head), Some(tail)) = (to_js_string(left), to_js_string(right)) else {
        return PairOutcome::Refuse(BinaryRefusal::NonNumericOperand(op));
    };
    PairOutcome::Value(AtomValue::String(format!("{head}{tail}").into()))
}

/// `- * / % **` coerce both sides numerically, refusing past finiteness.
fn numeric_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    // '5' - 1  /  true * 4  — JS `Number()` coercion, v2's rule
    let (Some(x), Some(y)) = (to_number(left), to_number(right)) else {
        return PairOutcome::Refuse(BinaryRefusal::NonNumericOperand(op));
    };
    let Some(result) = apply_numeric(op, x, y) else {
        return PairOutcome::Refuse(BinaryRefusal::OperatorNotFoldable(op));
    };
    finite_number(op, result)
}

/// One numeric operation, or None for a non-numeric operator.
fn apply_numeric(op: BinaryOperator, x: f64, y: f64) -> Option<f64> {
    match op {
        BinaryOperator::Subtraction => Some(x - y),
        BinaryOperator::Multiplication => Some(x * y),
        BinaryOperator::Division => Some(x / y),
        BinaryOperator::Remainder => Some(x % y),
        BinaryOperator::Exponential => Some(x.powf(y)),
        _ => None,
    }
}

/// One numeric result: its canonical spelling, or a non-finite refusal.
fn finite_number(op: BinaryOperator, result: f64) -> PairOutcome {
    // 1 / 0  /  0 / 0  — never emit Infinity or NaN into a style
    if result.is_finite() {
        PairOutcome::Value(AtomValue::Number(canon_number(result)))
    } else {
        PairOutcome::Refuse(BinaryRefusal::NonFiniteResult(op))
    }
}

/// `===` / `!==` compare strictly: cross-type pairs are always unequal.
fn strict_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    // 1 === '1'  — false, no coercion, total over all pairs
    let equal = strict_eq(left, right);
    PairOutcome::Value(AtomValue::Bool(
        matches!(op, BinaryOperator::StrictEquality) == equal,
    ))
}

/// `==` / `!=` compare loosely per JS coercion, refusing what v2 refuses.
fn loose_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    // 1 == '1'  — true; null == 'x'  — false
    let Some(equal) = loose_eq(left, right) else {
        return PairOutcome::Refuse(BinaryRefusal::NonNumericOperand(op));
    };
    PairOutcome::Value(AtomValue::Bool(
        matches!(op, BinaryOperator::Equality) == equal,
    ))
}

/// `< <= > >=` compare directly or via the negated mirror, as in v2.
fn compare_pair(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> PairOutcome {
    // 'a' < 'b'  — lexicographic; 3 < 5  — numeric
    match compare_ordered(op, left, right) {
        Some(ordered) => PairOutcome::Value(AtomValue::Bool(ordered)),
        None => PairOutcome::Refuse(BinaryRefusal::NonNumericOperand(op)),
    }
}

/// One ordered comparison, or None for a non-comparison operator.
fn compare_ordered(op: BinaryOperator, left: &AtomValue, right: &AtomValue) -> Option<bool> {
    match op {
        BinaryOperator::LessThan => less_than(left, right),
        BinaryOperator::LessEqualThan => less_than(right, left).map(|ordered| !ordered),
        BinaryOperator::GreaterThan => less_than(right, left),
        BinaryOperator::GreaterEqualThan => less_than(left, right).map(|ordered| !ordered),
        _ => None,
    }
}
