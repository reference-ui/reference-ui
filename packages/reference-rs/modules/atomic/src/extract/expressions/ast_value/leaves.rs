//! Multi-leaf AST conversion for authored declarations: every value an expression's wants can take
//! at runtime, not just its single JSON value. Mirrors the want walker leaf for leaf: each ternary
//! arm and non-guard logical operand becomes its own authored value, and folded unary, binary,
//! template, member, and call forms fan out over their leaves. Takes an expression and its scope;
//! emits the `(value, important)` pairs a runtime style plan records. Dynamic forms yield nothing,
//! exactly as they yield no wants.

use oxc_ast::ast::{
    ChainElement, Expression, LogicalExpression, StaticMemberExpression, UnaryOperator,
};
use serde_json::Value;

use super::{ast_to_json_value, atom_value_to_json, convert_token_call, folded_value_to_json};
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// Every planned leaf of a call for multi-valued positions: a `token()`
/// reference first, else every folded leaf of a pure-helper call.
fn convert_call_values(
    call: &oxc_ast::ast::CallExpression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    if let Some(token) = convert_token_call(call, scoped) {
        return vec![token];
    }
    let fold = crate::extract::fold::fold_pure_call(call, scoped);
    fold.value
        .map(|value| crate::extract::fold::call_values_to_json(&value))
        .unwrap_or_default()
}
/// Convert an AST expression into every JSON leaf its wants can take at runtime.
///
/// Mirrors `walk_expression` leaf-for-leaf: each ternary arm and each
/// non-guard logical operand becomes its own authored value, so every want
/// gets a runtime style plan. Single-valued forms delegate to
/// `ast_to_json_value`; dynamic forms yield no leaves, exactly as they
/// yield no wants.
pub fn ast_to_json_values(expr: &Expression<'_>, scoped: Scoped<'_>) -> Vec<(Value, bool)> {
    if is_omitted_leaf(expr) {
        return Vec::new();
    }
    if let Some(branched) = convert_branching(expr, scoped) {
        return branched;
    }
    if let Some(wrapped) = convert_wrapper_values(expr, scoped) {
        return wrapped;
    }
    read_values(expr, scoped)
        .unwrap_or_else(|| ast_to_json_value(expr, scoped).into_iter().collect())
}
/// Leaves of a name or a member read; None when the shape has none of its own.
fn read_values(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    match expr {
        Expression::Identifier(ident) => {
            // borderBottomColor={subtleBorder}  — every static leaf, like the want walker
            let leaves = convert_identifier_leaves(ident.name.as_str(), scoped);
            (!leaves.is_empty()).then_some(leaves)
        }
        Expression::StaticMemberExpression(mem) => Some(convert_static_member_leaves(mem, scoped)),
        _ => operator_values(expr, scoped),
    }
}
/// Leaves of an operator or template; None for every other shape.
fn operator_values(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    match expr {
        // -space  /  !true  — every folded leaf, like the want walker
        Expression::UnaryExpression(unary) => Some(convert_unary_values(unary, scoped)),
        // 1 + 'px'  /  2 * 3  — every folded pair, like the want walker
        Expression::BinaryExpression(binary) => Some(convert_binary_values(binary, scoped)),
        // `${n}px`  — every joined string, like the want walker
        Expression::TemplateLiteral(lit) => Some(convert_template_values(lit, scoped)),
        _ => access_values(expr, scoped),
    }
}
/// Leaves of a computed read, a chain, or a call; None for every other shape.
fn access_values(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    match expr {
        // colors['red']  — every folded leaf, like the want walker
        Expression::ComputedMemberExpression(mem) => Some(convert_computed_member_values(
            &mem.object,
            &mem.expression,
            scoped,
        )),
        Expression::ChainExpression(chain) => Some(convert_chain_values(chain, scoped)),
        // tone('600')  — every folded leaf, like the want walker
        Expression::CallExpression(call) => Some(convert_call_values(call, scoped)),
        _ => None,
    }
}
fn convert_branching(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    match expr {
        Expression::ConditionalExpression(cond) => Some(conditional_values(cond, scoped)),
        Expression::LogicalExpression(log) => Some(logical_values(log, scoped)),
        _ => None,
    }
}
/// A ternary's authored leaves: the live arm when its test folds, both arms when it stays open.
fn conditional_values(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    // color: true ? 'cherry' : 'ocean'  — the live arm only, like
    // the want walker; open tests still walk both arms
    let test = crate::extract::fold::fold_test(&cond.test, scoped);
    match test.value {
        Some(true) => ast_to_json_values(&cond.consequent, scoped),
        Some(false) => ast_to_json_values(&cond.alternate, scoped),
        None => {
            let mut out = ast_to_json_values(&cond.consequent, scoped);
            out.extend(ast_to_json_values(&cond.alternate, scoped));
            out
        }
    }
}
fn logical_values(log: &LogicalExpression<'_>, scoped: Scoped<'_>) -> Vec<(Value, bool)> {
    // Guards (`false &&`, `==`, `null`, `undefined`) are skipped by the
    // want walker, so they contribute no authored leaf either.
    let fold = crate::extract::fold::fold_logical(log.operator, &log.left, &log.right, scoped);
    if let Some(value) = fold.value {
        // 'red' || 'blue'  — the picked operand only, like the want walker
        return folded_value_to_json(&value).into_iter().collect();
    }
    let mut out = Vec::new();
    if !super::super::walk::is_guard_expression(&log.left) {
        out.extend(ast_to_json_values(&log.left, scoped));
    }
    if !super::super::walk::is_guard_expression(&log.right) {
        out.extend(ast_to_json_values(&log.right, scoped));
    }
    out
}
/// Wrapper shapes (parentheses, casts, assertions) take the leaves of their inner expression.
/// Transparent wrappers erase exactly like the want walker (GAP-05b).
fn convert_wrapper_values(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    unwrap_wrapper_target(expr).map(|inner| ast_to_json_values(inner, scoped))
}
/// True for leaves the want walker omits: `null`, `undefined`, and `void`.
///
/// The walker collects no want for these, so they contribute no authored
/// leaf either. A synthesized null want would otherwise re-resolve into a
/// diagnostic the main pass never emits.
fn is_omitted_leaf(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::NullLiteral(_) => true,
        Expression::Identifier(ident) => ident.name == "undefined" || ident.name == "null",
        Expression::UnaryExpression(unary) => unary.operator == UnaryOperator::Void,
        _ => false,
    }
}
/// Every static leaf of a const member, for multi-valued positions.
fn convert_static_member_leaves(
    mem: &StaticMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    // color: theme.primary  /  color: tokens.colors.red, like the walker
    crate::extract::fold::member_path_leaves(mem, scoped)
        .iter()
        .filter_map(folded_value_to_json)
        .collect()
}
/// Every static leaf recorded for an identifier, for multi-valued positions.
fn convert_identifier_leaves(name: &str, scoped: Scoped<'_>) -> Vec<(Value, bool)> {
    scoped
        .scalar_leaves(name)
        .iter()
        .filter_map(folded_value_to_json)
        .collect()
}
/// Every leaf the unary node folds; refused and dynamic leaves yield nothing.
fn convert_unary_values(
    unary: &oxc_ast::ast::UnaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    let fold = crate::extract::fold::fold_unary(unary.operator, &unary.argument, scoped);
    fold.values
        .iter()
        .filter_map(|val| atom_value_to_json(val).map(|json| (json, false)))
        .collect()
}
/// Every pair the binary node folds; refused pairs plan nothing.
fn convert_binary_values(
    binary: &oxc_ast::ast::BinaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    let fold =
        crate::extract::fold::fold_binary(binary.operator, &binary.left, &binary.right, scoped);
    fold.values
        .iter()
        .filter_map(folded_value_to_json)
        .collect()
}
/// Every leaf the element node folds; refused reads plan nothing.
fn convert_computed_member_values(
    object: &Expression<'_>,
    index: &Expression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    let fold = crate::extract::fold::fold_element_access(object, index, scoped);
    fold.values
        .iter()
        .filter_map(folded_value_to_json)
        .collect()
}
/// Every leaf of a chain; unfoldable chains plan nothing.
fn convert_chain_values(
    chain: &oxc_ast::ast::ChainExpression<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    if let ChainElement::ComputedMemberExpression(mem) = &chain.expression {
        return convert_computed_member_values(&mem.object, &mem.expression, scoped);
    }
    // tokens?.color  — every folded leaf, like the want walker
    crate::extract::fold::fold_chain(chain, scoped)
        .iter()
        .filter_map(folded_value_to_json)
        .collect()
}
/// Every string the template node joins; refused templates plan nothing.
fn convert_template_values(
    lit: &oxc_ast::ast::TemplateLiteral<'_>,
    scoped: Scoped<'_>,
) -> Vec<(Value, bool)> {
    let fold = crate::extract::fold::fold_template(lit, scoped);
    fold.values
        .iter()
        .map(|val| {
            let (clean, imp) = super::super::literal::split_important_flag(val);
            (Value::String(clean.to_string()), imp)
        })
        .collect()
}
