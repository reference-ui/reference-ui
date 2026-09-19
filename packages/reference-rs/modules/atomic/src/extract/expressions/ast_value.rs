//! AST expression conversion to structured JSON values for authored declaration capture.
//! Traverses JavaScript expressions before compiler lowering to preserve authored values.
//! Supports literals, arrays with null holes, rhythm objects, unary negatives, and scoped bindings.
//! Emits None for dynamic, non-constant expressions that cannot be captured as static plans.

use oxc_ast::ast::{
    ArrayExpressionElement, ChainElement, ComputedMemberExpression, Expression, LogicalExpression,
    ObjectPropertyKind, StaticMemberExpression, UnaryOperator,
};
use serde_json::{json, Map, Value};

use crate::atom::AtomValue;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

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
        Expression::UnaryExpression(unary) => convert_unary(unary, scoped),
        Expression::BinaryExpression(binary) => convert_binary(binary, scoped),
        Expression::ComputedMemberExpression(mem) => convert_computed_member(mem, scoped),
        Expression::ChainExpression(chain) => convert_chain(chain, scoped),
        Expression::CallExpression(call) => convert_call(call, scoped),
        _ => None,
    }
}

/// A `token()` call's planned leaf: the folded reference or path-plus-fallback
/// token, exactly like the want walker. Anything else plans nothing.
fn convert_token_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    let fold = crate::extract::fold::fold_token_call(call, scoped)?;
    let value = fold.value?;
    atom_value_to_json(&value).map(|val| (val, false))
}

/// A call's planned leaf: a `token()` reference first, else the first fold
/// of a pure-helper call, mirroring the want walker's value lowering.
fn convert_call(
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
    let mut out = Vec::new();
    for element in scoped.array(name)? {
        match element {
            ConstArrayElement::Leaf(leaf) => {
                out.push(atom_value_to_json(leaf)?);
            }
            ConstArrayElement::Hole => out.push(Value::Null),
            ConstArrayElement::Object(_) => return None,
        }
    }
    Some(out)
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
    if let Expression::Identifier(ident) = expr {
        // borderBottomColor={subtleBorder}  — every static leaf, like the want walker
        let leaves = convert_identifier_leaves(ident.name.as_str(), scoped);
        if !leaves.is_empty() {
            return leaves;
        }
    }
    if let Expression::StaticMemberExpression(mem) = expr {
        return convert_static_member_leaves(mem, scoped);
    }
    if let Expression::UnaryExpression(unary) = expr {
        // -space  /  !true  — every folded leaf, like the want walker
        return convert_unary_values(unary, scoped);
    }
    if let Expression::BinaryExpression(binary) = expr {
        // 1 + 'px'  /  2 * 3  — every folded pair, like the want walker
        return convert_binary_values(binary, scoped);
    }
    if let Expression::TemplateLiteral(lit) = expr {
        // `${n}px`  — every joined string, like the want walker
        return convert_template_values(lit, scoped);
    }
    if let Expression::ComputedMemberExpression(mem) = expr {
        // colors['red']  — every folded leaf, like the want walker
        return convert_computed_member_values(&mem.object, &mem.expression, scoped);
    }
    if let Expression::ChainExpression(chain) = expr {
        return convert_chain_values(chain, scoped);
    }
    if let Expression::CallExpression(call) = expr {
        // tone('600')  — every folded leaf, like the want walker
        return convert_call_values(call, scoped);
    }
    ast_to_json_value(expr, scoped).into_iter().collect()
}

