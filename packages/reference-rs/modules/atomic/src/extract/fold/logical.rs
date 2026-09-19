//! Short-circuit folding for all-literal `&&`, `||`, and `??`.
//!
//! [`fold_logical`] applies JavaScript short-circuit when both operands fold
//! to exactly one clean leaf (`'x' && 'y'` is `'y'`, `'' || 'f'` is `'f'`,
//! `'v' ?? 'u'` is `'v'`), so the dead operand compiles nothing. Anything
//! else abstains and the caller walks both operands exactly as before: guard
//! operands stay authoritative (the entry-18 HAVE rule), and multi-leaf or
//! dynamic operands keep today's scoop-and-diagnose behavior. Abstaining
//! drops what the probe eliminated inside the operands, because the fallback
//! re-walk re-derives it; a fold carries its [`DeadArm`]s to the caller.

use oxc_ast::ast::{Expression, LogicalOperator};

use super::coerce::{nullish, truthy};
use super::conditional::DeadArm;
use super::operand::{operand_leaves, peel_wrappers, Operand};
use crate::atom::AtomValue;
use crate::extract::expressions::walk::is_guard_expression;
use crate::extract::scope::Scoped;

/// One short-circuit fold: its value plus arms eliminated inside it.
pub struct LogicalFold {
    /// The picked operand when both sides folded to one clean leaf.
    pub value: Option<AtomValue>,
    /// Arms eliminated while folding the operands (empty when abstaining).
    pub dead_arms: Vec<DeadArm>,
}

/// Fold one logical expression, or abstain with no value and no dead arms.
///
/// Guard operands abstain first, so `false && 'x'` still walks the right
/// operand and `null ?? 'd'` still skips the guard — the HAVE behavior is
/// byte-identical. Non-guard operands must each fold to exactly one leaf
/// through literals, const-resolved names, or clean nested folds.
pub fn fold_logical(
    op: LogicalOperator,
    left: &Expression<'_>,
    right: &Expression<'_>,
    scoped: Scoped<'_>,
) -> LogicalFold {
    let left = peel_wrappers(left);
    let right = peel_wrappers(right);
    if is_guard_expression(left) || is_guard_expression(right) {
        return abstain();
    }
    let (Some((picked_left, mut dead_arms)), Some((picked_right, right_dead))) =
        (single_operand(left, scoped), single_operand(right, scoped))
    else {
        return abstain();
    };
    dead_arms.extend(right_dead);
    let Some(value) = short_circuit(op, &picked_left, &picked_right) else {
        return abstain();
    };
    LogicalFold {
        value: Some(value),
        dead_arms,
    }
}

/// Abstain: no value, and no dead arms (the fallback re-derives them).
fn abstain() -> LogicalFold {
    LogicalFold {
        value: None,
        dead_arms: Vec::new(),
    }
}

/// JavaScript short-circuit over two folded leaves, or abstain on undecidable.
fn short_circuit(op: LogicalOperator, left: &AtomValue, right: &AtomValue) -> Option<AtomValue> {
    match op {
        LogicalOperator::And => and_pick(left, right),
        LogicalOperator::Or => or_pick(left, right),
        LogicalOperator::Coalesce => Some(coalesce_pick(left, right)),
    }
}

/// `&&` picks the right operand when the left is truthy, else the left.
fn and_pick(left: &AtomValue, right: &AtomValue) -> Option<AtomValue> {
    if truthy(left)? {
        Some(right.clone())
    } else {
        Some(left.clone())
    }
}

/// `||` picks the left operand when it is truthy, else the right.
fn or_pick(left: &AtomValue, right: &AtomValue) -> Option<AtomValue> {
    if truthy(left)? {
        Some(left.clone())
    } else {
        Some(right.clone())
    }
}

/// `??` picks the right operand through nullish lefts, else the left.
fn coalesce_pick(left: &AtomValue, right: &AtomValue) -> AtomValue {
    if nullish(left) {
        right.clone()
    } else {
        left.clone()
    }
}

