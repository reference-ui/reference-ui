//! JavaScript value semantics for the fold table, shared by every node.
//!
//! `to_number`, `to_js_string`, `truthy`, and the equality helpers encode the
//! literal subset of JS coercion exactly the way Panda v2's `literal.rs` does
//! (`coerce_to_number`, `coerce_to_string`, `truthy`, `loose_eq`), so a fold
//! agrees with v2 leaf-for-leaf: booleans coerce to 0/1, null coerces to 0,
//! empty strings coerce to 0, and anything NaN-producing refuses instead of
//! emitting a value that cannot round-trip. Tokens behave string-like, as in
//! v2. These are pure functions over [`AtomValue`]; the nodes own combination.

use crate::atom::AtomValue;

/// JavaScript `ToNumber` for a folded leaf: `None` where JS yields `NaN`.
///
/// Consumes booleans (0/1), null (0), and numeric strings the way v2's
/// `coerce_to_number` does: trim, empty means 0, otherwise a Rust float
/// parse. Hex and binary spellings refuse — the parse rejects them, exactly
/// like v2. Infinity survives as an operand (comparisons stay valid); only
/// `NaN` refuses here, and arithmetic results check finiteness separately.
pub fn to_number(leaf: &AtomValue) -> Option<f64> {
    match leaf {
        AtomValue::Number(raw) => raw.parse::<f64>().ok(),
        AtomValue::Bool(on) => Some(f64::from(u8::from(*on))),
        AtomValue::Null => Some(0.0),
        AtomValue::String(text) => numeric_string(text),
        AtomValue::Token { value, .. } => numeric_string(value),
    }
}

/// JavaScript `Number(string)`: trim, empty is 0, else a float parse.
fn numeric_string(text: &str) -> Option<f64> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Some(0.0);
    }
    trimmed.parse::<f64>().ok()
}

/// JavaScript `String(x)` for a folded leaf.
///
/// Numbers print finite-only (`-0` prints `0`, as in JS); magnitudes past
/// `1e21` print Rust-style rather than JS exponent form, a documented edge
/// no authored style reaches. Tokens behave string-like the way v2's
/// `is_string_like` treats them: the value prints, the path stays behind.
pub fn to_js_string(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(text) => Some(text.to_string()),
        AtomValue::Token { value, .. } => Some(value.to_string()),
        AtomValue::Number(raw) => raw.parse::<f64>().ok().map(js_number_string),
        AtomValue::Bool(on) => Some((*on).to_string()),
        AtomValue::Null => Some("null".to_string()),
    }
}

/// A finite float the way `String(n)` prints it, minus exponent form.
fn js_number_string(n: f64) -> String {
    if n == 0.0 {
        return "0".to_string();
    }
    n.to_string()
}

/// JavaScript truthiness for a folded leaf, mirroring v2's `truthy`.
///
/// Null, `false`, zero, and empty strings are falsy; everything else is
/// truthy. A number that does not parse refuses — corrupt leaves abstain
/// rather than guess.
pub fn truthy(leaf: &AtomValue) -> Option<bool> {
    match leaf {
        AtomValue::Null => Some(false),
        AtomValue::Bool(on) => Some(*on),
        AtomValue::Number(raw) => raw.parse::<f64>().ok().map(|n| n != 0.0),
        AtomValue::String(text) => Some(!text.is_empty()),
        AtomValue::Token { .. } => None,
    }
}

/// True for the nullish leaves (`??` takes the right operand through them).
pub fn nullish(leaf: &AtomValue) -> bool {
    matches!(leaf, AtomValue::Null)
}

/// JavaScript `===` for folded leaves: cross-type pairs are always false.
///
/// String-like pairs (strings and tokens) compare by printed value, the way
/// v2's `strict_eq` compares them; numbers compare by parsed value so `1`
/// and `1.0` spellings agree.
pub fn strict_eq(left: &AtomValue, right: &AtomValue) -> bool {
    if is_string_like(left) && is_string_like(right) {
        return to_js_string(left) == to_js_string(right);
    }
    match (left, right) {
        (AtomValue::Null, AtomValue::Null) => true,
        (AtomValue::Number(a), AtomValue::Number(b)) => numbers_equal(a.as_ref(), b.as_ref()),
        (AtomValue::Bool(a), AtomValue::Bool(b)) => a == b,
        _ => false,
    }
}

