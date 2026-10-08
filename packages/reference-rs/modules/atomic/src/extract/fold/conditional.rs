//! Literal-test folding for ternaries, shared by every branch walker.
//!
//! [`fold_test`] lowers a ternary test to its boolean when the test folds to
//! a single leaf through the table (literals, const-resolved names,
//! comparisons, `!`, clean nested folds), picking by truthiness the way v2's
//! `eval_conditional` does. An open test stays open — both arms walk exactly
//! as before. Every arm eliminated anywhere (value, spread, condition block,
//! `css()` arg, or nested inside another fold) reports a [`DeadArm`], so the
//! dead arm is always named and never silently dropped.

use oxc_ast::ast::Expression;
use oxc_span::{GetSpan, Span};

use super::coerce::truthy;
use super::operand::{operand_leaves, peel_wrappers, Operand};
use crate::atom::AtomValue;
use crate::extract::scope::Scoped;

/// One eliminated dead arm: where it sat, what it was, and the test value.
pub struct DeadArm {
    /// Span of the eliminated arm, for the located info diagnostic.
    pub span: Span,
    /// Short summary of the arm (`'blue'`, `4`, `object`).
    pub summary: String,
    /// The folded test value that eliminated it.
    pub test_value: bool,
}

impl DeadArm {
    /// The info text naming the dead arm at one site.
    pub fn message(&self, site: &str) -> String {
        format!(
            "dead branch {} {} (test folds to {})",
            self.summary, site, self.test_value
        )
    }
}

/// A folded ternary test: its value plus arms eliminated inside the test.
///
/// The test subtree is never walked, so consumers emit `dead_arms` on both
/// the folded and the open path. The consumer owns its own arms: `fold_test`
/// never reports the consequent or alternate it chose between.
pub struct TestFold {
    /// The test value when it folded to a single truthy-or-falsy leaf.
    pub value: Option<bool>,
    /// Arms eliminated while folding the test subtree itself.
    pub dead_arms: Vec<DeadArm>,
}

/// Fold one ternary test to its boolean, or open with its inner dead arms.
///
/// Single-leaf tests pick by truthiness (`'x'` is truthy, `0` is falsy);
/// multi-leaf and dynamic tests stay open. Nested binary, unary, logical,
/// template, and ternary tests fold through their own nodes when clean.
/// Object, array, and call tests stay open: they need lowering nodes this
/// slice does not build, and an open test keeps both arms either way.
pub fn fold_test(test: &Expression<'_>, scoped: Scoped<'_>) -> TestFold {
    let test = peel_wrappers(test);
    if let Operand::Leaves(leaves) = operand_leaves(test, scoped) {
        return TestFold {
            value: single_truthy(&leaves),
            dead_arms: Vec::new(),
        };
    }
    fold_nested_test(test, scoped)
}

/// Truthiness when the leaves are exactly one decidable leaf.
fn single_truthy(leaves: &[AtomValue]) -> Option<bool> {
    if let [only] = leaves {
        truthy(only)
    } else {
        None
    }
}

/// Fold a test that needs a nested node, or open when no node takes it.
fn fold_nested_test(test: &Expression<'_>, scoped: Scoped<'_>) -> TestFold {
    if let Expression::BinaryExpression(binary) = test {
        return binary_test(binary, scoped);
    }
    if let Expression::UnaryExpression(unary) = test {
        return unary_test(unary, scoped);
    }
    if let Expression::LogicalExpression(log) = test {
        return logical_test(log, scoped);
    }
    if let Expression::TemplateLiteral(lit) = test {
        return template_test(lit, scoped);
    }
    if let Expression::ConditionalExpression(cond) = test {
        return conditional_test(cond, scoped);
    }
    TestFold {
        value: None,
        dead_arms: Vec::new(),
    }
}

/// A binary test folds when it yields one clean leaf (`2 + 2 === 4`).
fn binary_test(binary: &oxc_ast::ast::BinaryExpression<'_>, scoped: Scoped<'_>) -> TestFold {
    let fold = super::binary::fold_binary(binary.operator, &binary.left, &binary.right, scoped);
    TestFold {
        value: clean_truthy(&fold.values, is_clean_binary(&fold)),
        dead_arms: fold.dead_arms,
    }
}

/// True when a binary fold is exactly one leaf with no residue.
fn is_clean_binary(fold: &super::binary::BinaryFold<'_, '_>) -> bool {
    fold.values.len() == 1
        && fold.refusals.is_empty()
        && fold.unary_refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}

/// Truthiness of one clean leaf, or open when unclean or undecidable.
fn clean_truthy(leaves: &[AtomValue], clean: bool) -> Option<bool> {
    if clean {
        single_truthy(leaves)
    } else {
        None
    }
}

