//! Static values of binding initializers: what a declarator carries.
//! An identifier declarator carries its init when the init is a literal, a
//! const object (literals, branching leaves, nested entries), a
//! literal-element const array, or a branching form with literal leaves —
//! the same shapes the project bag indexes, so locals resolve exactly as
//! they did before scope. Transparent wrappers (parens, `as`, `satisfies`,
//! `!`) peel off first. Anything else carries nothing and shadows instead.

use std::collections::BTreeMap;

use oxc_ast::ast::{ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKey};

use super::binding::BindingInit;
use crate::atom::AtomValue;
use crate::extract::constants::{object_entries, ConstArrayElement};
use crate::extract::expressions::walk::is_guard_expression;

/// The static value of an initializer: a literal, an object, an array, or branch leaves.
pub fn binding_init(expr: &Expression<'_>) -> Option<BindingInit> {
    let expr = unwrap_expression(expr);
    // const space = '2r'
    if let Some(leaf) = literal_leaf(expr) {
        return Some(BindingInit::Scalars(vec![leaf]));
    }
    // const theme = { primary: 'n300' }
    if let Expression::ObjectExpression(obj) = expr {
        return Some(BindingInit::Object(object_entries(obj)));
    }
    // const sizes = ['2px', '4px']
    if let Expression::ArrayExpression(arr) = expr {
        return array_leaves(arr).map(BindingInit::Array);
    }
    // const tone = flag ? 'red.500' : 'blue.500'
    if matches!(
        expr,
        Expression::ConditionalExpression(_) | Expression::LogicalExpression(_)
    ) {
        let mut leaves = Vec::new();
        collect_branching_leaves(expr, &mut leaves);
        return Some(BindingInit::Scalars(leaves));
    }
    None
}

/// Scoop every literal leaf of a branching initializer, mirroring the want
/// walker leaf-for-leaf: both ternary arms, non-guard logical operands.
fn collect_branching_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>) {
    let unwrapped = unwrap_expression(expr);
    if collect_conditional_leaves(unwrapped, out) {
        return;
    }
    if collect_logical_leaves(unwrapped, out) {
        return;
    }
    if let Some(atom) = literal_leaf(unwrapped) {
        out.push(atom);
    }
}

/// Scoop both arms of a ternary initializer, or false when not a ternary.
fn collect_conditional_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>) -> bool {
    let Expression::ConditionalExpression(cond) = expr else {
        return false;
    };
    collect_branching_leaves(&cond.consequent, out);
    collect_branching_leaves(&cond.alternate, out);
    true
}

/// Scoop the non-guard operands of a logical initializer, or false when not logical.
fn collect_logical_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>) -> bool {
    let Expression::LogicalExpression(log) = expr else {
        return false;
    };
    if !is_guard_expression(&log.left) {
        collect_branching_leaves(&log.left, out);
    }
    if !is_guard_expression(&log.right) {
        collect_branching_leaves(&log.right, out);
    }
    true
}

/// A literal initializer leaf, or None for dynamic shapes.
fn literal_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    match expr {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => {
            Some(AtomValue::Number(n.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// The recorded elements of a const array init, or None when any element
/// is not a literal, a literal-entry object, or a hole.
fn array_leaves(arr: &oxc_ast::ast::ArrayExpression<'_>) -> Option<Vec<ConstArrayElement>> {
    let mut elements = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        elements.push(array_element(elem)?);
    }
    Some(elements)
}

/// One recorded array element, or None for dynamic shapes.
fn array_element(elem: &ArrayExpressionElement<'_>) -> Option<ConstArrayElement> {
    match elem {
        ArrayExpressionElement::Elision(_) => {
            // const sizes = ['2px', , '8px']
            Some(ConstArrayElement::Hole)
        }
        ArrayExpressionElement::SpreadElement(_) => None,
        _ => array_value_element(elem.as_expression()?),
    }
}

/// One recorded array value element: a literal leaf or a static object.
fn array_value_element(expr: &Expression<'_>) -> Option<ConstArrayElement> {
    let expr = unwrap_expression(expr);
    if let Some(leaf) = literal_leaf(expr) {
        return Some(ConstArrayElement::Leaf(leaf));
    }
    if let Expression::ObjectExpression(obj) = expr {
        return object_leaves(obj).map(ConstArrayElement::Object);
    }
    None
}

/// The literal entries of an object nested in a const array init, or None
/// when any entry is a spread, a computed key, or a non-literal value.
/// Array-element objects stay single-leaf; const-object inits lower through
/// the shared multi-leaf entries instead. Bailing keeps the whole array
/// unrecorded, so the use site refuses with a diagnostic (SPEC-V2-63).
fn object_leaves(obj: &oxc_ast::ast::ObjectExpression<'_>) -> Option<BTreeMap<String, AtomValue>> {
    let mut leaves = BTreeMap::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        let Some(key) = property_key(&prop.key) else {
            return None;
        };
        let Some(leaf) = literal_leaf(unwrap_expression(&prop.value)) else {
            return None;
        };
        leaves.insert(key, leaf);
    }
    Some(leaves)
}

/// A static object key, or None for computed and exotic keys.
fn property_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // { primary: 'n300' }
            Some(ident.name.to_string())
        }
        PropertyKey::StringLiteral(lit) => {
            // { 'primary': 'n300' }
            Some(lit.value.to_string())
        }
        _ => None,
    }
}

/// Peel transparent wrappers (parens, `as`, `satisfies`, `!`) off an init.
fn unwrap_expression<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    match expr {
        Expression::ParenthesizedExpression(p) => {
            // const space = ('2r')
            unwrap_expression(&p.expression)
        }
        Expression::TSAsExpression(as_expr) => {
            // const space = '2r' as const
            unwrap_expression(&as_expr.expression)
        }
        Expression::TSSatisfiesExpression(sat) => {
            // const space = '2r' satisfies string
            unwrap_expression(&sat.expression)
        }
        Expression::TSNonNullExpression(non_null) => {
            // const space = '2r'!
            unwrap_expression(&non_null.expression)
        }
        _ => expr,
    }
}
