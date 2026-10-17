//! Const array and object-element recording for the constant collector. A const array records only
//! when every element is a literal, a static literal-entry object, or a hole; any spread,
//! identifier, or dynamic element refuses the whole array so the use site never reads a partial
//! list. Takes oxc array and object expressions and emits `ConstArrayElement` values, with object
//! elements carried as entry maps keyed by static property name.

use std::collections::BTreeMap;

use oxc_ast::ast::{ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKey};

use super::leaves::{literal_leaf, unwrap_expression};
use crate::atom::AtomValue;
use crate::extract::constants::ConstArrayElement;

/// The recorded elements of a const array init, or None when any element
/// is not a literal, a literal-entry object, or a hole. Identifier and
/// spread elements stay unrecorded (SPEC-V2-34 const-graph depth), so the
/// binding shadows instead of resolving to a partial array.
pub(super) fn array_elements(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
) -> Option<Vec<ConstArrayElement>> {
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
        return object_element_map(obj).map(ConstArrayElement::Object);
    }
    None
}

/// The literal entries of an object nested in a const array init, or None
/// when any entry is a spread, a computed key, or a non-literal value — the
/// whole array stays unrecorded so the use site refuses with a diagnostic
/// instead of spreading a partial object.
fn object_element_map(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
) -> Option<BTreeMap<String, AtomValue>> {
    let mut leaves = BTreeMap::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        let key = resolve_property_key(&prop.key)?;
        let leaf = literal_leaf(unwrap_expression(&prop.value))?;
        leaves.insert(key, leaf);
    }
    Some(leaves)
}

fn resolve_property_key(key: &PropertyKey<'_>) -> Option<String> {
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
