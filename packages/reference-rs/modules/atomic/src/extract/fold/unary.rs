//! Constant folding for unary expressions, shared by both extraction walkers.
//!
//! `fold_unary` resolves one `-`/`+`/`!`/`~` over literal and const-resolved
//! numeric/boolean operands and refuses anything else, so the want walker
//! (`walk.rs`) and the plan walker (`ast_value.rs`) agree leaf-for-leaf by
//! construction instead of by mirrored match arms. Operands distribute over
//! ternaries and logicals per the engine's open-test rule, borrowing the
//! walker's guard predicate until the Ph3 logical node lands. `typeof` and
//! `delete` never fold; strings refuse where Panda coerces (S15), because a
//! fold that would need `Number()` belongs to Ph3 canonicalization, not here.

use oxc_ast::ast::{Expression, TemplateLiteral, UnaryOperator};

use super::template::{fold_template, TemplateRefusal};
use crate::atom::AtomValue;
use crate::extract::expressions::walk::is_guard_expression;
use crate::extract::scope::Scoped;

/// Folded leaves plus the refusals and dynamic operands left behind.
#[derive(Default)]
pub struct UnaryFold<'ast, 'expr> {
    /// One value per folded leaf; multi-leaf consts fan out here.
    pub values: Vec<AtomValue>,
    /// One refusal per leaf or operator the node could not fold.
    pub refusals: Vec<UnaryRefusal>,
    /// Template-part refusals surfaced without a re-walk, which would leak
    /// string wants past the operator that refused them.
    pub template_refusals: Vec<TemplateRefusal>,
    /// Arms eliminated inside nested tests, always diagnosed by the caller.
    pub dead_arms: Vec<super::conditional::DeadArm>,
    /// Dynamic sub-operands the want walker re-walks for their own diagnostics.
    pub dynamic: Vec<&'expr Expression<'ast>>,
}

/// Why one leaf or operator did not fold.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnaryRefusal {
    /// `typeof` / `delete`: the operator never folds in any position.
    OperatorNotFoldable(UnaryOperator),
    /// A static leaf the operator cannot apply to (`-` on a string, `~` on a bool).
    NonNumericOperand(UnaryOperator),
    /// An array or object operand, which unary operators never fold through.
    UnfoldableOperand(UnaryOperator, &'static str),
}

impl UnaryRefusal {
    /// Short reason text, reused inside template-part diagnostics.
    pub fn detail(&self) -> String {
        match self {
            Self::OperatorNotFoldable(op) => {
                format!("operator '{}' is not foldable", operator_name(*op))
            }
            Self::NonNumericOperand(op) => format!(
                "operator '{}' does not apply to a non-numeric value",
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
const OPERATOR_NAMES: [(UnaryOperator, &str); 7] = [
    (UnaryOperator::UnaryNegation, "-"),
    (UnaryOperator::UnaryPlus, "+"),
    (UnaryOperator::LogicalNot, "!"),
    (UnaryOperator::BitwiseNot, "~"),
    (UnaryOperator::Typeof, "typeof"),
    (UnaryOperator::Delete, "delete"),
    (UnaryOperator::Void, "void"),
];

fn operator_name(op: UnaryOperator) -> &'static str {
    OPERATOR_NAMES
        .iter()
        .find(|(candidate, _)| *candidate == op)
        .map_or("?", |(_, name)| *name)
}

/// Fold one unary expression over its operand's static leaves.
pub fn fold_unary<'ast, 'expr>(
    op: UnaryOperator,
    argument: &'expr Expression<'ast>,
    scoped: Scoped<'_>,
) -> UnaryFold<'ast, 'expr> {
    let mut fold = UnaryFold::default();
    if matches!(op, UnaryOperator::Typeof | UnaryOperator::Delete) {
        // typeof x  /  delete x.y  — the operator never folds
        fold.refusals.push(UnaryRefusal::OperatorNotFoldable(op));
        return fold;
    }
    if op == UnaryOperator::Void {
        // void 0  — omitted by the callers; the node yields nothing
        return fold;
    }
    fold_operand(op, argument, scoped, &mut fold);
    fold
}

/// Resolve one operand position; each probe takes the shapes it knows.
fn fold_operand<'ast, 'expr>(
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
        let test = super::conditional::fold_test(&cond.test, scoped);
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
            .push(super::conditional::dead_arm(dead, pick, scoped));
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

fn apply_operator(op: UnaryOperator, leaf: &AtomValue, fold: &mut UnaryFold<'_, '_>) {
    match leaf {
        AtomValue::Number(raw) => apply_to_parsed_number(op, raw, fold),
        AtomValue::Bool(b) => apply_to_bool(op, *b, fold),
        AtomValue::Null => {
            // const n = null; -n  — null strips
        }
        AtomValue::String(_) | AtomValue::Token { .. } => {
            fold.refusals.push(UnaryRefusal::NonNumericOperand(op));
        }
    }
}

fn apply_to_parsed_number(op: UnaryOperator, raw: &str, fold: &mut UnaryFold<'_, '_>) {
    match raw.parse::<f64>() {
        Ok(x) => apply_to_number(op, x, fold),
        Err(_) => {
            fold.refusals.push(UnaryRefusal::NonNumericOperand(op));
        }
    }
}

fn apply_to_number(op: UnaryOperator, x: f64, fold: &mut UnaryFold<'_, '_>) {
    match op {
        UnaryOperator::UnaryNegation => {
            fold.values.push(AtomValue::Number(canon_number(-x)));
        }
        UnaryOperator::UnaryPlus => {
            fold.values.push(AtomValue::Number(canon_number(x)));
        }
        UnaryOperator::LogicalNot => {
            fold.values.push(AtomValue::Bool(is_falsy_number(x)));
        }
        UnaryOperator::BitwiseNot => {
            // ~5  — JS ToInt32 (mod-2^32 wrap), then flip
            fold.values
                .push(AtomValue::Number(canon_number(f64::from(!to_int32(x)))));
        }
        _ => {
            fold.refusals.push(UnaryRefusal::OperatorNotFoldable(op));
        }
    }
}

fn is_falsy_number(x: f64) -> bool {
    x == 0.0 || x.is_nan()
}

/// JavaScript `ToInt32`: non-finite → 0, else truncate and wrap mod 2³².
fn to_int32(x: f64) -> i32 {
    let t = if x.is_finite() { x.trunc() } else { 0.0 };
    t.rem_euclid(4294967296.0) as u32 as i32
}

fn apply_to_bool(op: UnaryOperator, b: bool, fold: &mut UnaryFold<'_, '_>) {
    match op {
        UnaryOperator::LogicalNot => {
            fold.values.push(AtomValue::Bool(!b));
        }
        UnaryOperator::UnaryNegation | UnaryOperator::UnaryPlus | UnaryOperator::BitwiseNot => {
            // -true  — booleans are non-numeric for arithmetic and bitwise
            fold.refusals.push(UnaryRefusal::NonNumericOperand(op));
        }
        _ => {
            fold.refusals.push(UnaryRefusal::OperatorNotFoldable(op));
        }
    }
}

pub(crate) fn canon_number(x: f64) -> Box<str> {
    if x == 0.0 {
        Box::from("0")
    } else {
        x.to_string().into_boxed_str()
    }
}