/// True for the leaves `+` concatenates: strings and token refs.
pub fn is_string_like(leaf: &AtomValue) -> bool {
    matches!(leaf, AtomValue::String(_) | AtomValue::Token { .. })
}

/// Numeric leaves compare by value, so `1` and `1.0` spellings agree.
fn numbers_equal(a: &str, b: &str) -> bool {
    match (a.parse::<f64>(), b.parse::<f64>()) {
        (Ok(x), Ok(y)) => x == y,
        _ => false,
    }
}

/// JavaScript `==` for folded leaves, mirroring v2's `loose_eq` arm for arm.
///
/// Same-category pairs defer to [`strict_eq`]; null pairs with nothing;
/// string-like/number pairs parse-compare (an unparseable string is `false`
/// — v2's rule, which also makes `'' == 0` false where JS says true);
/// booleans convert to numbers and recurse. Anything else refuses.
pub fn loose_eq(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    if same_category(left, right) {
        return Some(strict_eq(left, right));
    }
    match (left, right) {
        (AtomValue::Null, _) | (_, AtomValue::Null) => Some(false),
        _ => loose_mixed_eq(left, right),
    }
}

/// True when both leaves share a `==` category: null, string-like, number, bool.
fn same_category(left: &AtomValue, right: &AtomValue) -> bool {
    matches!(
        (left, right),
        (AtomValue::Null, AtomValue::Null)
            | (AtomValue::Number(_), AtomValue::Number(_))
            | (AtomValue::Bool(_), AtomValue::Bool(_))
    ) || is_string_like(left) && is_string_like(right)
}

/// Loose equality across categories: string/number, boolean, or refuse.
fn loose_mixed_eq(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    if let Some(compared) = string_number_eq(left, right) {
        return Some(compared);
    }
    if let Some(pair) = bool_pair(left, right) {
        return loose_eq(&pair.0, &pair.1);
    }
    None
}

/// A string-like/number pair parse-compares, or None when not such a pair.
fn string_number_eq(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    let (text, num) = string_number_sides(left, right)?;
    Some(text.trim().parse::<f64>().is_ok_and(|parsed| parsed == num))
}

/// Split a string-like/number pair into sides, or None for other pairs.
fn string_number_sides<'a>(left: &'a AtomValue, right: &'a AtomValue) -> Option<(&'a str, f64)> {
    if let (Some(text), AtomValue::Number(raw)) = (string_side(left), right) {
        return raw.parse::<f64>().ok().map(|num| (text, num));
    }
    if let (AtomValue::Number(raw), Some(text)) = (left, string_side(right)) {
        return raw.parse::<f64>().ok().map(|num| (text, num));
    }
    None
}

/// The printed text of a string-like leaf, or None for other leaves.
fn string_side(leaf: &AtomValue) -> Option<&str> {
    match leaf {
        AtomValue::String(text) => Some(text.as_ref()),
        AtomValue::Token { value, .. } => Some(value.as_ref()),
        _ => None,
    }
}

/// Rewrite one boolean side to its number, or None when neither is boolean.
fn bool_pair(left: &AtomValue, right: &AtomValue) -> Option<(AtomValue, AtomValue)> {
    if let AtomValue::Bool(on) = left {
        return Some((bool_number(*on), right.clone()));
    }
    if let AtomValue::Bool(on) = right {
        return Some((left.clone(), bool_number(*on)));
    }
    None
}

/// A boolean as its numeric leaf for loose comparison.
fn bool_number(on: bool) -> AtomValue {
    AtomValue::Number(if on { "1".into() } else { "0".into() })
}

/// JavaScript `<` for folded leaves, mirroring v2's `less_than`.
///
/// Two string-like leaves compare lexicographically (Rust byte order, which
/// matches JS for every BMP string); anything else converts numerically. A
/// failed conversion refuses, the way v2 drops NaN comparisons.
pub fn less_than(left: &AtomValue, right: &AtomValue) -> Option<bool> {
    if is_string_like(left) && is_string_like(right) {
        return Some(to_js_string(left)? < to_js_string(right)?);
    }
    let x = to_number(left)?;
    let y = to_number(right)?;
    Some(x < y)
}

