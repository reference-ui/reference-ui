//! Body-expression lowering for the pure-helper fence (SPEC-V2-39).
//!
//! `lower_expr` maps one body, default, or key expression to the closed
//! [`PureExpr`] IR, baking non-param identifiers to scope-folded values at
//! lower time. The match is total over v2's admitted body forms — literals,
//! wrappers, params, captures, templates, operators, objects, arrays, member
//! reads — and returns `None` for everything else: calls, `this`,
//! assignment, `new`, `await`, classes, and unknown syntax. `bake_capture`
//! is shared with call-argument folding so captures mean the same thing in
//! bodies and at call sites.

use oxc_ast::ast::{
    ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKey, PropertyKind,
};

use super::fence::{FenceArrayElem, FenceKey, FenceValue, LowerCtx, PureExpr};
use crate::atom::AtomValue;
use crate::extract::constants::{ConstArrayElement, ConstObject};
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// Lower one expression to closed IR, or refuse what the fence excludes.
pub(crate) fn lower_expr(expr: &Expression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    if let Some(lit) = lower_lit(expr) {
        return Some(lit);
    }
    if let Some(unwrapped) = lower_unwrap(expr, ctx) {
        return Some(unwrapped);
    }
    if let Some(value) = lower_leaf(expr, ctx) {
        return Some(value);
    }
    if let Some(value) = lower_operator(expr, ctx) {
        return Some(value);
    }
    if let Some(value) = lower_collection(expr, ctx) {
        return Some(value);
    }
    lower_access(expr, ctx)
}

/// Lower the four literal forms to single-leaf values.
fn lower_lit(expr: &Expression<'_>) -> Option<PureExpr> {
    let leaf = match expr {
        Expression::StringLiteral(lit) => AtomValue::String(lit.value.as_str().into()),
        Expression::NumericLiteral(lit) => AtomValue::Number(lit.value.to_string().into()),
        Expression::BooleanLiteral(lit) => AtomValue::Bool(lit.value),
        Expression::NullLiteral(_) => AtomValue::Null,
        _ => return None,
    };
    Some(PureExpr::Value(FenceValue::Leaves(vec![leaf])))
}

/// Lower through transparent wrappers to the inner expression.
fn lower_unwrap(expr: &Expression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    let inner = unwrap_wrapper_target(expr)?;
    lower_expr(inner, ctx)
}

/// Lower identifiers and templates: params, baked captures, and parts.
fn lower_leaf(expr: &Expression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    match expr {
        Expression::Identifier(ident) => lower_ident(ident.name.as_str(), ctx),
        Expression::TemplateLiteral(lit) => lower_template(lit, ctx),
        _ => None,
    }
}

/// Lower the three operator families.
fn lower_operator(expr: &Expression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    use super::fence_lower_ops::{lower_binary, lower_logical, lower_unary};
    match expr {
        Expression::BinaryExpression(binary) => lower_binary(binary, ctx),
        Expression::UnaryExpression(unary) => lower_unary(unary, ctx),
        Expression::LogicalExpression(logical) => lower_logical(logical, ctx),
        _ => None,
    }
}

/// Lower ternaries, objects, and arrays.
fn lower_collection(expr: &Expression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    match expr {
        Expression::ConditionalExpression(cond) => {
            super::fence_lower_ops::lower_conditional(cond, ctx)
        }
        Expression::ObjectExpression(obj) => lower_object(obj, ctx),
        Expression::ArrayExpression(arr) => lower_array(arr, ctx),
        _ => None,
    }
}

/// Lower static and computed member reads; everything else refuses.
fn lower_access(expr: &Expression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    match expr {
        Expression::StaticMemberExpression(member) => lower_member(member, ctx),
        Expression::ComputedMemberExpression(member) => lower_index(member, ctx),
        _ => None,
    }
}

/// Lower an identifier: a param index, baked capture leaves, or refuse.
/// Free `undefined` bakes to null, verbatim v2; every other free name fails.
fn lower_ident(name: &str, ctx: &LowerCtx) -> Option<PureExpr> {
    if let Some(index) = ctx.params.iter().position(|param| param.as_ref() == name) {
        return Some(PureExpr::Param(index));
    }
    if name == "undefined" {
        let null = FenceValue::Leaves(vec![AtomValue::Null]);
        return Some(PureExpr::Value(null));
    }
    bake_capture(name, ctx.scoped).map(PureExpr::Value)
}

/// Lower a template: cooked quasis (raw on invalid escapes) plus parts.
fn lower_template(lit: &oxc_ast::ast::TemplateLiteral<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    let mut quasis = Vec::with_capacity(lit.quasis.len());
    for quasi in &lit.quasis {
        let text = quasi
            .value
            .cooked
            .as_deref()
            .unwrap_or(quasi.value.raw.as_str());
        quasis.push(Box::from(text));
    }
    let mut parts = Vec::with_capacity(lit.expressions.len());
    for part in &lit.expressions {
        parts.push(lower_expr(part, ctx)?);
    }
    Some(PureExpr::Template { quasis, parts })
}

/// Lower an object: init-only entries, no spreads, no methods or accessors.
fn lower_object(obj: &oxc_ast::ast::ObjectExpression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    let mut entries = Vec::with_capacity(obj.properties.len());
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        if prop.method || prop.kind != PropertyKind::Init {
            return None;
        }
        let key = lower_key(&prop.key, prop.computed, ctx)?;
        let value = lower_entry_value(prop, &key, ctx)?;
        entries.push((key, value));
    }
    Some(PureExpr::Object(entries))
}