/// A unary test folds when it yields one clean leaf (`!flag`, `!true`).
fn unary_test(unary: &oxc_ast::ast::UnaryExpression<'_>, scoped: Scoped<'_>) -> TestFold {
    let fold = super::unary::fold_unary(unary.operator, &unary.argument, scoped);
    TestFold {
        value: clean_truthy(&fold.values, is_clean_unary(&fold)),
        dead_arms: fold.dead_arms,
    }
}

/// True when a unary fold is exactly one leaf with no residue.
fn is_clean_unary(fold: &super::unary::UnaryFold<'_, '_>) -> bool {
    fold.values.len() == 1
        && fold.refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}

/// A logical test folds through the logical node (`a && b` as a test).
fn logical_test(log: &oxc_ast::ast::LogicalExpression<'_>, scoped: Scoped<'_>) -> TestFold {
    let fold = super::logical::fold_logical(log.operator, &log.left, &log.right, scoped);
    TestFold {
        value: fold.value.as_ref().and_then(truthy),
        dead_arms: fold.dead_arms,
    }
}

/// A template test folds when it joins one clean string (`` `${x}` ``).
fn template_test(lit: &oxc_ast::ast::TemplateLiteral<'_>, scoped: Scoped<'_>) -> TestFold {
    let fold = super::template::fold_template(lit, scoped);
    let clean = fold.values.len() == 1 && fold.refusals.is_empty();
    TestFold {
        value: template_truthy(&fold.values, clean),
        dead_arms: Vec::new(),
    }
}

/// Truthiness of one joined template string, or open when unclean.
fn template_truthy(values: &[String], clean: bool) -> Option<bool> {
    if clean {
        values.first().map(|joined| !joined.is_empty())
    } else {
        None
    }
}

/// A ternary test folds its own test, then reads the live arm's truthiness.
///
/// `(true ? 0 : 1) ? a : b` folds the inner test to `0`, which is falsy, so
/// the outer test is false. An open inner test keeps the outer open.
fn conditional_test(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    scoped: Scoped<'_>,
) -> TestFold {
    let inner = fold_test(&cond.test, scoped);
    let Some(pick) = inner.value else {
        return TestFold {
            value: None,
            dead_arms: inner.dead_arms,
        };
    };
    let (live, dead) = pick_arms(cond, pick);
    let mut dead_arms = inner.dead_arms;
    dead_arms.push(dead_arm(dead, pick, scoped));
    TestFold {
        value: live_truthy(live, scoped),
        dead_arms,
    }
}

/// The live and dead arms for a folded test value.
fn pick_arms<'a, 'b>(
    cond: &'b oxc_ast::ast::ConditionalExpression<'a>,
    pick: bool,
) -> (&'b Expression<'a>, &'b Expression<'a>) {
    if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    }
}

/// One dead arm: the arm's span and summary plus the test value.
pub fn dead_arm(dead: &Expression<'_>, test_value: bool, scoped: Scoped<'_>) -> DeadArm {
    DeadArm {
        span: dead.span(),
        summary: describe_arm(dead, scoped),
        test_value,
    }
}

/// Truthiness of a live arm that must be a single decidable leaf.
fn live_truthy(live: &Expression<'_>, scoped: Scoped<'_>) -> Option<bool> {
    if let Operand::Leaves(leaves) = operand_leaves(live, scoped) {
        single_truthy(&leaves)
    } else {
        None
    }
}

/// A short summary of an eliminated arm for the info diagnostic.
///
/// Arms that fold to one leaf print the value (`'blue'`, `4`, `null`);
/// anything else prints its kind (`object`, `array`, `template`,
/// `expression`).
fn describe_arm(arm: &Expression<'_>, scoped: Scoped<'_>) -> String {
    if let Operand::Leaves(leaves) = operand_leaves(arm, scoped) {
        if let [only] = leaves.as_slice() {
            return render_leaf(only);
        }
    }
    arm_kind(arm)
}

/// The kind word for an arm that folds to no single leaf.
fn arm_kind(arm: &Expression<'_>) -> String {
    match arm {
        Expression::ObjectExpression(_) => "object".to_string(),
        Expression::ArrayExpression(_) => "array".to_string(),
        Expression::TemplateLiteral(_) => "template".to_string(),
        _ => "expression".to_string(),
    }
}

/// One folded leaf as its info summary: strings quote, the rest print bare.
fn render_leaf(leaf: &AtomValue) -> String {
    match leaf {
        AtomValue::String(text) => format!("'{text}'"),
        AtomValue::Token { value, .. } => format!("'{value}'"),
        AtomValue::Number(raw) => raw.to_string(),
        AtomValue::Bool(on) => on.to_string(),
        AtomValue::Null => "null".to_string(),
    }
}
