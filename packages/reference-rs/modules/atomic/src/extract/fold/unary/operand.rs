//! Operand resolution for unary folding: each operand position takes the shape it knows, a literal,
//! a bound name, a nested unary, a wrapper, a branch, a template, or a member. The probes run in a
//! fixed order and stop at the first shape that answers, so the operand's leaves and refusals are
//! the same as the walk that produced them. Takes an operand expression and the unary fold; emits
//! the operand's leaves or refusals into that fold.

use oxc_ast::ast::{Expression, TemplateLiteral, UnaryOperator};

use super::super::template::fold_template;
use super::{apply_operator, apply_to_bool, apply_to_number, fold_unary, UnaryFold, UnaryRefusal};
use crate::extract::expressions::walk::is_guard_expression;
use crate::extract::scope::Scoped;

/// Resolve one operand position; each probe takes the shapes it knows.
pub(super) fn fold_operand<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) {
    if fold_scalar(op, expr, scoped, fold) {
        return;
    }
    if fold_nested(op, expr, scoped, fold) {
        return;
    }
    if fold_branching(op, expr, scoped, fold) {
        return;
    }
    if fold_member(op, expr, scoped, fold) {
        return;
    }
    if matches!(expr, Expression::ArrayExpression(_)) {
        // -[1, 2]  — arrays never fold through unary
        fold.refusals
            .push(UnaryRefusal::UnfoldableOperand(op, "array"));
        return;
    }
    if matches!(expr, Expression::ObjectExpression(_)) {
        // -{ ... }  — objects never fold through unary
        fold.refusals
            .push(UnaryRefusal::UnfoldableOperand(op, "object"));
        return;
    }
    // -pick()  /  -props.w  — the caller walks the operand itself
    fold.dynamic.push(expr);
}

fn fold_scalar<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    if let Expression::NumericLiteral(lit) = expr {
        apply_to_number(op, lit.value, fold);
        return true;
    }
    if let Expression::BooleanLiteral(lit) = expr {
        apply_to_bool(op, lit.value, fold);
        return true;
    }
    if let Expression::StringLiteral(_) = expr {
        // -'4'  /  !''  — strings refuse (S15); no Number() coercion here
        fold.refusals.push(UnaryRefusal::NonNumericOperand(op));
        return true;
    }
    if let Expression::NullLiteral(_) = expr {
        // -null  — null strips, as in value position
        return true;
    }
    if let Expression::TemplateLiteral(lit) = expr {
        return fold_template_operand(op, lit, scoped, fold);
    }
    if fold_identifier(op, expr, scoped, fold) {
        return true;
    }
    false
}

fn fold_identifier<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    let Expression::Identifier(ident) = expr else {
        return false;
    };
    if ident.name == "undefined" || ident.name == "null" {
        // -undefined  — omitted, as in value position
        return true;
    }
    let leaves = scoped.scalar_leaves(ident.name.as_str());
    if leaves.is_empty() {
        // -unknown  — no static leaves; the caller walks the name itself
        fold.dynamic.push(expr);
        return true;
    }
    if scoped.scalar_residue(ident.name.as_str()) {
        // -partial  — a dropped arm rides the leaves; the operator must not
        // fold on the kept leaf, so the caller walks the name itself
        fold.dynamic.push(expr);
        return true;
    }
    // -space  — the operator applies to every leaf
    for leaf in leaves {
        apply_operator(op, leaf, fold);
    }
    true
}

fn fold_nested<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    if let Expression::UnaryExpression(inner) = expr {
        if inner.operator == UnaryOperator::Void {
            // -(void 0)  — omit
            return true;
        }
        // --4  /  !-0  — fold inside out, then apply the outer operator
        let sub = fold_unary(inner.operator, &inner.argument, scoped);
        fold.refusals.extend(sub.refusals);
        fold.template_refusals.extend(sub.template_refusals);
        fold.dynamic.extend(sub.dynamic);
        for val in &sub.values {
            apply_operator(op, val, fold);
        }
        return true;
    }
    fold_wrapped(op, expr, scoped, fold)
}

fn fold_wrapped<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    if let Expression::ParenthesizedExpression(paren) = expr {
        fold_operand(op, &paren.expression, scoped, fold);
        return true;
    }
    if let Expression::TSAsExpression(cast) = expr {
        fold_operand(op, &cast.expression, scoped, fold);
        return true;
    }
    if let Expression::TSSatisfiesExpression(sat) = expr {
        fold_operand(op, &sat.expression, scoped, fold);
        return true;
    }
    if let Expression::TSNonNullExpression(non_null) = expr {
        fold_operand(op, &non_null.expression, scoped, fold);
        return true;
    }
    false
}

fn fold_branching<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    if let Expression::ConditionalExpression(cond) = expr {
        // -(pick ? 4 : 8)  — the operator distributes over both arms, or
        // over the live arm alone when the test folds
        let test = super::super::conditional::fold_test(&cond.test, scoped);
        fold.dead_arms.extend(test.dead_arms);
        let Some(pick) = test.value else {
            fold_operand(op, &cond.consequent, scoped, fold);
            fold_operand(op, &cond.alternate, scoped, fold);
            return true;
        };
        let (live, dead) = if pick {
            (&cond.consequent, &cond.alternate)
        } else {
            (&cond.alternate, &cond.consequent)
        };
        fold.dead_arms
            .push(super::super::conditional::dead_arm(dead, pick, scoped));
        fold_operand(op, live, scoped, fold);
        return true;
    }
    if let Expression::LogicalExpression(log) = expr {
        if !is_guard_expression(&log.left) {
            fold_operand(op, &log.left, scoped, fold);
        }
        if !is_guard_expression(&log.right) {
            fold_operand(op, &log.right, scoped, fold);
        }
        return true;
    }
    false
}

/// A template operand folds first: folded strings refuse (S15), while part
/// refusals surface directly — a re-walk would leak string wants past the
/// operator and diagnose the same parts twice.
fn fold_template_operand<'ast, 'expr>(
    op: UnaryOperator,
    lit: &TemplateLiteral<'_>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    let sub = fold_template(lit, scoped);
    if !sub.values.is_empty() {
        // -`4px`  — strings never fold through unary, folded or literal
        fold.refusals.push(UnaryRefusal::NonNumericOperand(op));
    }
    fold.template_refusals.extend(sub.refusals);
    true
}

fn fold_member<'ast, 'expr>(
    op: UnaryOperator,
    expr: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
    fold: &mut UnaryFold<'ast, 'expr>,
) -> bool {
    if let Expression::StaticMemberExpression(mem) = expr {
        if let Expression::Identifier(obj) = &mem.object {
            let leaves = scoped.object_prop_leaves(obj.name.as_str(), mem.property.name.as_str());
            if !leaves.is_empty() {
                // -theme.gap  — the operator applies to every leaf
                for leaf in leaves {
                    apply_operator(op, leaf, fold);
                }
                return true;
            }
        }
        fold.dynamic.push(expr);
        return true;
    }
    false
}
