//! Constant folding for style-object property keys, shared by every object walker.
//!
//! `fold_property_key` lowers one key to its static spelling when the key is a
//! literal or resolves through the scope chain to a single scalar leaf, and
//! refuses anything else so the caller warns `UnfoldableKey` with its siblings
//! kept. The single-leaf rule is deliberate: a key that fans out to two names
//! is genuinely ambiguous, so it refuses instead of guessing. Helper-call
//! keys fold through the pure-helper fence (entry 40) and binary keys
//! through the shared binary node (entry 64); interpolated-template keys
//! still refuse — no station pins them yet.

use oxc_ast::ast::{Expression, PropertyKey, StaticMemberExpression, TemplateLiteral};

use super::binary::fold_binary;
use super::element::fold_element_access;
use super::unary::fold_unary;
use crate::atom::AtomValue;
/// The canonical numeric-key spelling, shared with the const recorders.
pub use crate::extract::constants::canonical_numeric_key;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// Fold a property key to its static spelling, or None when dynamic.
///
/// Static spellings resolve without scope; identifier, member, element, and
/// unary keys resolve through the scope chain and need exactly one leaf.
pub fn fold_property_key(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
    if let Some(spelling) = fold_key_literal(key) {
        return Some(spelling);
    }
    match key {
        PropertyKey::TemplateLiteral(lit) => static_template_key(lit),
        PropertyKey::Identifier(ident) => {
            // [k]:  after  const k = 'color'
            fold_key_identifier(ident.name.as_str(), scoped)
        }
        PropertyKey::StaticMemberExpression(mem) => {
            // [theme.primary]:
            fold_key_member(mem, scoped)
        }
        _ => fold_key_computed(key, scoped),
    }
}

/// Computed keys that read an element, apply an operator or call, or wrap one of those.
fn fold_key_computed(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
    match key {
        PropertyKey::ComputedMemberExpression(mem) => {
            // [sizes[1]]:
            fold_key_element(&mem.object, &mem.expression, scoped)
        }
        PropertyKey::UnaryExpression(unary) => {
            // [-n]:
            fold_key_unary(unary, scoped)
        }
        PropertyKey::BinaryExpression(bin) => {
            // ['col'+'or']:
            fold_key_binary(bin, scoped)
        }
        PropertyKey::CallExpression(call) => {
            // [gh('cool')]:
            fold_key_call(call, scoped)
        }
        _ => fold_key_wrapped_property(key, scoped),
    }
}

/// Fold literal key spellings, or None for every other form.
fn fold_key_literal(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // color:  /  _hover:
            Some(ident.name.to_string())
        }
        PropertyKey::StringLiteral(lit) => {
            // 'color':  /  ['color']:
            Some(lit.value.to_string())
        }
        PropertyKey::NumericLiteral(lit) => {
            // 300:  /  [42]:
            Some(canonical_numeric_key(lit.value))
        }
        _ => None,
    }
}

/// Fold the wrapper spellings of a computed key, or None for anything else.
///
/// Interpolated templates and exotic literals stay dynamic here; their fold
/// nodes extend this match when a station pins them.
fn fold_key_wrapped_property(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
    // [(k)]:
    let inner = wrapped_key_expression(key)?;
    fold_key_expression(inner, scoped)
}

/// The expression a wrapper key holds, for parentheses, casts, and TS assertions.
pub(super) fn wrapped_key_expression<'a, 'b>(
    key: &'b PropertyKey<'a>,
) -> Option<&'b Expression<'a>> {
    cast_wrapped_expression(key).or_else(|| assertion_wrapped_expression(key))
}

/// Parentheses and the `as` / `satisfies` casts around a key expression.
fn cast_wrapped_expression<'a, 'b>(key: &'b PropertyKey<'a>) -> Option<&'b Expression<'a>> {
    match key {
        PropertyKey::ParenthesizedExpression(paren) => Some(&paren.expression),
        PropertyKey::TSAsExpression(cast) => Some(&cast.expression),
        PropertyKey::TSSatisfiesExpression(sat) => Some(&sat.expression),
        _ => None,
    }
}

/// Non-null, angle-bracket, and instantiation assertions around a key expression.
fn assertion_wrapped_expression<'a, 'b>(key: &'b PropertyKey<'a>) -> Option<&'b Expression<'a>> {
    match key {
        PropertyKey::TSNonNullExpression(non_null) => Some(&non_null.expression),
        PropertyKey::TSTypeAssertion(assertion) => Some(&assertion.expression),
        PropertyKey::TSInstantiationExpression(instantiation) => Some(&instantiation.expression),
        _ => None,
    }
}

