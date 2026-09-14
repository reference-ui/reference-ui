//! Style object property traversal and condition nesting.
//!
//! Handles recursive traversal of JavaScript object literals inside `css({...})` and JSX props.
//! Dispatches condition keys into nested scopes, asks `resolve/r` for `r` prop queries, and
//! creates dedicated `ExpressionWalk` contexts for each style property.

use oxc_ast::ast::{
    Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind, PropertyKey, SpreadElement,
};
use smallvec::SmallVec;

use super::walk::{walk_expression, ExpressionWalk};
use crate::atom::Want;
use crate::config::BreakpointScale;
use crate::diagnostics::Diagnostic;
use crate::extract::constants::LocalConstants;
use crate::resolve::r;
use canon::{is_condition_prop, is_known_style_prop};

/// Context for traversing a style object literal to extract property wants.
pub struct ObjectWalk<'a> {
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub constants: &'a LocalConstants,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> ObjectWalk<'a> {
    /// Create a child ExpressionWalk context for a specific property.
    pub fn expression_walk<'b>(&'b mut self, prop: &'b str) -> ExpressionWalk<'b> {
        ExpressionWalk {
            prop,
            origin: self.origin,
            important: self.important,
            file: self.file,
            constants: self.constants,
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
        }
    }

    /// Report a diagnostic warning at the current file.
    pub fn warn(&mut self, message: impl Into<String>) {
        self.diagnostics
            .push(Diagnostic::warning(message.into()).with_location(self.file, None, None));
    }
}

/// Traverse a style object literal, nesting conditions and extracting property leaves.
pub fn walk_style_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // css({ color: 'red', _hover: { bg: 'n200' }, r: { md: { p: '1r' } } })
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::ObjectProperty(prop) => {
                // color: 'red'
                handle_object_property(ctx, prop, when);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                // ...{ margin: '10px' }
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
        // { [dynamicKey]: '10px' }
        ctx.warn("Dynamic computed property key encountered in style object");
        return;
    };

    if key == "r" {
        if let Expression::ObjectExpression(r_obj) = &prop.value {
            // r: { 300: { p: '1r' }, md: { mt: '2r' } }
            walk_r_object(ctx, r_obj, when);
            return;
        }
    }

    if is_condition_prop(&key) {
        // _hover: { bg: 'n200' }
        let mut nested_when = when.clone();
        nested_when.push(key.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    } else if is_known_style_prop(&key) {
        // color: 'red'  /  mt: '2r'
        let mut expr_ctx = ctx.expression_walk(&key);
        walk_expression(&mut expr_ctx, &prop.value, when);
    }
}

/// Walk an `r` prop object: each key becomes an `@container` condition wrapping nested styles.
pub fn walk_r_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // r={{ 300: { p: '1r' }, md: { mt: '2r' } }}
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(bp) = resolve_property_key(&prop.key) else {
            continue;
        };
        let Some(query) = r::lower_r_key(bp.trim(), ctx.breakpoints) else {
            // r={{ wat: { p: '1r' } }}
            ctx.warn(format!(
                "Unknown breakpoint name in r prop: \"{}\"",
                bp.trim()
            ));
            continue;
        };
        let mut nested_when = when.clone();
        nested_when.push(query.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    }
}

fn resolve_property_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // color:  /  _hover:
            Some(ident.name.to_string())
        }
        PropertyKey::StringLiteral(lit) => {
            // 'color':  /  'md':
            Some(lit.value.to_string())
        }
        PropertyKey::NumericLiteral(lit) => {
            // 300: { p: '1r' }
            Some(numeric_key(lit.value))
        }
        PropertyKey::TemplateLiteral(lit) => {
            // `md`: { mt: '2r' }
            static_template_key(lit)
        }
        _ => None,
    }
}

fn static_template_key(lit: &oxc_ast::ast::TemplateLiteral<'_>) -> Option<String> {
    // `md`  — static only; `${bp}` is dynamic
    if !lit.expressions.is_empty() {
        return None;
    }
    lit.quasis.first().map(|q| q.value.raw.to_string())
}

fn numeric_key(n: f64) -> String {
    // 300: { p: '1r' }
    if n.fract() == 0.0 {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

fn handle_condition_value(
    ctx: &mut ObjectWalk<'_>,
    value: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match value {
        Expression::ObjectExpression(inner_obj) => {
            // _hover: { color: 'red' }
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            // _hover: on ? { color: 'red' } : { color: 'blue' }
            handle_condition_value(ctx, &cond.consequent, when);
            handle_condition_value(ctx, &cond.alternate, when);
        }
        Expression::ParenthesizedExpression(p) => {
            // _hover: ({ color: 'red' })
            handle_condition_value(ctx, &p.expression, when);
        }
        _ => {
            // _hover: 'red'  — not an object
            ctx.warn("Condition block expected object expression");
        }
    }
}

fn handle_spread_property(
    ctx: &mut ObjectWalk<'_>,
    spread: &SpreadElement<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // ...{ margin: '10px' }
    handle_spread_argument(ctx, &spread.argument, when);
}

fn handle_spread_argument(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::ObjectExpression(inner_obj) => {
            // ...{ margin: '10px' }
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            // ...(on ? { padding: '10px' } : { gap: '8px' })
            handle_spread_argument(ctx, &cond.consequent, when);
            handle_spread_argument(ctx, &cond.alternate, when);
        }
        Expression::LogicalExpression(log) => {
            // ...(unk && { padding: '10px' })  /  ...(unk || { margin: '20px' })
            handle_spread_argument(ctx, &log.left, when);
            handle_spread_argument(ctx, &log.right, when);
        }
        Expression::ParenthesizedExpression(p) => {
            // ...({ margin: '10px' })
            handle_spread_argument(ctx, &p.expression, when);
        }
        _ => {
            // ...maybeFn()
            ctx.warn(
                "Dynamic object spread encountered in style object; keeping sibling properties",
            );
        }
    }
}