fn convert_branching(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // color: true ? 'cherry' : 'ocean'  — the live arm only, like
            // the want walker; open tests still walk both arms
            let test = crate::extract::fold::fold_test(&cond.test, scoped);
            match test.value {
                Some(true) => Some(ast_to_json_values(&cond.consequent, scoped)),
                Some(false) => Some(ast_to_json_values(&cond.alternate, scoped)),
                None => {
                    let mut out = ast_to_json_values(&cond.consequent, scoped);
                    out.extend(ast_to_json_values(&cond.alternate, scoped));
                    Some(out)
                }
            }
        }
        Expression::LogicalExpression(log) => Some(logical_values(log, scoped)),
        _ => None,
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
    if !super::walk::is_guard_expression(&log.left) {
        out.extend(ast_to_json_values(&log.left, scoped));
    }
    if !super::walk::is_guard_expression(&log.right) {
        out.extend(ast_to_json_values(&log.right, scoped));
    }
    out
}

fn convert_wrapper_values(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<Vec<(Value, bool)>> {
    match expr {
        Expression::ParenthesizedExpression(p) => Some(ast_to_json_values(&p.expression, scoped)),
        Expression::TSAsExpression(as_expr) => {
            Some(ast_to_json_values(&as_expr.expression, scoped))
        }
        Expression::TSSatisfiesExpression(sat) => Some(ast_to_json_values(&sat.expression, scoped)),
        Expression::TSNonNullExpression(non_null) => {
            // ('2r'!)  — transparent, exactly like the want walker (GAP-05b)
            Some(ast_to_json_values(&non_null.expression, scoped))
        }
        Expression::TSTypeAssertion(assertion) => {
            Some(ast_to_json_values(&assertion.expression, scoped))
        }
        Expression::TSInstantiationExpression(instantiation) => {
            Some(ast_to_json_values(&instantiation.expression, scoped))
        }
        _ => None,
    }
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
        .filter_map(|leaf| atom_value_to_json(leaf).map(|val| (val, false)))
        .collect()
}

fn convert_identifier(name: &str, scoped: Scoped<'_>) -> Option<(Value, bool)> {
    if name == "undefined" || name == "null" {
        return Some((Value::Null, false));
    }
    let atom_val = scoped.scalar(name)?;
    let val = atom_value_to_json(atom_val)?;
    Some((val, false))
}

/// Every static leaf recorded for an identifier, for multi-valued positions.
fn convert_identifier_leaves(name: &str, scoped: Scoped<'_>) -> Vec<(Value, bool)> {
    scoped
        .scalar_leaves(name)
        .iter()
        .filter_map(|leaf| atom_value_to_json(leaf).map(|val| (val, false)))
        .collect()
}

fn convert_unary(
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

fn convert_binary(
    binary: &oxc_ast::ast::BinaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    // Single-valued positions take the first folded pair, mirroring convert_unary.
    let fold =
        crate::extract::fold::fold_binary(binary.operator, &binary.left, &binary.right, scoped);
    let first = fold.values.first()?;
    folded_value_to_json(first)
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

/// One folded leaf as its plan value: strings split `!important` like the
/// want walker, so folded plans and wants agree leaf-for-leaf.
fn folded_value_to_json(val: &AtomValue) -> Option<(Value, bool)> {
    if let AtomValue::String(text) = val {
        let (clean, imp) = super::literal::split_important_flag(text);
        return Some((Value::String(clean.to_string()), imp));
    }
    atom_value_to_json(val).map(|json| (json, false))
}

/// The first folded leaf of an element access; refused reads plan nothing.
fn convert_computed_member(
    mem: &ComputedMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(Value, bool)> {
    // Single-valued positions take the first fold, mirroring convert_unary.
    let fold = crate::extract::fold::fold_element_access(&mem.object, &mem.expression, scoped);
    let first = fold.values.first()?;
    atom_value_to_json(first).map(|val| (val, false))
}

/// The first folded leaf of a chain; unfoldable chains plan nothing.
fn convert_chain(
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
    atom_value_to_json(&first).map(|val| (val, false))
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
        .filter_map(|val| atom_value_to_json(val).map(|json| (json, false)))
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
        .filter_map(|val| atom_value_to_json(val).map(|json| (json, false)))
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
            let (clean, imp) = super::literal::split_important_flag(val);
            (Value::String(clean.to_string()), imp)
        })
        .collect()
}
