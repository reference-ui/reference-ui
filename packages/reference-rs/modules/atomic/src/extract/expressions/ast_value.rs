//! AST expression conversion to structured JSON values for authored declaration capture.
//! Traverses JavaScript expressions before compiler lowering to preserve authored values.
//! Supports literals, arrays with null holes, rhythm objects, unary negatives, and scoped bindings.
//! Emits None for dynamic, non-constant expressions that cannot be captured as static plans.

use oxc_ast::ast::{
    ArrayExpressionElement, ChainElement, ComputedMemberExpression, Expression, ObjectPropertyKind,
    UnaryOperator,
};
use serde_json::{json, Map, Value};

use crate::atom::AtomValue;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

mod leaves;

pub use leaves::ast_to_json_values;

/// Convert an AST expression into a JSON value and inline important flag.
pub fn ast_to_json_value(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    if let Some(res) = convert_literal(expr, scoped) {
        return Some(res);
    }
    if let Some(res) = convert_wrapper(expr, scoped) {
        return Some(res);
    }
    convert_compound(expr, scoped)
}

fn convert_literal(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    if let Expression::StringLiteral(lit) = expr {
        let (clean, imp) = super::literal::split_important_flag(lit.value.as_str());
        return Some((Value::String(clean.to_string()), imp));
    }
    if let Expression::NumericLiteral(lit) = expr {
        let val = if (lit.value - lit.value.round()).abs() < 1e-9 {
            json!(lit.value as i64)
        } else {
            json!(lit.value)
        };
        return Some((val, false));
    }
    if let Expression::BooleanLiteral(lit) = expr {
        return Some((Value::Bool(lit.value), false));
    }
    if let Expression::NullLiteral(_) = expr {
        return Some((Value::Null, false));
    }
    if let Expression::TemplateLiteral(lit) = expr {
        return convert_template(lit, scoped);
    }
    None
}

fn convert_wrapper(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    if let Expression::ParenthesizedExpression(p) = expr {
        return ast_to_json_value(&p.expression, scoped);
    }
    if let Expression::TSAsExpression(as_expr) = expr {
        return ast_to_json_value(&as_expr.expression, scoped);
    }
    if let Expression::TSSatisfiesExpression(sat) = expr {
        return ast_to_json_value(&sat.expression, scoped);
    }
    if let Expression::TSNonNullExpression(non_null) = expr {
        // '2r'!  — transparent, exactly like the want walker (GAP-05b)
        return ast_to_json_value(&non_null.expression, scoped);
    }
    if let Expression::TSTypeAssertion(assertion) = expr {
        // <string>'2r'  (.ts only) — assertions erase, like `as`
        return ast_to_json_value(&assertion.expression, scoped);
    }
    if let Expression::TSInstantiationExpression(instantiation) = expr {
        // w<string>  — type arguments erase, like `as`
        return ast_to_json_value(&instantiation.expression, scoped);
    }
    None
}

fn convert_compound(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    match expr {
        Expression::ArrayExpression(arr) => convert_array(arr, scoped),
        Expression::ObjectExpression(obj) => convert_object(obj, scoped),
        Expression::Identifier(ident) => convert_identifier(ident.name.as_str(), scoped),
        _ => convert_operation(expr, scoped),
    }
}

/// Single values of operator shapes: unary and binary expressions.
fn convert_operation(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    match expr {
        Expression::UnaryExpression(unary) => convert_unary(unary, scoped),
        Expression::BinaryExpression(binary) => convert_binary(binary, scoped),
        _ => convert_access(expr, scoped),
    }
}

/// Single values of access shapes: computed members, chains, and calls.
fn convert_access(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    match expr {
        Expression::ComputedMemberExpression(mem) => convert_computed_member(mem, scoped),
        Expression::ChainExpression(chain) => convert_chain(chain, scoped),
        Expression::CallExpression(call) => convert_call(call, scoped),
        _ => None,
    }
}

/// A `token()` call's planned leaf: the folded reference or path-plus-fallback
/// token, exactly like the want walker. Anything else plans nothing.
pub(super) fn convert_token_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    let fold = crate::extract::fold::fold_token_call(call, scoped)?;
    let value = fold.value?;
    atom_value_to_json(&value).map(|val| (val, false))
}

/// A call's planned leaf: a `token()` reference first, else the first fold
/// of a pure-helper call, mirroring the want walker's value lowering.
pub(super) fn convert_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    if let Some(token) = convert_token_call(call, scoped) {
        return Some(token);
    }
    let fold = crate::extract::fold::fold_pure_call(call, scoped);
    let value = fold.value?;
    crate::extract::fold::call_value_to_json(&value).map(|val| (val, false))
}

fn convert_array(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    let mut elements = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        if let ArrayExpressionElement::SpreadElement(spread) = elem {
            // padding: ['1px', ...['2px'], '4px']  — spliced in place
            elements.extend(spread_array_json(&spread.argument, scoped)?);
        } else {
            elements.push(array_elem_to_json(elem, scoped)?);
        }
    }
    Some((Value::Array(elements), false))
}