/// Lower one entry value, resolving shorthand through params or captures.
fn lower_entry_value(
    prop: &oxc_ast::ast::ObjectProperty<'_>,
    key: &FenceKey,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    if !prop.shorthand {
        return lower_expr(&prop.value, ctx);
    }
    let FenceKey::Static(name) = key else {
        return None;
    };
    lower_shorthand(name, ctx)
}

/// Lower a shorthand value: the param slot, or the baked capture.
fn lower_shorthand(name: &str, ctx: &LowerCtx) -> Option<PureExpr> {
    if let Some(index) = ctx.params.iter().position(|param| param.as_ref() == name) {
        return Some(PureExpr::Param(index));
    }
    bake_capture(name, ctx.scoped).map(PureExpr::Value)
}

/// Lower a key: static spellings direct, computed keys through the lowerer.
fn lower_key(key: &PropertyKey<'_>, computed: bool, ctx: &LowerCtx) -> Option<FenceKey> {
    if computed {
        let expr = key.as_expression()?;
        return Some(FenceKey::Computed(lower_expr(expr, ctx)?));
    }
    static_key(key)
}

/// Lower a static key spelling: identifiers, strings, and stringified numbers.
fn static_key(key: &PropertyKey<'_>) -> Option<FenceKey> {
    match key {
        PropertyKey::StaticIdentifier(id) => Some(FenceKey::Static(id.name.as_str().into())),
        PropertyKey::StringLiteral(lit) => Some(FenceKey::Static(lit.value.as_str().into())),
        PropertyKey::NumericLiteral(lit) => {
            let text = super::unary::canon_number(lit.value);
            Some(FenceKey::Static(text))
        }
        _ => None,
    }
}

/// Lower an array: elements lower, holes bake to null, spreads refuse.
fn lower_array(arr: &oxc_ast::ast::ArrayExpression<'_>, ctx: &LowerCtx) -> Option<PureExpr> {
    let mut items = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        items.push(lower_array_elem(elem, ctx)?);
    }
    Some(PureExpr::Array(items))
}

/// Lower one array element: a value, a hole, or a refused spread.
fn lower_array_elem(elem: &ArrayExpressionElement<'_>, ctx: &LowerCtx) -> Option<FenceArrayElem> {
    match elem {
        ArrayExpressionElement::SpreadElement(_) => None,
        ArrayExpressionElement::Elision(_) => Some(FenceArrayElem::Hole),
        _ => {
            let expr = elem.as_expression()?;
            Some(FenceArrayElem::Elem(lower_expr(expr, ctx)?))
        }
    }
}

/// Lower a static member read; optional links refuse.
fn lower_member(
    member: &oxc_ast::ast::StaticMemberExpression<'_>,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    if member.optional {
        return None;
    }
    let object = lower_expr(&member.object, ctx)?;
    Some(PureExpr::Member {
        object: Box::new(object),
        prop: member.property.name.as_str().into(),
    })
}

/// Lower a computed read; optional links refuse.
fn lower_index(
    member: &oxc_ast::ast::ComputedMemberExpression<'_>,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    if member.optional {
        return None;
    }
    let object = lower_expr(&member.object, ctx)?;
    let index = lower_expr(&member.expression, ctx)?;
    Some(PureExpr::Index {
        object: Box::new(object),
        index: Box::new(index),
    })
}

/// Bake a capture name to its scope-folded value: scalar leaves first, then
/// a const object, then a const array. Mutated names answer empty through
/// the lookups, so a capture of a reassigned binding refuses cleanly.
pub(crate) fn bake_capture(name: &str, scoped: Scoped<'_>) -> Option<FenceValue> {
    let leaves = scoped.scalar_leaves(name);
    if !leaves.is_empty() {
        return Some(FenceValue::Leaves(leaves.to_vec()));
    }
    if let Some(obj) = scoped.object(name) {
        return Some(const_object_value(obj));
    }
    if let Some(elements) = scoped.array(name) {
        return Some(const_array_value(elements));
    }
    None
}

/// Convert a recorded const object to a fence value, skipping dynamic
/// entries the way v2's lenient object rule skips unresolvable members.
pub(crate) fn const_object_value(obj: &ConstObject) -> FenceValue {
    let mut entries = Vec::with_capacity(obj.len());
    for (key, prop) in obj.iter() {
        if prop.is_empty() {
            continue;
        }
        if !prop.leaves.is_empty() {
            entries.push((
                Box::from(key.as_str()),
                FenceValue::Leaves(prop.leaves.clone()),
            ));
        } else {
            entries.push((Box::from(key.as_str()), const_object_value(&prop.nested)));
        }
    }
    FenceValue::Object(entries)
}

/// Convert recorded const-array elements, mapping holes to null leaves.
pub(crate) fn const_array_value(elements: &[ConstArrayElement]) -> FenceValue {
    let mut out = Vec::with_capacity(elements.len());
    for element in elements {
        match element {
            ConstArrayElement::Leaf(leaf) => {
                out.push(FenceValue::Leaves(vec![leaf.clone()]));
            }
            ConstArrayElement::Hole => {
                out.push(FenceValue::Leaves(vec![AtomValue::Null]));
            }
            ConstArrayElement::Object(map) => {
                let entries = map
                    .iter()
                    .map(|(key, leaf)| {
                        (
                            Box::from(key.as_str()),
                            FenceValue::Leaves(vec![leaf.clone()]),
                        )
                    })
                    .collect();
                out.push(FenceValue::Object(entries));
            }
        }
    }
    FenceValue::Array(out)
}
