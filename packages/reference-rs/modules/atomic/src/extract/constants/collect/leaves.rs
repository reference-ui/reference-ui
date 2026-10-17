//! Literal leaves of const initializers: the scalar values a binding may carry. A branching
//! initializer (ternary arms, non-guard logical operands) flattens into its literal leaves, and any
//! non-literal position marks the dropped flag so the caller keeps the union while test folding
//! stays open. A plain initializer yields one literal leaf or none; `unwrap_expression` peels
//! transparent parenthesis and TypeScript wrappers before either check.

use oxc_ast::ast::Expression;

use crate::atom::AtomValue;
use crate::extract::expressions::walk::is_guard_expression;

/// Scoop every literal leaf of a branching initializer, mirroring the want
/// walker leaf-for-leaf: both ternary arms, non-guard logical operands.
/// A non-guard leaf position with no literal sets the dropped flag, so the
/// binding keeps its union for values while test folding stays open.
pub(super) fn collect_branching_leaves(
    expr: &Expression<'_>,
    out: &mut Vec<AtomValue>,
    dropped: &mut bool,
) {
    let unwrapped = unwrap_expression(expr);
    if collect_conditional_leaves(unwrapped, out, dropped) {
        return;
    }
    if collect_logical_leaves(unwrapped, out, dropped) {
        return;
    }
    if let Some(atom) = literal_leaf(unwrapped) {
        out.push(atom);
    } else {
        *dropped = true;
    }
}

/// Scoop both arms of a ternary initializer, or false when not a ternary.
fn collect_conditional_leaves(
    expr: &Expression<'_>,
    out: &mut Vec<AtomValue>,
    dropped: &mut bool,
) -> bool {
    let Expression::ConditionalExpression(cond) = expr else {
        return false;
    };
    collect_branching_leaves(&cond.consequent, out, dropped);
    collect_branching_leaves(&cond.alternate, out, dropped);
    true
}

/// Scoop the non-guard operands of a logical initializer, or false when not logical.
fn collect_logical_leaves(
    expr: &Expression<'_>,
    out: &mut Vec<AtomValue>,
    dropped: &mut bool,
) -> bool {
    let Expression::LogicalExpression(log) = expr else {
        return false;
    };
    if !is_guard_expression(&log.left) {
        collect_branching_leaves(&log.left, out, dropped);
    }
    if !is_guard_expression(&log.right) {
        collect_branching_leaves(&log.right, out, dropped);
    }
    true
}

/// A literal initializer leaf, or None for dynamic shapes.
pub(super) fn literal_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    match expr {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => {
            Some(AtomValue::Number(n.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        Expression::NullLiteral(_) => Some(AtomValue::Null),
        _ => None,
    }
}

pub(super) fn unwrap_expression<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
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
