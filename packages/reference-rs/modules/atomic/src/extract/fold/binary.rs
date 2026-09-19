//! Constant folding for binary expressions, shared by both extraction walkers.
//!
//! [`fold_binary`] resolves one `+ - * / % **` arithmetic, `+` string
//! concatenation, or `== != === !== < <= > >=` comparison over literal and
//! const-resolved operands, pairing multi-leaf operands the way ternaries
//! scoop both arms. Pairs fold per JavaScript coercion exactly the way Panda
//! v2's `eval_binary` does; anything NaN-producing, non-finite, or
//! bitwise refuses with a located refusal instead of emitting a value that
//! cannot round-trip. Nested folds recurse through their own nodes, open
//! branches distribute, and dynamic operands re-walk for their own
//! diagnostics — never for wants.

use oxc_ast::ast::{BinaryExpression, BinaryOperator, Expression, LogicalExpression};

use super::conditional::dead_arm;
use super::operand::{operand_leaves, peel_wrappers, Operand};
use super::pairs::{apply_pair, PairOutcome};
use super::template::TemplateRefusal;
use super::unary::{fold_unary, UnaryRefusal};
use crate::atom::AtomValue;
use crate::extract::expressions::walk::is_guard_expression;
use crate::extract::scope::Scoped;

/// Folded leaves plus the refusals and dynamic operands left behind.
#[derive(Default)]
pub struct BinaryFold<'ast, 'expr> {
    /// One value per folded pair; multi-leaf operands fan out here.
    pub values: Vec<AtomValue>,
    /// One refusal per pair or operator the node could not fold.
    pub refusals: Vec<BinaryRefusal>,
    /// Nested unary refusals, diagnosed without a re-walk.
    pub unary_refusals: Vec<UnaryRefusal>,
    /// Nested template refusals, diagnosed without a re-walk.
    pub template_refusals: Vec<TemplateRefusal>,
    /// Arms eliminated inside nested tests, always diagnosed by the caller.
    pub dead_arms: Vec<super::conditional::DeadArm>,
    /// Dynamic sub-operands the caller re-walks for their own diagnostics.
    pub dynamic: Vec<&'expr Expression<'ast>>,
}

/// Why one pair or operator did not fold.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BinaryRefusal {
    /// Shifts, bitwise ops, `in`, `instanceof`: never fold in any position.
    OperatorNotFoldable(BinaryOperator),
    /// An operand JavaScript would coerce to `NaN` (`'foo' - 1`).
    NonNumericOperand(BinaryOperator),
    /// A result that is not finite (`1 / 0`, `0 / 0`, overflow).
    NonFiniteResult(BinaryOperator),
    /// An array or object operand, which binary operators never fold through.
    UnfoldableOperand(BinaryOperator, &'static str),
}

impl BinaryRefusal {
    /// The diagnostic text for a refusal at one style prop.
    pub fn message(&self, prop: &str) -> String {
        format!(
            "Dynamic binary expression encountered for prop '{prop}' ({})",
            self.detail()
        )
    }

    /// Short reason text, reused wherever a pair refusal is surfaced.
    pub fn detail(&self) -> String {
        match self {
            Self::OperatorNotFoldable(op) => {
                format!("operator '{}' is not foldable", operator_name(*op))
            }
            Self::NonNumericOperand(op) => format!(
                "operator '{}' does not apply to a non-numeric value",
                operator_name(*op)
            ),
            Self::NonFiniteResult(op) => format!(
                "operator '{}' does not fold to a finite value",
                operator_name(*op)
            ),
            Self::UnfoldableOperand(op, kind) => format!(
                "operator '{}' does not fold an {kind} operand",
                operator_name(*op)
            ),
        }
    }
}

