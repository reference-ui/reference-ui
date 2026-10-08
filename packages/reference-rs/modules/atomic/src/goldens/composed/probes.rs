//! Composed `name` probe lists: one declaration per row.
//!
//! Each helper returns the authored declarations for one divergence topic
//! the `16-name` suite pins. Scalar edges came first; every fortify arc
//! appends its own helper (container, range, twin, token, dispatch,
//! prefix) so `name_suite` stays a short concatenation that never crosses
//! a line.

use serde_json::{json, Value};

use crate::runtime::AuthoredDeclaration;

/// One authored declaration from parts.
pub(crate) fn decl(
    when: &[&str],
    prop: &str,
    value: Value,
    important: bool,
) -> AuthoredDeclaration {
    AuthoredDeclaration {
        when: when.iter().map(|entry| (*entry).to_string()).collect(),
        prop: prop.to_string(),
        value,
        important,
    }
}

/// Scalar value edges at composed scale: numeric canonicalization, `$r`,
/// whitespace and case edges, and the responsive-object survivor.
pub(crate) fn scalar_probes() -> Vec<AuthoredDeclaration> {
    vec![
        decl(&[], "padding", json!("1e21"), false),
        decl(&[], "padding", json!("1e-7"), false),
        decl(&[], "padding", json!("1e20"), false),
        decl(&[], "padding", json!("1e-6"), false),
        decl(&[], "padding", json!("0.5"), false),
        decl(&[], "padding", json!("-0"), false),
        decl(&[], "top", json!("0x10"), false),
        decl(&[], "margin", json!(""), false),
        decl(&[], "margin", json!("  "), false),
        decl(&[], "padding", json!("inf"), false),
        decl(&[], "padding", json!("Infinity"), false),
        decl(&[], "padding", json!("nan"), false),
        decl(&[], "padding", json!(" 0x10"), false),
        decl(&[], "padding", json!(0.0), false),
        decl(&[], "padding", json!(1e21), false),
        decl(&[], "marginTop", json!({"$r": 2}), false),
        decl(&[], "marginTop", json!({"$r": 1e21}), false),
        decl(&[], "marginTop", json!({"$r": 2.0000005}), false),
        decl(&[], "padding", json!("a\u{85}b"), false),
        decl(&[], "padding", json!("a\u{feff}b"), false),
        decl(&[], "content", json!("\"a\rb\""), false),
        decl(&[], "color", json!("İnk"), false),
        decl(&[], "borderTop", json!("SOLID 3px red"), false),
        decl(&[], "width", json!({"md": "2r", "base": "1r"}), false),
    ]
}

/// `container` bare/named probes: bools, the empty, exact and padded
/// `"true"` (the oracle compares untrimmed), a name, and falsy kinds.
pub(crate) fn container_probes() -> Vec<AuthoredDeclaration> {
    vec![
        decl(&[], "container", json!(true), false),
        decl(&[], "container", json!(""), false),
        decl(&[], "container", json!("true"), false),
        decl(&[], "container", json!("true "), false),
        decl(&[], "container", json!(" true"), false),
        decl(&[], "container", json!("\ttrue"), false),
        decl(&[], "container", json!(" \t true \n "), false),
        decl(&[], "container", json!("sidebar"), false),
        decl(&[], "container", json!(false), false),
        decl(&[], "container", json!(null), false),
        decl(&[], "container", json!(0), false),
    ]
}

/// Non-bare custom widths at composed scale: the Down and Between
/// members drop while the plan survives, the last-bp Only mints,
/// and a bad scalar `when` drops the whole want.
pub(crate) fn range_probes() -> Vec<AuthoredDeclaration> {
    vec![
        decl(&[], "color", json!({"tabletDown": "red", "md": "blue"}), false),
        decl(
            &[],
            "color",
            json!({"smTotablet": "red", "md": "blue"}),
            false,
        ),
        decl(
            &[],
            "color",
            json!({"emptyOnly": "red", "md": "blue"}),
            false,
        ),
        decl(&["tabletDown"], "color", json!("red"), false),
    ]
}