/// A finite fold result as its canonical spelling: `-0` prints `0`.
pub fn canon_number(value: f64) -> Box<str> {
    if value == 0.0 {
        Box::from("0")
    } else {
        value.to_string().into_boxed_str()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A string leaf for coercion probes.
    fn text(value: &str) -> AtomValue {
        AtomValue::String(value.into())
    }

    /// A numeric leaf for coercion probes.
    fn number(value: &str) -> AtomValue {
        AtomValue::Number(value.into())
    }

    #[test]
    fn numbers_bools_null_and_numeric_strings_coerce() {
        assert_eq!(to_number(&number("4")), Some(4.0));
        assert_eq!(to_number(&AtomValue::Bool(true)), Some(1.0));
        assert_eq!(to_number(&AtomValue::Null), Some(0.0));
        assert_eq!(to_number(&text("5")), Some(5.0));
        assert_eq!(to_number(&text("  .5 ")), Some(0.5));
        assert_eq!(to_number(&text("")), Some(0.0));
    }

    #[test]
    fn nan_producing_strings_refuse() {
        assert_eq!(to_number(&text("foo")), None);
        assert_eq!(to_number(&text("0x10")), None);
        assert_eq!(to_number(&text("1px")), None);
    }

    #[test]
    fn strings_print_js_style() {
        assert_eq!(to_js_string(&text("px")), Some("px".to_string()));
        assert_eq!(to_js_string(&number("4")), Some("4".to_string()));
        assert_eq!(to_js_string(&number("-0")), Some("0".to_string()));
        assert_eq!(
            to_js_string(&AtomValue::Bool(true)),
            Some("true".to_string())
        );
        assert_eq!(to_js_string(&AtomValue::Null), Some("null".to_string()));
    }

    #[test]
    fn falsy_leaves_are_null_false_zero_and_empty() {
        assert_eq!(truthy(&AtomValue::Null), Some(false));
        assert_eq!(truthy(&AtomValue::Bool(false)), Some(false));
        assert_eq!(truthy(&number("0")), Some(false));
        assert_eq!(truthy(&text("")), Some(false));
        assert_eq!(truthy(&text("x")), Some(true));
        assert_eq!(truthy(&number("2")), Some(true));
        assert_eq!(truthy(&AtomValue::Bool(true)), Some(true));
    }

    #[test]
    fn strict_equality_needs_same_type() {
        assert!(strict_eq(&text("red"), &text("red")));
        assert!(!strict_eq(&text("red"), &text("blue")));
        assert!(strict_eq(&number("1"), &number("1.0")));
        assert!(!strict_eq(&number("1"), &text("1")));
        assert!(!strict_eq(&AtomValue::Null, &text("null")));
    }

    #[test]
    fn loose_equality_coerces_like_js() {
        assert_eq!(loose_eq(&number("1"), &text("1")), Some(true));
        assert_eq!(loose_eq(&AtomValue::Null, &text("x")), Some(false));
        assert_eq!(loose_eq(&AtomValue::Bool(true), &number("1")), Some(true));
        assert_eq!(loose_eq(&number("0"), &AtomValue::Bool(false)), Some(true));
        assert_eq!(loose_eq(&text("foo"), &number("1")), Some(false));
        assert_eq!(loose_eq(&AtomValue::Null, &AtomValue::Null), Some(true));
    }

    #[test]
    fn less_than_is_lexicographic_for_strings_numeric_otherwise() {
        assert_eq!(less_than(&text("a"), &text("b")), Some(true));
        assert_eq!(less_than(&text("b"), &text("a")), Some(false));
        assert_eq!(less_than(&number("3"), &number("5")), Some(true));
        assert_eq!(less_than(&text("10"), &number("9")), Some(false));
        assert_eq!(less_than(&text("foo"), &number("1")), None);
    }

    #[test]
    fn canon_prints_neg_zero_as_zero() {
        assert_eq!(canon_number(-0.0).as_ref(), "0");
        assert_eq!(canon_number(2.5).as_ref(), "2.5");
    }
}
