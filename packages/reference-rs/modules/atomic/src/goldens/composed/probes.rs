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
