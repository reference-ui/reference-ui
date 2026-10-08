//! Authored-position argument folding for pure-helper calls (SPEC-V2-39).
//!
//! `ArgFold` folds one call argument at a time in authored position:
//! literals, captures, templates, unary, binary, member reads, ternaries,
//! and logicals. Templates, unary, and binary reuse the landed fold nodes;
//! ternaries pick on folded tests and union open ones; logicals skip guards,
//! short-circuit folded lefts, and diagnose unfoldable non-guard sides.
//! Array and object arguments live in `call_object`.

use oxc_ast::ast::{ChainElement, Expression};
use oxc_span::{GetSpan, Span};

use super::call::CallRefusal;
use super::fence::FenceValue;
use super::fence_coerce::{property_key, truthy};
use super::fence_lower::bake_capture;
use crate::atom::AtomValue;
use crate::extract::expressions::walk::{is_guard_expression, unwrap_wrapper_target};
use crate::extract::scope::Scoped;

/// Argument-folding session: scope lookup plus accumulating refusals.
pub(crate) struct ArgFold<'a> {
    scoped: Scoped<'a>,
    refusals: Vec<CallRefusal>,
}

impl<'a> ArgFold<'a> {
    /// A fresh session over one call site's scope.
    pub(crate) fn new(scoped: Scoped<'a>) -> Self {
        ArgFold {
            scoped,
            refusals: Vec::new(),
        }
    }

    /// The session's scope lookup.
    pub(crate) fn scoped(&self) -> Scoped<'a> {
        self.scoped
    }

    /// Take the accumulated refusals for the want walker.
    pub(crate) fn take_refusals(self) -> Vec<CallRefusal> {
        self.refusals
    }
}