/// Operator spellings for diagnostics.
const OPERATOR_NAMES: [(BinaryOperator, &str); 22] = [
    (BinaryOperator::Equality, "=="),
    (BinaryOperator::Inequality, "!="),
    (BinaryOperator::StrictEquality, "==="),
    (BinaryOperator::StrictInequality, "!=="),
    (BinaryOperator::LessThan, "<"),
    (BinaryOperator::LessEqualThan, "<="),
    (BinaryOperator::GreaterThan, ">"),
    (BinaryOperator::GreaterEqualThan, ">="),
    (BinaryOperator::Addition, "+"),
    (BinaryOperator::Subtraction, "-"),
    (BinaryOperator::Multiplication, "*"),
    (BinaryOperator::Division, "/"),
    (BinaryOperator::Remainder, "%"),
    (BinaryOperator::Exponential, "**"),
    (BinaryOperator::ShiftLeft, "<<"),
    (BinaryOperator::ShiftRight, ">>"),
    (BinaryOperator::ShiftRightZeroFill, ">>>"),
    (BinaryOperator::BitwiseOR, "|"),
    (BinaryOperator::BitwiseXOR, "^"),
    (BinaryOperator::BitwiseAnd, "&"),
    (BinaryOperator::In, "in"),
    (BinaryOperator::Instanceof, "instanceof"),
];

/// The source spelling of one operator for diagnostics.
fn operator_name(op: BinaryOperator) -> &'static str {
    OPERATOR_NAMES
        .iter()
        .find(|(candidate, _)| *candidate == op)
        .map_or("?", |(_, name)| *name)
}

/// Fold one binary expression over its operands' static leaves.
pub fn fold_binary<'ast, 'expr>(
    op: BinaryOperator,
    left: &'expr Expression<'ast>,
    right: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
) -> BinaryFold<'ast, 'expr> {
    let mut fold = BinaryFold::default();
    if !is_foldable_operator(op) {
        // a | b  /  k in o  — the operator never folds
        fold.refusals.push(BinaryRefusal::OperatorNotFoldable(op));
        return fold;
    }
    let left_leaves = operand_values(op, left, scoped, &mut fold);
    let right_leaves = operand_values(op, right, scoped, &mut fold);
    for left_leaf in &left_leaves {
        for right_leaf in &right_leaves {
            match apply_pair(op, left_leaf, right_leaf) {
                PairOutcome::Value(value) => fold.values.push(value),
                PairOutcome::Refuse(refusal) => fold.refusals.push(refusal),
            }
        }
    }
    fold
}

/// True for the operators the table folds: arithmetic, concat, comparison.
fn is_foldable_operator(op: BinaryOperator) -> bool {
    matches!(
        op,
        BinaryOperator::Addition
            | BinaryOperator::Subtraction
            | BinaryOperator::Multiplication
            | BinaryOperator::Division
            | BinaryOperator::Remainder
            | BinaryOperator::Exponential
            | BinaryOperator::Equality
            | BinaryOperator::Inequality
            | BinaryOperator::StrictEquality
            | BinaryOperator::StrictInequality
            | BinaryOperator::LessThan
            | BinaryOperator::LessEqualThan
            | BinaryOperator::GreaterThan
            | BinaryOperator::GreaterEqualThan
    )
}

/// Resolve one operand position; each probe takes the shapes it knows.
fn operand_values<'ast, 'expr>(
    op: BinaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    let expr = peel_wrappers(expr);
    if let Operand::Leaves(leaves) = operand_leaves(expr, scoped) {
        return leaves;
    }
    if let Expression::BinaryExpression(nested) = expr {
        return binary_operand(nested, scoped, fold);
    }
    if let Expression::UnaryExpression(nested) = expr {
        return unary_operand(nested, scoped, fold);
    }
    if let Expression::TemplateLiteral(lit) = expr {
        return template_operand(lit, scoped, fold);
    }
    if let Expression::LogicalExpression(log) = expr {
        return logical_operand(op, log, scoped, fold);
    }
    if let Expression::ConditionalExpression(cond) = expr {
        return conditional_operand(op, cond, scoped, fold);
    }
    operand_fallback(op, expr, fold)
}