/// Fold a key-position expression: the wrapper-inner half of key folding.
fn fold_key_expression(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<String> {
    if let Some(spelling) = fold_key_expr_literal(expr) {
        return Some(spelling);
    }
    match expr {
        Expression::TemplateLiteral(lit) => static_template_key(lit),
        Expression::Identifier(ident) => fold_key_identifier(ident.name.as_str(), scoped),
        Expression::StaticMemberExpression(mem) => fold_key_member(mem, scoped),
        _ => fold_key_derived_expression(expr, scoped),
    }
}

/// Key expressions built from an element read, an operator, or a call, or a wrapper around one.
fn fold_key_derived_expression(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<String> {
    match expr {
        Expression::ComputedMemberExpression(mem) => {
            fold_key_element(&mem.object, &mem.expression, scoped)
        }
        Expression::UnaryExpression(unary) => fold_key_unary(unary, scoped),
        Expression::BinaryExpression(bin) => fold_key_binary(bin, scoped),
        Expression::CallExpression(call) => fold_key_call(call, scoped),
        _ => fold_key_unwrapped(expr, scoped),
    }
}

/// A transparent wrapper folds as its inner expression; anything else refuses.
fn fold_key_unwrapped(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<String> {
    let inner = unwrap_wrapper_target(expr)?;
    fold_key_expression(inner, scoped)
}

/// Fold literal key-position spellings, or None for every other form.
fn fold_key_expr_literal(expr: &Expression<'_>) -> Option<String> {
    match expr {
        Expression::StringLiteral(lit) => Some(lit.value.to_string()),
        Expression::NumericLiteral(lit) => Some(canonical_numeric_key(lit.value)),
        Expression::BooleanLiteral(lit) => Some(lit.value.to_string()),
        Expression::NullLiteral(_) => Some("null".to_string()),
        _ => None,
    }
}

/// A static template key (`` [`color`] ``), or None when interpolated.
fn static_template_key(lit: &TemplateLiteral<'_>) -> Option<String> {
    if !lit.expressions.is_empty() {
        return None;
    }
    lit.quasis.first().map(|q| q.value.raw.to_string())
}

/// An identifier key over exactly one const leaf, or None when ambiguous.
fn fold_key_identifier(name: &str, scoped: Scoped<'_>) -> Option<String> {
    if name == "undefined" || name == "null" {
        // [undefined]:  — the name is the key, as in JS
        return Some(name.to_string());
    }
    let leaves = scoped.scalar_leaves(name);
    if leaves.len() != 1 {
        return None;
    }
    leaf_key(&leaves[0])
}

/// A one-hop member key (`[theme.primary]`) over exactly one leaf, else None.
fn fold_key_member(mem: &StaticMemberExpression<'_>, scoped: Scoped<'_>) -> Option<String> {
    if let Expression::Identifier(obj) = &mem.object {
        let leaves = scoped.object_prop_leaves(obj.name.as_str(), mem.property.name.as_str());
        if leaves.len() == 1 {
            return leaf_key(&leaves[0]);
        }
    }
    None
}

/// An element key (`[sizes[1]]`) with exactly one clean leaf, else None.
fn fold_key_element(
    object: &Expression<'_>,
    index: &Expression<'_>,
    scoped: Scoped<'_>,
) -> Option<String> {
    let fold = fold_element_access(object, index, scoped);
    if fold.values.len() == 1 && fold.refusals.is_empty() {
        return leaf_key(&fold.values[0]);
    }
    None
}

/// A unary key (`[-n]`) with exactly one folded leaf, else None.
fn fold_key_unary(unary: &oxc_ast::ast::UnaryExpression<'_>, scoped: Scoped<'_>) -> Option<String> {
    let fold = fold_unary(unary.operator, &unary.argument, scoped);
    if fold.values.len() != 1
        || !fold.refusals.is_empty()
        || !fold.template_refusals.is_empty()
        || !fold.dynamic.is_empty()
    {
        return None;
    }
    leaf_key(&fold.values[0])
}

/// A binary key (`['col'+'or']`) with exactly one clean leaf, else None.
///
/// Multi-leaf binaries are ambiguous, so they refuse instead of guessing —
/// the same single-spelling rule every computed key uses.
fn fold_key_binary(bin: &oxc_ast::ast::BinaryExpression<'_>, scoped: Scoped<'_>) -> Option<String> {
    let fold = fold_binary(bin.operator, &bin.left, &bin.right, scoped);
    if fold.values.len() != 1
        || !fold.refusals.is_empty()
        || !fold.unary_refusals.is_empty()
        || !fold.template_refusals.is_empty()
        || !fold.dynamic.is_empty()
    {
        return None;
    }
    leaf_key(&fold.values[0])
}

/// A helper-call key (`[gh('cool')]`) with exactly one clean leaf, else None.
///
/// Refused fragments fail the key whole: a key that dropped an arm is
/// ambiguous, so it refuses instead of guessing.
fn fold_key_call(call: &oxc_ast::ast::CallExpression<'_>, scoped: Scoped<'_>) -> Option<String> {
    let fold = super::call::fold_pure_call(call, scoped);
    if !fold.refusals.is_empty() {
        return None;
    }
    let super::fence::FenceValue::Leaves(leaves) = fold.value? else {
        return None;
    };
    if leaves.len() != 1 {
        return None;
    }
    leaf_key(&leaves[0])
}

/// The key spelling of one scalar leaf, or None for token references.
fn leaf_key(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(s) => Some(s.to_string()),
        AtomValue::Number(n) => Some(n.to_string()),
        AtomValue::Bool(b) => Some(b.to_string()),
        AtomValue::Null => Some("null".to_string()),
        AtomValue::Token { .. } => None,
    }
}
