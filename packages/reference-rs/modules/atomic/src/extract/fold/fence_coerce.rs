//! Fenced value coercions with JS semantics (SPEC-V2-39).
//!
//! Truthiness, `ToString`, `ToNumber`, and `ToPropertyKey` for fence leaves,
//! ported from v2's evaluator one rule at a time: null is falsy and numeric
//! zero, empty strings are falsy and numeric zero, and tokens refuse like
//! the sibling nodes. Single-leaf access and leaf constructors live here so
//! every fence consumer shares the same outcomes.

use super::fence::FenceValue;
use crate::atom::AtomValue;

/// The single leaf of a folded value, or None for multi-leaf unions.
pub(crate) fn single_leaf(value: &FenceValue) -> Option<AtomValue> {
    let FenceValue::Leaves(leaves) = value else {
        return None;
    };
    let [only] = leaves.as_slice() else {
        return None;
    };
    Some(only.clone())
}

/// JS `ToPropertyKey` for static extraction: strings pass through, numbers
/// stringify, and booleans, null, compounds, and unions refuse.
pub(crate) fn property_key(value: &FenceValue) -> Option<String> {
    match single_leaf(value)? {
        AtomValue::String(text) => Some(text.to_string()),
        AtomValue::Number(text) => {
            let parsed: f64 = text.parse().ok()?;
            Some(super::unary::canon_number(parsed).to_string())
        }
        AtomValue::Bool(_) | AtomValue::Null | AtomValue::Token { .. } => None,
    }
}

/// JS truthiness: null, false, zero, NaN, and empty strings are falsy;
/// objects, arrays, and multi-leaf unions are always truthy, verbatim v2.
pub(crate) fn truthy(value: &FenceValue) -> bool {
    match value {
        FenceValue::Object(_) | FenceValue::Array(_) => true,
        FenceValue::Leaves(leaves) => match leaves.as_slice() {
            [only] => leaf_truthy(only),
            _ => true,
        },
    }
}

/// Truthiness of one leaf: null, false, zero, NaN, and empty are falsy.
fn leaf_truthy(leaf: &AtomValue) -> bool {
    match leaf {
        AtomValue::Null => false,
        AtomValue::Bool(flag) => *flag,
        AtomValue::Number(text) => nonzero_number(text),
        AtomValue::String(text) => !text.is_empty(),
        AtomValue::Token { .. } => false,
    }
}

/// True for numbers that are neither zero nor NaN.
fn nonzero_number(text: &str) -> bool {
    text.parse::<f64>()
        .is_ok_and(|number| number != 0.0 && !number.is_nan())
}

/// JS `ToString` for fence leaves; tokens refuse like the sibling nodes.
pub(crate) fn coerce_to_string(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(text) => Some(text.to_string()),
        AtomValue::Number(text) => number_to_string(text),
        AtomValue::Bool(flag) => Some(flag.to_string()),
        AtomValue::Null => Some("null".to_string()),
        AtomValue::Token { .. } => None,
    }
}

/// Render a numeric spelling the way JS stringifies the number.
fn number_to_string(text: &str) -> Option<String> {
    let parsed: f64 = text.parse().ok()?;
    Some(super::unary::canon_number(parsed).to_string())
}

/// JS `ToNumber` for fence leaves; NaN-producing strings refuse.
pub(crate) fn coerce_to_number(leaf: &AtomValue) -> Option<f64> {
    match leaf {
        AtomValue::Number(text) => text.parse().ok(),
        AtomValue::Bool(flag) => Some(f64::from(u8::from(*flag))),
        AtomValue::Null => Some(0.0),
        AtomValue::String(text) => string_to_number(text),
        AtomValue::Token { .. } => None,
    }
}

/// Parse a string to a number: blank is zero, unparsable refuses.
fn string_to_number(text: &str) -> Option<f64> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Some(0.0);
    }
    trimmed.parse().ok()
}

/// True for leaves that force `+` into concatenation.
pub(crate) fn is_string_like(leaf: &AtomValue) -> bool {
    matches!(leaf, AtomValue::String(_))
}

/// A single string leaf value.
pub(crate) fn leaf_string(text: String) -> FenceValue {
    FenceValue::Leaves(vec![AtomValue::String(text.into())])
}

/// A single numeric leaf value, canonically spelled.
pub(crate) fn leaf_number(value: f64) -> FenceValue {
    FenceValue::Leaves(vec![AtomValue::Number(super::unary::canon_number(value))])
}
