//! Operator lowering for the pure-helper fence (SPEC-V2-39).
//!
//! Binary, unary, logical, and ternary expressions lower here, one function
//! per family plus the operator maps. `+` splits off from the other binary
//! operators because JS concatenates on any string side; `~`, `typeof`,
//! `void`, and `delete` refuse; and a ternary test must lower, exactly like
//! v2's `pure_fn` descriptor.

use oxc_ast::ast::{BinaryOperator, LogicalOperator, UnaryOperator};

use super::fence::{FenceBinary, FenceLogical, FenceUnary, LowerCtx, PureExpr};
use super::fence_lower::lower_expr;

/// Lower a binary expression; `+` splits off, the rest map to fence ops.
pub(crate) fn lower_binary(
    binary: &oxc_ast::ast::BinaryExpression<'_>,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    let left = lower_expr(&binary.left, ctx)?;
    let right = lower_expr(&binary.right, ctx)?;
    if binary.operator == BinaryOperator::Addition {
        return Some(PureExpr::Concat(Box::new(left), Box::new(right)));
    }
    let op = fence_binary_op(binary.operator)?;
    Some(PureExpr::Binary {
        op,
        left: Box::new(left),
        right: Box::new(right),
    })
}

/// The admitted binary operators; bitwise, `in`, and shifts refuse.
const BINARY_OPS: [(BinaryOperator, FenceBinary); 13] = [
    (BinaryOperator::Subtraction, FenceBinary::Sub),
    (BinaryOperator::Multiplication, FenceBinary::Mul),
    (BinaryOperator::Division, FenceBinary::Div),
    (BinaryOperator::Remainder, FenceBinary::Rem),
    (BinaryOperator::Exponential, FenceBinary::Exp),
    (BinaryOperator::Equality, FenceBinary::EqEq),
    (BinaryOperator::Inequality, FenceBinary::NotEq),
    (BinaryOperator::StrictEquality, FenceBinary::StrictEq),
    (BinaryOperator::StrictInequality, FenceBinary::StrictNotEq),
    (BinaryOperator::LessThan, FenceBinary::Lt),
    (BinaryOperator::LessEqualThan, FenceBinary::LtEq),
    (BinaryOperator::GreaterThan, FenceBinary::Gt),
    (BinaryOperator::GreaterEqualThan, FenceBinary::GtEq),
];

/// Map an admitted binary operator through the fence table.
fn fence_binary_op(op: BinaryOperator) -> Option<FenceBinary> {
    BINARY_OPS
        .iter()
        .find_map(|(candidate, mapped)| (*candidate == op).then_some(*mapped))
}

/// Lower a unary expression; only `+`, `-`, and `!` are admitted.
pub(crate) fn lower_unary(
    unary: &oxc_ast::ast::UnaryExpression<'_>,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    let op = match unary.operator {
        UnaryOperator::UnaryPlus => FenceUnary::Plus,
        UnaryOperator::UnaryNegation => FenceUnary::Minus,
        UnaryOperator::LogicalNot => FenceUnary::Not,
        _ => return None,
    };
    let arg = lower_expr(&unary.argument, ctx)?;
    Some(PureExpr::Unary {
        op,
        arg: Box::new(arg),
    })
}

/// Lower a logical expression; all three operators short-circuit at eval.
pub(crate) fn lower_logical(
    logical: &oxc_ast::ast::LogicalExpression<'_>,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    let op = match logical.operator {
        LogicalOperator::And => FenceLogical::And,
        LogicalOperator::Or => FenceLogical::Or,
        LogicalOperator::Coalesce => FenceLogical::Coalesce,
    };
    let left = lower_expr(&logical.left, ctx)?;
    let right = lower_expr(&logical.right, ctx)?;
    Some(PureExpr::Logical {
        op,
        left: Box::new(left),
        right: Box::new(right),
    })
}

/// Lower a ternary; the test must lower, exactly like v2.
pub(crate) fn lower_conditional(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    ctx: &LowerCtx,
) -> Option<PureExpr> {
    let test = lower_expr(&cond.test, ctx)?;
    let consequent = lower_expr(&cond.consequent, ctx)?;
    let alternate = lower_expr(&cond.alternate, ctx)?;
    Some(PureExpr::Conditional {
        test: Box::new(test),
        consequent: Box::new(consequent),
        alternate: Box::new(alternate),
    })
}