/// Twin catalog at composed scale: the `_x` member mints through the
/// twin of authored `__x` while the plan survives, and a scalar `_x`
/// `when` lowers to the `x` segment.
pub(crate) fn twin_probes() -> Vec<AuthoredDeclaration> {
    vec![
        decl(&[], "color", json!({"_x": "red", "md": "blue"}), false),
        decl(&["_x"], "color", json!("red"), false),
    ]
}

/// Token kinds at composed scale: `token('none')` on `outline` passes
/// through whole (the ring sits behind the scalar gate), the red path
/// agrees as the control, `token('0')` on `border` skips the zero emit,
/// and `token('inherit')` passes through like the whole-keep.
pub(crate) fn token_probes() -> Vec<AuthoredDeclaration> {
    vec![
        decl(
            &[],
            "outline",
            json!({"$token": {"path": "none", "value": "#000"}}),
            false,
        ),
        decl(
            &[],
            "outline",
            json!({"$token": {"path": "colors.red.500", "value": "#000"}}),
            false,
        ),
        decl(
            &[],
            "border",
            json!({"$token": {"path": "0", "value": "#000"}}),
            false,
        ),
        decl(
            &[],
            "border",
            json!({"$token": {"path": "inherit", "value": "#000"}}),
            false,
        ),
    ]
}

/// Range dispatch at composed scale: the `aToxDown` member drops with
/// no between fallthrough while the plan survives, and a scalar
/// `aToxDown` `when` drops the whole want.
pub(crate) fn dispatch_probes() -> Vec<AuthoredDeclaration> {
    vec![
        decl(&[], "color", json!({"aToxDown": "red", "md": "blue"}), false),
        decl(&["aToxDown"], "color", json!("red"), false),
    ]
}

/// Prefix table-miss at composed scale: the probe font's extras all miss
/// the alias and prefix tables, so every class spells its key verbatim.
pub(crate) fn prefix_probes() -> Vec<AuthoredDeclaration> {
    vec![decl(&[], "font", json!("test"), false)]
}

/// Canonical numeric index value, mirroring the gate's isIntegerLikeKey:
/// digits, no leading zero unless "0" itself, below 2^32-1.
pub(crate) fn integer_key_value(key: &str) -> Option<u32> {
    if key.is_empty() || (key.len() > 1 && key.starts_with('0')) {
        return None;
    }
    if !key.bytes().all(|byte| byte.is_ascii_digit()) {
        return None;
    }
    let num: u64 = key.parse().ok()?;
    if num >= 4_294_967_295 {
        return None;
    }
    u32::try_from(num).ok()
}

/// V8 `[[OwnPropertyKeys]]` order for per-prop keys: canonical numeric
/// indices ascending first, every other key stable after.
pub(crate) fn v8_observed_order(pairs: &[(String, Value)]) -> Vec<(String, Value)> {
    let mut numeric: Vec<(u32, String, Value)> = Vec::new();
    let mut rest: Vec<(String, Value)> = Vec::new();
    for (key, value) in pairs {
        match integer_key_value(key) {
            Some(num) => numeric.push((num, key.clone(), value.clone())),
            None => rest.push((key.clone(), value.clone())),
        }
    }
    numeric.sort_by_key(|(num, _, _)| *num);
    numeric
        .into_iter()
        .map(|(_, key, value)| (key, value))
        .chain(rest)
        .collect()
}

/// Per-prop value in V8-observed order: the object the JS mirror receives
/// for integer-key rows, hence the order the expected output runs in.
pub(crate) fn v8_ordered_value(pairs: &[(String, Value)]) -> Value {
    let mut map = serde_json::Map::new();
    for (key, value) in v8_observed_order(pairs) {
        map.insert(key, value);
    }
    Value::Object(map)
}

/// Integer-key witness at composed scale: authored `{10, 2}` arrives
/// V8-ordered, so the row carries the observed object, which survives JSON
/// transport as-is (15-shape pins the authored pairs instead).
pub(crate) fn integer_probes() -> Vec<AuthoredDeclaration> {
    let pairs = [
        ("10".to_string(), json!("red")),
        ("2".to_string(), json!("blue")),
    ];
    vec![decl(&[], "color", v8_ordered_value(&pairs), false)]
}