/// One operand as a single clean leaf plus its inner dead arms, or abstain.
///
/// Literals and single-leaf names resolve directly; nested binary, unary,
/// logical, template, and folded-test ternary operands recurse through
/// their own nodes and must be residue-free. Anything else abstains.
fn single_operand(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(AtomValue, Vec<DeadArm>)> {
    let expr = peel_wrappers(expr);
    if let Operand::Leaves(leaves) = operand_leaves(expr, scoped) {
        if let [only] = leaves.as_slice() {
            return Some((only.clone(), Vec::new()));
        }
        return None;
    }
    single_nested(expr, scoped)
}

/// A nested operand as a single clean leaf, or abstain when unclean.
fn single_nested(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<(AtomValue, Vec<DeadArm>)> {
    if let Expression::BinaryExpression(binary) = expr {
        let fold = super::binary::fold_binary(binary.operator, &binary.left, &binary.right, scoped);
        let clean = is_clean_binary(&fold);
        return clean_single(fold.values, fold.dead_arms, clean);
    }
    if let Expression::UnaryExpression(unary) = expr {
        let fold = super::unary::fold_unary(unary.operator, &unary.argument, scoped);
        let clean = is_clean_unary(&fold);
        return clean_single(fold.values, fold.dead_arms, clean);
    }
    if let Expression::LogicalExpression(log) = expr {
        let fold = fold_logical(log.operator, &log.left, &log.right, scoped);
        return fold.value.map(|value| (value, fold.dead_arms));
    }
    if let Expression::TemplateLiteral(lit) = expr {
        return single_template(lit, scoped);
    }
    if let Expression::ConditionalExpression(cond) = expr {
        return single_conditional(cond, scoped);
    }
    None
}

/// One clean leaf plus dead arms, or abstain when unclean or multi-leaf.
fn clean_single(
    values: Vec<AtomValue>,
    dead_arms: Vec<DeadArm>,
    clean: bool,
) -> Option<(AtomValue, Vec<DeadArm>)> {
    if !clean {
        return None;
    }
    if let [only] = values.as_slice() {
        Some((only.clone(), dead_arms))
    } else {
        None
    }
}

/// True when a binary fold is residue-free (dead arms are accounted for).
fn is_clean_binary(fold: &super::binary::BinaryFold<'_, '_>) -> bool {
    fold.refusals.is_empty()
        && fold.unary_refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}

/// True when a unary fold is residue-free (dead arms are accounted for).
fn is_clean_unary(fold: &super::unary::UnaryFold<'_, '_>) -> bool {
    fold.refusals.is_empty() && fold.template_refusals.is_empty() && fold.dynamic.is_empty()
}

/// A template operand as its one joined string, or abstain when refused.
fn single_template(
    lit: &oxc_ast::ast::TemplateLiteral<'_>,
    scoped: Scoped<'_>,
) -> Option<(AtomValue, Vec<DeadArm>)> {
    let fold = super::template::fold_template(lit, scoped);
    if fold.values.len() == 1 && fold.refusals.is_empty() {
        let joined = fold.values.into_iter().next();
        joined.map(|text| (AtomValue::String(text.into()), Vec::new()))
    } else {
        None
    }
}

/// A ternary operand as its live arm's single leaf, or abstain when open.
///
/// A folded test contributes this level's dead arm; an open test abstains,
/// so the fallback walks both arms exactly as before.
fn single_conditional(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<(AtomValue, Vec<DeadArm>)> {
    let test = super::conditional::fold_test(&cond.test, scoped);
    let pick = test.value?;
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let (value, mut dead_arms) = single_operand(live, scoped)?;
    dead_arms.extend(test.dead_arms);
    dead_arms.push(super::conditional::dead_arm(dead, pick, scoped));
    Some((value, dead_arms))
}
