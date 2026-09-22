//! Compound style values for independent diagnostics analysis.
//!
//! Builds the queried JSON of responsive arrays and objects: holes bake to
//! `null`, inline and const spreads splice in place, and `!` markers strip
//! exactly where neo strips them — top-level scalars and responsive top
//! leaves — while nested shapes stay byte-raw. Anything unprovable refuses
//! the whole compound: a half-known query value is no expected key.

use oxc_ast::ast::{ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKey};
use serde_json::{Map, Value};

use super::const_values::{atom_to_json, resolve_const_scalar, resolve_member_atom};
use super::values::{classify_unary, number_to_json, unwrap_value, ValueClass, ValueScope};
use crate::extract::constants::ConstArrayElement;

/// One object key as text when statically spelled, else unknown.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum KeyText {
    Known(String),
    Unknown,
}

/// The static spelling of one object key, or unknown for computed keys.
pub fn key_text(key: &PropertyKey<'_>, computed: bool) -> KeyText {
    match super::conditions::static_key(key, computed) {
        super::conditions::KeyClass::Static(text) => KeyText::Known(text),
        super::conditions::KeyClass::Unknown => KeyText::Unknown,
    }
}

/// The queried value of a responsive object (`width: { base, md }`): static
/// keys with exact-or-hole leaves. Importance never escapes: leaf markers
/// strip and the object itself is never important, exactly like neo's
/// `cleanResponsiveObject`.
pub fn responsive_object_value(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    scope: &ValueScope<'_>,
) -> Option<Value> {
    let mut map = Map::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        let KeyText::Known(key) = key_text(&prop.key, prop.computed) else {
            return None;
        };
        map.insert(key, structured_value(&prop.value, scope, true)?);
    }
    Some(Value::Object(map))
}

/// One compound-position value: arrays and objects build raw, holes bake to
/// `null`, and strings split `!` when asked (responsive tops) or stay raw
/// (nested shapes). None refuses the whole compound.
fn structured_value(expr: &Expression<'_>, scope: &ValueScope<'_>, split: bool) -> Option<Value> {
    let expr = unwrap_value(expr);
    if let Some(literal) = structured_literal(expr, split) {
        return Some(literal);
    }
    structured_named(expr, scope, split)
        .or_else(|| structured_nested(expr, scope))
        .or_else(|| structured_fold(expr))
}

/// One compound-position name: identifiers and members resolve, templates
/// need hole-free cooked text.
fn structured_named(expr: &Expression<'_>, scope: &ValueScope<'_>, split: bool) -> Option<Value> {
    match expr {
        Expression::Identifier(ident) => structured_identifier(ident.name.as_str(), scope, split),
        Expression::StaticMemberExpression(_) => {
            let atom = resolve_member_atom(expr, scope)?;
            atom_to_json(&atom, split).map(|(value, _)| value)
        }
        Expression::TemplateLiteral(lit) => structured_template(lit, split),
        _ => None,
    }
}

/// One compound-position nesting: arrays and objects build raw.
fn structured_nested(expr: &Expression<'_>, scope: &ValueScope<'_>) -> Option<Value> {
    match expr {
        Expression::ArrayExpression(arr) => raw_array(arr, scope),
        Expression::ObjectExpression(obj) => raw_object(obj, scope),
        _ => None,
    }
}

/// One compound-position fold: unary nodes map exact and hole leaves.
fn structured_fold(expr: &Expression<'_>) -> Option<Value> {
    let Expression::UnaryExpression(unary) = expr else {
        return None;
    };
    match classify_unary(unary) {
        ValueClass::Exact { value, .. } => Some(value),
        ValueClass::Hole => Some(Value::Null),
        ValueClass::Unknown => None,
    }
}

/// One compound-position literal: strings honor the split flag and every
/// other literal has a fixed reading. None means not a literal.
fn structured_literal(expr: &Expression<'_>, split: bool) -> Option<Value> {
    if let Expression::StringLiteral(lit) = expr {
        return Some(string_literal_value(lit.value.as_str(), split));
    }
    plain_structured_literal(expr)
}

/// One non-string compound literal: numbers, booleans, baked holes.
/// Bigints refuse the whole compound: no exact key is knowable for them.
fn plain_structured_literal(expr: &Expression<'_>) -> Option<Value> {
    match expr {
        Expression::NumericLiteral(lit) => Some(number_to_json(lit.value)),
        Expression::BooleanLiteral(lit) => Some(Value::Bool(lit.value)),
        Expression::NullLiteral(_) => Some(Value::Null),
        _ => None,
    }
}

/// One compound-position string: split `!` for responsive tops, raw nested.
fn string_literal_value(text: &str, split: bool) -> Value {
    if split {
        let (clean, _) = super::const_values::split_important(text);
        Value::String(clean.to_string())
    } else {
        Value::String(text.to_string())
    }
}

/// One compound-position template: its cooked string when hole-free.
fn structured_template(lit: &oxc_ast::ast::TemplateLiteral<'_>, split: bool) -> Option<Value> {
    if lit.expressions.is_empty() && lit.quasis.len() == 1 {
        let cooked = lit.quasis.first().and_then(|quasi| quasi.value.cooked)?;
        return Some(string_literal_value(cooked.as_str(), split));
    }
    None
}