/// The planned values of one array spread: an inline array's elements or a
/// const array's recorded elements, spliced in place. Dynamic spreads and
/// object elements plan nothing — the want walker refuses those arrays too.
fn spread_array_json(arg: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<Value>> {
    let mut arg = arg;
    while let Some(inner) = unwrap_wrapper_target(arg) {
        // ...([1, 2])  /  ...(sizes as const)
        arg = inner;
    }
    if let Expression::ArrayExpression(arr) = arg {
        return spread_inline_json(arr, scoped);
    }
    if let Expression::Identifier(ident) = arg {
        return spread_const_json(ident.name.as_str(), scoped);
    }
    None
}

/// The planned values of an inline array spread, recursing through nesting.
fn spread_inline_json(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<Vec<Value>> {
    let mut out = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        if let ArrayExpressionElement::SpreadElement(spread) = elem {
            out.extend(spread_array_json(&spread.argument, scoped)?);
        } else {
            out.push(array_elem_to_json(elem, scoped)?);
        }
    }
    Some(out)
}

/// The planned values of a const-array spread: leaves convert, holes null.
fn spread_const_json(name: &str, scoped: Scoped<'_>) -> Option<Vec<Value>> {
    scoped.array(name)?.iter().map(const_element_json).collect()
}

/// One recorded const-array element as JSON: a hole is null, an object element refuses the spread.
fn const_element_json(element: &ConstArrayElement) -> Option<Value> {
    match element {
        // Spliced leaves strip `!` exactly like inline elements; the flag
        // drops with them (array_elem_to_json keeps none either).
        ConstArrayElement::Leaf(leaf) => folded_value_to_json(leaf).map(|(val, _)| val),
        ConstArrayElement::Hole => Some(Value::Null),
        ConstArrayElement::Object(_) => None,
    }
}

fn array_elem_to_json(elem: &ArrayExpressionElement<'_>, scoped: Scoped<'_>) -> Option<Value> {
    match elem {
        ArrayExpressionElement::Elision(_) => Some(Value::Null),
        _ => {
            let expr = elem.as_expression()?;
            let (v, _) = ast_to_json_value(expr, scoped)?;
            Some(v)
        }
    }
}

fn convert_object(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    let mut map = Map::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        // width: { [bp]: '50px' }  — keys fold exactly like the want walker
        let key = crate::extract::fold::fold_property_key(&prop.key, scoped)?;
        let (v, _) = ast_to_json_value(&prop.value, scoped)?;
        map.insert(key, v);
    }
    Some((Value::Object(map), false))
}

/// The first joined string of a folded template; refused templates plan nothing.
fn convert_template(
    lit: &oxc_ast::ast::TemplateLiteral<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    // Single-valued positions take the first fold, mirroring convert_unary.
    let fold = crate::extract::fold::fold_template(lit, scoped);
    let first = fold.values.first()?;
    let (clean, imp) = super::literal::split_important_flag(first);
    Some((Value::String(clean.to_string()), imp))
}

fn number_atom_to_json(n: &str) -> Value {
    if let Ok(i) = n.parse::<i64>() {
        json!(i)
    } else if let Ok(f) = n.parse::<f64>() {
        json!(f)
    } else {
        Value::String(n.to_string())
    }
}

pub(crate) fn atom_value_to_json(val: &AtomValue) -> Option<Value> {
    match val {
        AtomValue::String(s) => Some(Value::String(s.to_string())),
        AtomValue::Number(n) => Some(number_atom_to_json(n)),
        AtomValue::Bool(b) => Some(Value::Bool(*b)),
        AtomValue::Null => Some(Value::Null),
        AtomValue::Token { path, value } => Some(json!({
            "$token": {"path": path.as_ref(), "value": value.as_ref()}
        })),
    }
}

pub(super) fn convert_identifier(name: &str, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    if name == "undefined" || name == "null" {
        return Some((Value::Null, false));
    }
    let atom_val = scoped.scalar(name)?;
    folded_value_to_json(atom_val)
}

pub(super) fn convert_unary(
    unary: &oxc_ast::ast::UnaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    if unary.operator == UnaryOperator::Void {
        return Some((Value::Null, false));
    }
    // Single-valued positions take the first folded leaf, mirroring convert_identifier.
    let fold = crate::extract::fold::fold_unary(unary.operator, &unary.argument, scoped);
    let first = fold.values.first()?;
    atom_value_to_json(first).map(|val| (val, false))
}

pub(super) fn convert_binary(
    binary: &oxc_ast::ast::BinaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    // Single-valued positions take the first folded pair, mirroring convert_unary.
    let fold =
        crate::extract::fold::fold_binary(binary.operator, &binary.left, &binary.right, scoped);
    let first = fold.values.first()?;
    folded_value_to_json(first)
}

/// One folded leaf as its plan value: strings split `!important` like the
/// want walker, so folded plans and wants agree leaf-for-leaf.
pub(super) fn folded_value_to_json(val: &AtomValue) -> Option<(Value, bool)> {
    if let AtomValue::String(text) = val {
        let (clean, imp) = super::literal::split_important_flag(text);
        return Some((Value::String(clean.to_string()), imp));
    }
    atom_value_to_json(val).map(|json| (json, false))
}

/// The first folded leaf of an element access; refused reads plan nothing.
pub(super) fn convert_computed_member(
    mem: &ComputedMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    // Single-valued positions take the first fold, mirroring convert_unary.
    let fold = crate::extract::fold::fold_element_access(&mem.object, &mem.expression, scoped);
    let first = fold.values.first()?;
    folded_value_to_json(first)
}

/// The first folded leaf of a chain; unfoldable chains plan nothing.
pub(super) fn convert_chain(
    chain: &oxc_ast::ast::ChainExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    if let ChainElement::ComputedMemberExpression(mem) = &chain.expression {
        return convert_computed_member(mem, scoped);
    }
    // tokens?.color  — the first fold, mirroring convert_unary
    let first = crate::extract::fold::fold_chain(chain, scoped)
        .into_iter()
        .next()?;
    folded_value_to_json(&first)
}
