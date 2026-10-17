//! Conditional and logical argument folding for call arguments: a ternary folds by its test or
//! unions its arms, and `&&`, `||`, and `??` fold by their left operand when it is known. Each
//! shape keeps whatever folds on either arm and records a refusal for the rest, so a call with an
//! open test still answers with its foldable leaves. Takes an argument expression on the argument
//! session and emits the folded value, or nothing, with refusals recorded on the session.

use oxc_span::GetSpan;

use super::super::fence::FenceValue;
use super::super::fence_coerce::truthy;
use super::{is_null_value, ArgFold};
use crate::extract::expressions::walk::is_guard_expression;

impl ArgFold<'_> {
    /// Fold a conditional argument: a folded test picks its arm, an open
    /// test unions both arms keeping whatever folds, verbatim v2's rule.
    pub(crate) fn fold_conditional_arg(
        &mut self,
        cond: &oxc_ast::ast::ConditionalExpression<'_>,
    ) -> Option<FenceValue> {
        if let Some(test_val) = self.fold_arg(&cond.test) {
            return self.pick_conditional_arm(cond, &test_val);
        }
        self.union_conditional_arms(cond)
    }

    /// Pick one conditional arm by the folded test's truthiness.
    fn pick_conditional_arm(
        &mut self,
        cond: &oxc_ast::ast::ConditionalExpression<'_>,
        test_val: &FenceValue,
    ) -> Option<FenceValue> {
        if truthy(test_val) {
            self.fold_arg(&cond.consequent)
        } else {
            self.fold_arg(&cond.alternate)
        }
    }

    /// Union both conditional arms, keeping a lone folded arm diagnosed.
    fn union_conditional_arms(
        &mut self,
        cond: &oxc_ast::ast::ConditionalExpression<'_>,
    ) -> Option<FenceValue> {
        let first = self.fold_arg(&cond.consequent);
        let second = self.fold_arg(&cond.alternate);
        match (first, second) {
            (Some(FenceValue::Leaves(mut left)), Some(FenceValue::Leaves(right))) => {
                left.extend(right);
                Some(FenceValue::Leaves(left))
            }
            (Some(only), None) => {
                self.refuse(cond.alternate.span(), "conditional arm");
                Some(only)
            }
            (None, Some(only)) => {
                self.refuse(cond.consequent.span(), "conditional arm");
                Some(only)
            }
            _ => None,
        }
    }

    /// Fold a logical argument: guards skip, an unfoldable non-guard left
    /// yields to the right with a diagnostic, folded lefts short-circuit.
    pub(crate) fn fold_logical_arg(
        &mut self,
        logical: &oxc_ast::ast::LogicalExpression<'_>,
    ) -> Option<FenceValue> {
        if is_guard_expression(&logical.left) {
            return self.fold_arg(&logical.right);
        }
        let Some(left_val) = self.fold_arg(&logical.left) else {
            let right = self.fold_arg(&logical.right)?;
            self.refuse(logical.left.span(), "logical operand");
            return Some(right);
        };
        self.fold_short_circuit(logical, &left_val)
    }

    /// Short-circuit a folded logical left, verbatim v2's operator rules.
    pub(crate) fn fold_short_circuit(
        &mut self,
        logical: &oxc_ast::ast::LogicalExpression<'_>,
        left_val: &FenceValue,
    ) -> Option<FenceValue> {
        use oxc_ast::ast::LogicalOperator;
        match logical.operator {
            LogicalOperator::And => self.arg_and(logical, left_val),
            LogicalOperator::Or => self.arg_or(logical, left_val),
            LogicalOperator::Coalesce => self.arg_coalesce(logical, left_val),
        }
    }

    /// Short-circuit an argument `&&` over its folded left.
    fn arg_and(
        &mut self,
        logical: &oxc_ast::ast::LogicalExpression<'_>,
        left_val: &FenceValue,
    ) -> Option<FenceValue> {
        if truthy(left_val) {
            self.fold_arg(&logical.right)
        } else {
            Some(left_val.clone())
        }
    }

    /// Short-circuit an argument `||` over its folded left.
    fn arg_or(
        &mut self,
        logical: &oxc_ast::ast::LogicalExpression<'_>,
        left_val: &FenceValue,
    ) -> Option<FenceValue> {
        if truthy(left_val) {
            Some(left_val.clone())
        } else {
            self.fold_arg(&logical.right)
        }
    }

    /// Short-circuit an argument `??`, yielding only on a null left.
    fn arg_coalesce(
        &mut self,
        logical: &oxc_ast::ast::LogicalExpression<'_>,
        left_val: &FenceValue,
    ) -> Option<FenceValue> {
        if is_null_value(left_val) {
            self.fold_arg(&logical.right)
        } else {
            Some(left_val.clone())
        }
    }
}