/// Refuse composite operands, or hand dynamic ones back for a re-walk.
fn operand_fallback<'ast, 'expr>(
    op: BinaryOperator,
    expr: &'expr Expression<'ast>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    if matches!(expr, Expression::ArrayExpression(_)) {
        // [1, 2] + 'px'  — arrays never fold through binary
        fold.refusals
            .push(BinaryRefusal::UnfoldableOperand(op, "array"));
        return Vec::new();
    }
    if matches!(expr, Expression::ObjectExpression(_)) {
        // { ... } + 'px'  — objects never fold through binary
        fold.refusals
            .push(BinaryRefusal::UnfoldableOperand(op, "object"));
        return Vec::new();
    }
    // 1 + pick()  — the caller walks the operand itself
    fold.dynamic.push(expr);
    Vec::new()
}

/// A nested binary operand folds inside out through its own node.
fn binary_operand<'ast, 'expr>(
    nested: &'expr BinaryExpression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    // (2 + 3) * 4  — pairs of pairs, refusals surface with their own operator
    let sub = fold_binary(nested.operator, &nested.left, &nested.right, scoped);
    absorb_binary(fold, sub)
}

/// Move a nested binary fold's residue into the outer fold, keeping values.
fn absorb_binary<'ast, 'expr>(
    fold: &mut BinaryFold<'ast, 'expr>,
    sub: BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    fold.refusals.extend(sub.refusals);
    fold.unary_refusals.extend(sub.unary_refusals);
    fold.template_refusals.extend(sub.template_refusals);
    fold.dead_arms.extend(sub.dead_arms);
    fold.dynamic.extend(sub.dynamic);
    sub.values
}

/// A nested unary operand folds through the unary node (`-2 * 4`).
fn unary_operand<'ast, 'expr>(
    nested: &'expr oxc_ast::ast::UnaryExpression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    let sub = fold_unary(nested.operator, &nested.argument, scoped);
    fold.unary_refusals.extend(sub.refusals);
    fold.template_refusals.extend(sub.template_refusals);
    fold.dead_arms.extend(sub.dead_arms);
    fold.dynamic.extend(sub.dynamic);
    sub.values
}

/// An interpolated template operand joins through the template node.
fn template_operand<'ast, 'expr>(
    lit: &oxc_ast::ast::TemplateLiteral<'_>,
    scoped: Scoped<'_>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    // `${n}px` + '!'  — joined strings pair like plain strings
    let sub = super::template::fold_template(lit, scoped);
    fold.template_refusals.extend(sub.refusals);
    sub.values
        .into_iter()
        .map(|joined| AtomValue::String(joined.into()))
        .collect()
}

/// A logical operand folds single when clean, else distributes openly.
///
/// `('x' && 'y') + '!'` pairs `'y'`; `(u && 'a') + 'b'` pairs `'a'` and
/// re-walks `u` for its own diagnostic, mirroring the want walker.
fn logical_operand<'ast, 'expr>(
    op: BinaryOperator,
    log: &'expr LogicalExpression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    let sub = super::logical::fold_logical(log.operator, &log.left, &log.right, scoped);
    fold.dead_arms.extend(sub.dead_arms);
    if let Some(value) = sub.value {
        return vec![value];
    }
    let mut leaves = Vec::new();
    if !is_guard_expression(&log.left) {
        leaves.extend(operand_values(op, &log.left, scoped, fold));
    }
    if !is_guard_expression(&log.right) {
        leaves.extend(operand_values(op, &log.right, scoped, fold));
    }
    leaves
}

/// A ternary operand takes the live arm when the test folds, else both.
///
/// `(c ? 2 : 3) + 1` pairs `3` and `4`; `(true ? 2 : 3) + 1` pairs `3`
/// and names the dead arm, exactly like value position.
fn conditional_operand<'ast, 'expr>(
    op: BinaryOperator,
    cond: &'expr oxc_ast::ast::ConditionalExpression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut BinaryFold<'ast, 'expr>,
) -> Vec<AtomValue> {
    let test = super::conditional::fold_test(&cond.test, scoped);
    fold.dead_arms.extend(test.dead_arms);
    let Some(pick) = test.value else {
        let mut leaves = operand_values(op, &cond.consequent, scoped, fold);
        leaves.extend(operand_values(op, &cond.alternate, scoped, fold));
        return leaves;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    fold.dead_arms.push(dead_arm(dead, pick, scoped));
    operand_values(op, live, scoped, fold)
}