impl ArgFold<'_> {
    /// Fold one argument in authored position, peeling wrappers first.
    pub(crate) fn fold_arg(&mut self, expr: &Expression<'_>) -> Option<FenceValue> {
        let mut expr = expr;
        while let Some(inner) = unwrap_wrapper_target(expr) {
            expr = inner;
        }
        if let Some(lit) = arg_literal(expr) {
            return Some(lit);
        }
        if let Some(value) = self.fold_value_arg(expr) {
            return Some(value);
        }
        if let Some(value) = self.fold_access_arg(expr) {
            return Some(value);
        }
        if let Some(value) = self.fold_branch_arg(expr) {
            return Some(value);
        }
        self.fold_shape_arg(expr)
    }

    /// Fold identifier, template, and unary arguments through shared nodes.
    pub(crate) fn fold_value_arg(&mut self, expr: &Expression<'_>) -> Option<FenceValue> {
        match expr {
            Expression::Identifier(ident) => self.fold_ident(ident.name.as_str()),
            Expression::TemplateLiteral(lit) => self.fold_template_arg(lit),
            Expression::UnaryExpression(unary) => self.fold_unary_arg(unary),
            _ => None,
        }
    }

    /// Fold member and chain arguments over folded bases.
    pub(crate) fn fold_access_arg(&mut self, expr: &Expression<'_>) -> Option<FenceValue> {
        match expr {
            Expression::StaticMemberExpression(member) => {
                self.fold_static_arg(&member.object, member.property.name.as_str())
            }
            Expression::ComputedMemberExpression(member) => {
                self.fold_computed_arg(&member.object, &member.expression)
            }
            Expression::ChainExpression(chain) => self.fold_chain_arg(chain),
            _ => None,
        }
    }

    /// Fold conditional and logical arguments with branch leniency.
    pub(crate) fn fold_branch_arg(&mut self, expr: &Expression<'_>) -> Option<FenceValue> {
        match expr {
            Expression::ConditionalExpression(cond) => self.fold_conditional_arg(cond),
            Expression::LogicalExpression(logical) => self.fold_logical_arg(logical),
            _ => None,
        }
    }

    /// Fold array, object, and binary arguments; the rest refuse.
    pub(crate) fn fold_shape_arg(&mut self, expr: &Expression<'_>) -> Option<FenceValue> {
        match expr {
            Expression::ArrayExpression(arr) => super::call_object::fold_array_arg(self, arr),
            Expression::ObjectExpression(obj) => super::call_object::fold_object_arg(self, obj),
            Expression::BinaryExpression(bin) => self.fold_binary_arg(bin),
            // Calls, functions, and effects refuse outright.
            _ => None,
        }
    }

    /// Fold an identifier argument: free `undefined` is null, else a capture.
    pub(crate) fn fold_ident(&mut self, name: &str) -> Option<FenceValue> {
        if name == "undefined" {
            let null = FenceValue::Leaves(vec![AtomValue::Null]);
            return Some(null);
        }
        bake_capture(name, self.scoped)
    }

    /// Fold a template argument through the shared template node: any
    /// refused part refuses the whole argument, exactly like v2.
    pub(crate) fn fold_template_arg(
        &mut self,
        lit: &oxc_ast::ast::TemplateLiteral<'_>,
    ) -> Option<FenceValue> {
        let fold = super::template::fold_template(lit, self.scoped);
        if !fold.refusals.is_empty() || fold.values.is_empty() {
            return None;
        }
        let leaves = fold
            .values
            .iter()
            .map(|value| AtomValue::String(value.as_str().into()))
            .collect();
        Some(FenceValue::Leaves(leaves))
    }

    /// Fold a unary argument through the shared unary node; `void` is null
    /// by house rule, and any node refusal fails the whole argument.
    pub(crate) fn fold_unary_arg(
        &mut self,
        unary: &oxc_ast::ast::UnaryExpression<'_>,
    ) -> Option<FenceValue> {
        use oxc_ast::ast::UnaryOperator;
        if unary.operator == UnaryOperator::Void {
            let null = FenceValue::Leaves(vec![AtomValue::Null]);
            return Some(null);
        }
        if matches!(
            unary.operator,
            UnaryOperator::Typeof | UnaryOperator::Delete
        ) {
            return None;
        }
        let fold = super::unary::fold_unary(unary.operator, &unary.argument, self.scoped);
        if fold.values.is_empty()
            || !fold.refusals.is_empty()
            || !fold.template_refusals.is_empty()
            || !fold.dynamic.is_empty()
        {
            return None;
        }
        Some(FenceValue::Leaves(fold.values))
    }

    /// Fold a binary argument through the shared binary node; any node
    /// refusal or dynamic operand fails the whole argument.
    pub(crate) fn fold_binary_arg(
        &mut self,
        bin: &oxc_ast::ast::BinaryExpression<'_>,
    ) -> Option<FenceValue> {
        let fold = super::binary::fold_binary(bin.operator, &bin.left, &bin.right, self.scoped);
        if fold.values.is_empty()
            || !fold.refusals.is_empty()
            || !fold.unary_refusals.is_empty()
            || !fold.template_refusals.is_empty()
            || !fold.dynamic.is_empty()
        {
            return None;
        }
        Some(FenceValue::Leaves(fold.values))
    }

    /// Fold a static member argument over a folded object base.
    pub(crate) fn fold_static_arg(
        &mut self,
        object: &Expression<'_>,
        prop: &str,
    ) -> Option<FenceValue> {
        let FenceValue::Object(entries) = self.fold_arg(object)? else {
            return None;
        };
        entries
            .iter()
            .rev()
            .find(|(key, _)| key.as_ref() == prop)
            .map(|(_, value)| value.clone())
    }

    /// Fold a computed argument over a folded object or array base.
    pub(crate) fn fold_computed_arg(
        &mut self,
        object: &Expression<'_>,
        index: &Expression<'_>,
    ) -> Option<FenceValue> {
        let base = self.fold_arg(object)?;
        let key = property_key(&self.fold_arg(index)?)?;
        match base {
            FenceValue::Object(entries) => entries
                .iter()
                .rev()
                .find(|(name, _)| name.as_ref() == key)
                .map(|(_, value)| value.clone()),
            FenceValue::Array(items) => {
                let position: usize = key.parse().ok()?;
                items.get(position).cloned()
            }
            FenceValue::Leaves(_) => None,
        }
    }

    /// Fold a chain argument: member links unwrap transparently, calls refuse.
    pub(crate) fn fold_chain_arg(
        &mut self,
        chain: &oxc_ast::ast::ChainExpression<'_>,
    ) -> Option<FenceValue> {
        match &chain.expression {
            ChainElement::StaticMemberExpression(member) => {
                self.fold_static_arg(&member.object, member.property.name.as_str())
            }
            ChainElement::ComputedMemberExpression(member) => {
                self.fold_computed_arg(&member.object, &member.expression)
            }
            ChainElement::TSNonNullExpression(inner) => self.fold_arg(&inner.expression),
            ChainElement::CallExpression(_) | ChainElement::PrivateFieldExpression(_) => None,
        }
    }

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

    /// Record one refused fragment for the want walker to diagnose.
    pub(crate) fn refuse(&mut self, span: Span, detail: &str) {
        self.refusals.push(CallRefusal::new(span, detail));
    }
}

/// Fold a literal argument to its single leaf.
fn arg_literal(expr: &Expression<'_>) -> Option<FenceValue> {
    let leaf = match expr {
        Expression::StringLiteral(lit) => AtomValue::String(lit.value.as_str().into()),
        Expression::NumericLiteral(lit) => AtomValue::Number(lit.value.to_string().into()),
        Expression::BooleanLiteral(lit) => AtomValue::Bool(lit.value),
        Expression::NullLiteral(_) => AtomValue::Null,
        _ => return None,
    };
    Some(FenceValue::Leaves(vec![leaf]))
}

/// True for a single null leaf, the `??` trigger.
fn is_null_value(value: &FenceValue) -> bool {
    matches!(
        value,
        FenceValue::Leaves(leaves) if matches!(leaves.as_slice(), [AtomValue::Null])
    )
}
