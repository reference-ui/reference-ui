//! AST expression conversion to structured JSON values for authored declaration capture.
//! Traverses JavaScript expressions before compiler lowering to preserve authored values.
//! Supports literals, arrays with null holes, rhythm objects, unary negatives, and file constants.
//! Emits None for dynamic, non-constant expressions that cannot be captured as static plans.

use oxc_ast::ast::{
    ArrayExpressionElement, Expression, ObjectPropertyKind, PropertyKey, UnaryOperator,
};
use serde_json::{json, Map, Value};

use crate::atom::AtomValue;
use crate::extract::constants::LocalConstants;

/// Convert an AST expression into a JSON value and inline important flag.
pub fn ast_to_json_value(
    expr: &Expression<'_>,
    constants: &LocalConstants,
) -> Option<(Value, bool)> {
    if let Some(res) = convert_literal(expr) {
        return Some(res);
    }
    if let Some(res) = convert_wrapper(expr, constants) {
        return Some(res);
    }
    convert_compound(expr, constants)
}

fn convert_literal(expr: &Expression<'_>) -> Option<(Value, bool)> {
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
        return convert_template(lit);
    }
    None
}

fn convert_wrapper(
    expr: &Expression<'_>,
    constants: &LocalConstants,
) -> Option<(Value, bool)> {
    if let Expression::ParenthesizedExpression(p) = expr {
        return ast_to_json_value(&p.expression, constants);
    }
    if let Expression::TSAsExpression(as_expr) = expr {
        return ast_to_json_value(&as_expr.expression, constants);
    }
    if let Expression::TSSatisfiesExpression(sat) = expr {
        return ast_to_json_value(&sat.expression, constants);
    }
    if let Expression::TSNonNullExpression(non_null) = expr {
        let (v, _) = ast_to_json_value(&non_null.expression, constants)?;
        return Some((v, true));
    }
    None
}

fn convert_compound(
    expr: &Expression<'_>,
    constants: &LocalConstants,
) -> Option<(Value, bool)> {
    match expr {
        Expression::ArrayExpression(arr) => convert_array(arr, constants),
        Expression::ObjectExpression(obj) => convert_object(obj, constants),
        Expression::Identifier(ident) => convert_identifier(ident.name.as_str(), constants),
        Expression::UnaryExpression(unary) => convert_unary(unary, constants),
        _ => None,
    }
}

fn convert_array(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    constants: &LocalConstants,
) -> Option<(Value, bool)> {
    let mut elements = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        let v = array_elem_to_json(elem, constants)?;
        elements.push(v);
    }
    Some((Value::Array(elements), false))
}

fn array_elem_to_json(
    elem: &ArrayExpressionElement<'_>,
    constants: &LocalConstants,
) -> Option<Value> {
    match elem {
        ArrayExpressionElement::Elision(_) => Some(Value::Null),
        _ => {
            let expr = elem.as_expression()?;
            let (v, _) = ast_to_json_value(expr, constants)?;
            Some(v)
        }
    }
}

fn convert_object(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    constants: &LocalConstants,
) -> Option<(Value, bool)> {
    let mut map = Map::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        let key = match &prop.key {
            PropertyKey::StaticIdentifier(id) => id.name.to_string(),
            PropertyKey::StringLiteral(lit) => lit.value.to_string(),
            _ => return None,
        };
        let (v, _) = ast_to_json_value(&prop.value, constants)?;
        map.insert(key, v);
    }
    Some((Value::Object(map), false))
}

fn convert_template(lit: &oxc_ast::ast::TemplateLiteral<'_>) -> Option<(Value, bool)> {
    if lit.expressions.is_empty() && lit.quasis.len() == 1 {
        let raw = lit.quasis[0].value.raw.as_str();
        let (clean, imp) = super::literal::split_important_flag(raw);
        Some((Value::String(clean.to_string()), imp))
    } else {
        None
    }
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

fn atom_value_to_json(val: &AtomValue) -> Option<Value> {
    match val {
        AtomValue::String(s) => Some(Value::String(s.to_string())),
        AtomValue::Number(n) => Some(number_atom_to_json(n)),
        AtomValue::Bool(b) => Some(Value::Bool(*b)),
        AtomValue::Null => Some(Value::Null),
        _ => None,
    }
}

fn convert_identifier(name: &str, constants: &LocalConstants) -> Option<(Value, bool)> {
    if name == "undefined" || name == "null" {
        return Some((Value::Null, false));
    }
    let atom_val = constants.get_scalar(name)?;
    let val = atom_value_to_json(atom_val)?;
    Some((val, false))
}

fn convert_unary(
    unary: &oxc_ast::ast::UnaryExpression<'_>,
    _constants: &LocalConstants,
) -> Option<(Value, bool)> {
    if unary.operator == UnaryOperator::Void {
        Some((Value::Null, false))
    } else if let (UnaryOperator::UnaryNegation, Expression::NumericLiteral(lit)) =
        (unary.operator, &unary.argument)
    {
        let val = -lit.value;
        if (val - val.round()).abs() < 1e-9 {
            Some((json!(val as i64), false))
        } else {
            Some((json!(val), false))
        }
    } else {
        None
    }
}