/// One compound-position identifier: holes bake to `null`, const scalars
/// convert, anything else refuses.
fn structured_identifier(name: &str, scope: &ValueScope<'_>, split: bool) -> Option<Value> {
    match name {
        "undefined" | "null" => Some(Value::Null),
        _ => {
            let atom = resolve_const_scalar(name, scope)?;
            atom_to_json(&atom, split).map(|(value, _)| value)
        }
    }
}

/// A raw nested object: static keys with byte-raw leaves. Neo never strips
/// below the responsive top level, so nested strings keep `!` markers.
fn raw_object(obj: &oxc_ast::ast::ObjectExpression<'_>, scope: &ValueScope<'_>) -> Option<Value> {
    let mut map = Map::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        let KeyText::Known(key) = key_text(&prop.key, prop.computed) else {
            return None;
        };
        map.insert(key, structured_value(&prop.value, scope, false)?);
    }
    Some(Value::Object(map))
}

/// A responsive array value, holes baked to `null` and inline or const
/// spreads spliced in place. Dynamic spreads refuse the whole array.
pub fn raw_array(arr: &oxc_ast::ast::ArrayExpression<'_>, scope: &ValueScope<'_>) -> Option<Value> {
    raw_elements(arr, scope).map(Value::Array)
}

/// The raw elements of one array, for values and splices alike.
fn raw_elements(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    scope: &ValueScope<'_>,
) -> Option<Vec<Value>> {
    let mut elements = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        push_raw_element(&mut elements, elem, scope)?;
    }
    Some(elements)
}

/// Push one raw array element: spreads splice, holes bake to `null`.
fn push_raw_element(
    out: &mut Vec<Value>,
    elem: &ArrayExpressionElement<'_>,
    scope: &ValueScope<'_>,
) -> Option<()> {
    match elem {
        ArrayExpressionElement::SpreadElement(spread) => {
            out.extend(spread_array(&spread.argument, scope)?);
        }
        ArrayExpressionElement::Elision(_) => out.push(Value::Null),
        _ => {
            let expr = elem.as_expression()?;
            out.push(structured_value(expr, scope, false)?);
        }
    }
    Some(())
}

/// The spliced values of one array spread: an inline array's elements or a
/// const array's recorded elements. Anything else refuses the spread.
fn spread_array(expr: &Expression<'_>, scope: &ValueScope<'_>) -> Option<Vec<Value>> {
    let expr = unwrap_value(expr);
    if let Expression::ArrayExpression(arr) = expr {
        return raw_elements(arr, scope);
    }
    if let Expression::Identifier(ident) = expr {
        return spread_const(ident.name.as_str(), scope);
    }
    None
}

/// The spliced values of a const-array spread: leaves convert raw, holes
/// bake to `null`, recorded objects refuse (the want walker refuses too).
fn spread_const(name: &str, scope: &ValueScope<'_>) -> Option<Vec<Value>> {
    if scope.is_shadowed(name) || scope.constants.mutation(name).is_some() {
        return None;
    }
    let mut out = Vec::new();
    for element in scope.constants.get_array(name)? {
        out.push(spread_const_element(element)?);
    }
    Some(out)
}

/// One const-array element as its spliced value.
fn spread_const_element(element: &ConstArrayElement) -> Option<Value> {
    match element {
        ConstArrayElement::Leaf(leaf) => atom_to_json(leaf, false).map(|(value, _)| value),
        ConstArrayElement::Hole => Some(Value::Null),
        ConstArrayElement::Object(_) => None,
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{first_prop_value, parse_for_test};
    use super::*;
    use rustc_hash::FxHashSet;

    fn responsive(source: &str) -> Option<Value> {
        let wrapped = format!("css({{ v: {source} }})");
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(&allocator, &wrapped);
        let constants =
            crate::extract::constants::collect_local_constants(&program, "test.ts", Some(&wrapped));
        let shadows: Vec<FxHashSet<String>> = Vec::new();
        let scope = ValueScope {
            constants: &constants,
            shadows: &shadows,
        };
        let value = first_prop_value(&program);
        if let Expression::ObjectExpression(obj) = unwrap_value(value) {
            responsive_object_value(obj, &scope)
        } else {
            None
        }
    }

    #[test]
    fn responsive_objects_strip_top_leaves() {
        assert_eq!(
            responsive("{ base: '50px', md: '60px!' }"),
            Some(serde_json::json!({"base": "50px", "md": "60px"}))
        );
        assert_eq!(
            responsive("{ base: null, md: undefined }"),
            Some(serde_json::json!({"base": null, "md": null}))
        );
        assert_eq!(responsive("{ ...rest }"), None);
        assert_eq!(responsive("{ [k]: 'x' }"), None);
        assert_eq!(responsive("{ base: maybe() }"), None);
    }

    #[test]
    fn bigint_leaves_refuse_the_compound() {
        assert_eq!(responsive("{ base: 10n }"), None);
    }

    #[test]
    fn nested_shapes_stay_raw() {
        assert_eq!(
            responsive("{ base: { x: '1!' } }"),
            Some(serde_json::json!({"base": {"x": "1!"}}))
        );
        assert_eq!(
            responsive("{ base: ['1!'] }"),
            Some(serde_json::json!({"base": ["1!"]}))
        );
    }
}
