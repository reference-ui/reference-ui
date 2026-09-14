//! Style object property traversal and condition nesting.
//!
//! Handles recursive traversal of JavaScript object literals inside `css({...})` and JSX props.
//! Dispatches condition keys (pseudo-classes, responsive breakpoints) into nested condition
//! scopes and creates dedicated `LeafWalk` contexts for each style property.

use oxc_ast::ast::{
    Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind, PropertyKey, SpreadElement,
};
use smallvec::SmallVec;

use super::walk::{walk_expression, LeafWalk};
use crate::atom::Want;
use crate::diagnostics::Diagnostic;
use crate::extract::constants::LocalConstants;
use canon::is_condition_prop;

/// Context for traversing a style object literal to extract property wants.
pub struct ObjectWalk<'a> {
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub constants: &'a LocalConstants,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> ObjectWalk<'a> {
    /// Create a child LeafWalk context for a specific property.
    pub fn leaf_walk<'b>(&'b mut self, prop: &'b str) -> LeafWalk<'b> {
        LeafWalk {
            prop,
            origin: self.origin,
            important: self.important,
            file: self.file,
            constants: self.constants,
            wants: self.wants,
            diagnostics: self.diagnostics,
        }
    }

    /// Report a diagnostic warning at the current file.
    pub fn warn(&mut self, message: impl Into<String>) {
        self.diagnostics.push(
            Diagnostic::warning(message.into()).with_location(self.file, None, None),
        );
    }
}

/// Traverse a style object literal, nesting conditions and extracting property leaves.
pub fn walk_style_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::ObjectProperty(prop) => {
                handle_object_property(ctx, prop, when);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                handle_spread_property(ctx, spread, when);
            }
        }
    }
}

fn handle_object_property(
    ctx: &mut ObjectWalk<'_>,
    prop: &ObjectProperty<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let Some(key) = resolve_property_key(&prop.key) else {
        ctx.warn("Dynamic computed property key encountered in style object");
        return;
    };

    if key == "r" {
        if let Expression::ObjectExpression(r_obj) = &prop.value {
            handle_responsive_r_object(ctx, r_obj, when);
            return;
        }
    }

    if is_condition_prop(&key) {
        let mut nested_when = when.clone();
        nested_when.push(key.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    } else {
        let mut leaf_ctx = ctx.leaf_walk(&key);
        walk_expression(&mut leaf_ctx, &prop.value, when);
    }
}

fn handle_responsive_r_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(bp) = resolve_property_key(&prop.key) else {
            continue;
        };
        let width = bp.trim();
        if width.parse::<f64>().is_ok() {
            let mut nested_when = when.clone();
            nested_when.push(format!("@container (min-width: {width}px)").into());
            handle_condition_value(ctx, &prop.value, &nested_when);
        }
    }
}

fn resolve_property_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        PropertyKey::TemplateLiteral(lit) if lit.expressions.is_empty() => {
            lit.quasis.first().map(|q| q.value.raw.to_string())
        }
        _ => None,
    }
}

fn handle_condition_value(
    ctx: &mut ObjectWalk<'_>,
    value: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match value {
        Expression::ObjectExpression(inner_obj) => {
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            handle_condition_value(ctx, &cond.consequent, when);
            handle_condition_value(ctx, &cond.alternate, when);
        }
        Expression::ParenthesizedExpression(p) => {
            handle_condition_value(ctx, &p.expression, when);
        }
        _ => {
            ctx.warn("Condition block expected object expression");
        }
    }
}

fn handle_spread_property(
    ctx: &mut ObjectWalk<'_>,
    spread: &SpreadElement<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    handle_spread_argument(ctx, &spread.argument, when);
}

fn handle_spread_argument(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::ObjectExpression(inner_obj) => {
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            handle_spread_argument(ctx, &cond.consequent, when);
            handle_spread_argument(ctx, &cond.alternate, when);
        }
        Expression::LogicalExpression(log) => {
            handle_spread_argument(ctx, &log.left, when);
            handle_spread_argument(ctx, &log.right, when);
        }
        Expression::ParenthesizedExpression(p) => {
            handle_spread_argument(ctx, &p.expression, when);
        }
        _ => {
            ctx.warn(
                "Dynamic object spread encountered in style object; keeping sibling properties",
            );
        }
    }
}
