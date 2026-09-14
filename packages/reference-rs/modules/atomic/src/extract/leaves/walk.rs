//! Recursive leaf literal collector for style expressions.
//!
//! Traverses AST expressions to extract literal style values into `Want` declarations.
//! Unconditionally scoops both branches of ternaries and logical operators, preserving
//! responsive array ordering and condition scopes without evaluating runtime JavaScript.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, ConditionalExpression, Expression, LogicalExpression,
    UnaryExpression, UnaryOperator,
};
use smallvec::SmallVec;

use super::literal::{
    extract_template_literal, push_bool_want, push_number_want, push_string_want,
};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::Diagnostic;
use crate::extract::constants::LocalConstants;
use canon::default_breakpoint_for_index;

/// Context for traversing an expression tree to extract style leaf values.
pub struct LeafWalk<'a> {
    pub prop: &'a str,
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub constants: &'a LocalConstants,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> LeafWalk<'a> {
    /// Push an extracted Want to the collection.
    pub fn push_want(&mut self, value: AtomValue, when: SmallVec<[Box<str>; 2]>, important: bool) {
        self.wants.push(
            Want::new(self.prop, value)
                .with_when(when)
                .with_important(self.important || important)
                .with_origin(self.origin),
        );
    }

    /// Report a diagnostic warning at the current file.
    pub fn warn(&mut self, message: impl Into<String>) {
        self.diagnostics.push(
            Diagnostic::warning(message.into()).with_location(self.file, None, None),
        );
    }
}

/// Recursively collect style leaves from an expression into Wants.
pub fn walk_expression(
    ctx: &mut LeafWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if walk_literal(ctx, expr, when) {
        return;
    }
    if walk_wrapper(ctx, expr, when) {
        return;
    }
    if walk_branching(ctx, expr, when) {
        return;
    }
    walk_fallback(ctx, expr, when);
}

fn walk_literal(
    ctx: &mut LeafWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::StringLiteral(lit) => {
            push_string_want(ctx, lit, when);
            true
        }
        Expression::NumericLiteral(lit) => {
            push_number_want(ctx, lit, when);
            true
        }
        Expression::BooleanLiteral(lit) => {
            push_bool_want(ctx, lit.value, when);
            true
        }
        Expression::NullLiteral(_) => true,
        _ => false,
    }
}

fn walk_wrapper(
    ctx: &mut LeafWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    let Some(target) = unwrap_wrapper_target(expr) else {
        return false;
    };
    walk_expression(ctx, target, when);
    true
}

fn unwrap_wrapper_target<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::ParenthesizedExpression(p) => Some(&p.expression),
        Expression::TSAsExpression(as_expr) => Some(&as_expr.expression),
        Expression::TSSatisfiesExpression(sat) => Some(&sat.expression),
        Expression::TSNonNullExpression(non_null) => Some(&non_null.expression),
        _ => None,
    }
}

fn walk_branching(
    ctx: &mut LeafWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ConditionalExpression(cond) => {
            walk_conditional(ctx, cond, when);
            true
        }
        Expression::LogicalExpression(log) => {
            walk_logical(ctx, log, when);
            true
        }
        Expression::ArrayExpression(arr) => {
            walk_array(ctx, arr, when);
            true
        }
        _ => false,
    }
}

fn walk_fallback(
    ctx: &mut LeafWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::TemplateLiteral(lit) => {
            extract_template_literal(ctx, lit, when);
        }
        Expression::Identifier(ident) => {
            handle_identifier_fallback(ctx, ident.name.as_str(), when);
        }
        Expression::StaticMemberExpression(mem) => {
            handle_static_member(ctx, mem, when);
        }
        Expression::UnaryExpression(unary) => {
            handle_unary(ctx, unary, when);
        }
        _ => {
            let prop = ctx.prop;
            ctx.warn(format!(
                "Dynamic non-literal expression encountered for prop '{prop}'"
            ));
        }
    }
}

fn handle_identifier_fallback(
    ctx: &mut LeafWalk<'_>,
    name: &str,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(val) = ctx.constants.get_scalar(name) {
        ctx.push_want(val.clone(), when.clone(), false);
    } else {
        handle_identifier(ctx, name);
    }
}

fn handle_static_member(
    ctx: &mut LeafWalk<'_>,
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Expression::Identifier(obj_id) = &mem.object {
        let obj_name = obj_id.name.as_str();
        let prop_name = mem.property.name.as_str();
        if let Some(val) = ctx.constants.get_object_prop(obj_name, prop_name) {
            ctx.push_want(val.clone(), when.clone(), false);
            return;
        }
    }
    let prop = ctx.prop;
    ctx.warn(format!(
        "Dynamic non-literal expression encountered for prop '{prop}'"
    ));
}

fn walk_conditional(
    ctx: &mut LeafWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    walk_expression(ctx, &cond.consequent, when);
    walk_expression(ctx, &cond.alternate, when);
}

fn walk_logical(
    ctx: &mut LeafWalk<'_>,
    log: &LogicalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if !is_guard_expression(&log.left) {
        walk_expression(ctx, &log.left, when);
    }
    if !is_guard_expression(&log.right) {
        walk_expression(ctx, &log.right, when);
    }
}

fn is_guard_expression(expr: &Expression<'_>) -> bool {
    matches!(
        expr,
        Expression::BooleanLiteral(_)
            | Expression::BinaryExpression(_)
            | Expression::NullLiteral(_)
    ) || is_undefined_or_null_ident(expr)
}

fn is_undefined_or_null_ident(expr: &Expression<'_>) -> bool {
    if let Expression::Identifier(ident) = expr {
        ident.name == "undefined" || ident.name == "null"
    } else {
        false
    }
}

fn walk_array(
    ctx: &mut LeafWalk<'_>,
    arr: &ArrayExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    for (idx, elem) in arr.elements.iter().enumerate() {
        let Some(breakpoint) = default_breakpoint_for_index(idx) else {
            continue;
        };
        let mut item_when = when.clone();
        item_when.push(breakpoint.into());
        match elem {
            ArrayExpressionElement::Elision(_) => {}
            _ => {
                if let Some(expr) = elem.as_expression() {
                    walk_expression(ctx, expr, &item_when);
                }
            }
        }
    }
}

fn handle_identifier(ctx: &mut LeafWalk<'_>, name: &str) {
    if name == "undefined" || name == "null" {
        return;
    }
    let prop = ctx.prop;
    ctx.warn(format!(
        "Dynamic non-literal identifier '{name}' encountered for prop '{prop}'"
    ));
}

fn handle_unary(
    ctx: &mut LeafWalk<'_>,
    unary: &UnaryExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if unary.operator == UnaryOperator::Void {
        return;
    }
    if let (UnaryOperator::UnaryNegation, Expression::NumericLiteral(lit)) =
        (unary.operator, &unary.argument)
    {
        let val = format!("-{}", lit.value);
        ctx.push_want(AtomValue::Number(val.into_boxed_str()), when.clone(), false);
        return;
    }
    walk_expression(ctx, &unary.argument, when);
}
