//! Constant folding for style-object property keys, shared by every object walker.
//!
//! `fold_property_key` lowers one key to its static spelling when the key is a
//! literal or resolves through the scope chain to a single scalar leaf, and
//! refuses anything else so the caller warns `UnfoldableKey` with its siblings
//! kept. The single-leaf rule is deliberate: a key that fans out to two names
//! is genuinely ambiguous, so it refuses instead of guessing. Helper-call
//! keys fold through the pure-helper fence (entry 40); binary and
//! interpolated-template keys still refuse — no station pins them yet.

use oxc_ast::ast::{Expression, PropertyKey, StaticMemberExpression, TemplateLiteral};

use super::element::fold_element_access;
use super::unary::fold_unary;
use crate::atom::AtomValue;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// Fold a property key to its static spelling, or None when dynamic.
///
/// Static spellings resolve without scope; identifier, member, element, and
/// unary keys resolve through the scope chain and need exactly one leaf.
pub fn fold_property_key(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
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
        PropertyKey::TemplateLiteral(lit) => static_template_key(lit),
        PropertyKey::Identifier(ident) => {
            // [k]:  after  const k = 'color'
            fold_key_identifier(ident.name.as_str(), scoped)
        }
        PropertyKey::StaticMemberExpression(mem) => {
            // [theme.primary]:
            fold_key_member(mem, scoped)
        }
        PropertyKey::ComputedMemberExpression(mem) => {
            // [sizes[1]]:
            fold_key_element(&mem.object, &mem.expression, scoped)
        }
        PropertyKey::UnaryExpression(unary) => {
            // [-n]:
            fold_key_unary(unary, scoped)
        }
        PropertyKey::CallExpression(call) => {
            // [gh('cool')]:
            fold_key_call(call, scoped)
        }
        _ => fold_key_wrapped_property(key, scoped),
    }
}

/// Fold the wrapper spellings of a computed key, or None for anything else.
///
/// Binaries, interpolated templates, and exotic literals stay dynamic here;
/// their fold nodes extend this match when a station pins them.
fn fold_key_wrapped_property(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
    match key {
        PropertyKey::ParenthesizedExpression(paren) => {
            // [(k)]:
            fold_key_expression(&paren.expression, scoped)
        }
        PropertyKey::TSAsExpression(cast) => fold_key_expression(&cast.expression, scoped),
        PropertyKey::TSSatisfiesExpression(sat) => fold_key_expression(&sat.expression, scoped),
        PropertyKey::TSNonNullExpression(non_null) => {
            fold_key_expression(&non_null.expression, scoped)
        }
        PropertyKey::TSTypeAssertion(assertion) => {
            fold_key_expression(&assertion.expression, scoped)
        }
        PropertyKey::TSInstantiationExpression(instantiation) => {
            fold_key_expression(&instantiation.expression, scoped)
        }
        _ => None,
    }
}

/// Fold a key-position expression: the wrapper-inner half of key folding.
fn fold_key_expression(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<String> {
    match expr {
        Expression::StringLiteral(lit) => Some(lit.value.to_string()),
        Expression::NumericLiteral(lit) => Some(canonical_numeric_key(lit.value)),
        Expression::BooleanLiteral(lit) => Some(lit.value.to_string()),
        Expression::NullLiteral(_) => Some("null".to_string()),
        Expression::TemplateLiteral(lit) => static_template_key(lit),
        Expression::Identifier(ident) => fold_key_identifier(ident.name.as_str(), scoped),
        Expression::StaticMemberExpression(mem) => fold_key_member(mem, scoped),
        Expression::ComputedMemberExpression(mem) => {
            fold_key_element(&mem.object, &mem.expression, scoped)
        }
        Expression::UnaryExpression(unary) => fold_key_unary(unary, scoped),
        Expression::CallExpression(call) => fold_key_call(call, scoped),
        _ => {
            if let Some(inner) = unwrap_wrapper_target(expr) {
                return fold_key_expression(inner, scoped);
            }
            None
        }
    }
}

/// A static template key (`` [`color`] ``), or None when interpolated.
fn static_template_key(lit: &TemplateLiteral<'_>) -> Option<String> {
    if !lit.expressions.is_empty() {
        return None;
    }
    lit.quasis.first().map(|q| q.value.raw.to_string())
}

/// The canonical spelling of a numeric key: integers print without decimals.
pub fn canonical_numeric_key(n: f64) -> String {
    // 300:  /  [42]:
    if n.fract() == 0.0 && n.is_finite() {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
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
