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
use crate::atom::{AtomValue, Want};
use crate::diagnostics::Diagnostic;
use crate::extract::constants::LocalConstants;
use crate::resolve::r;
use base_system::BreakpointScale;
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
    pub authored: Option<&'a mut Vec<crate::runtime::AuthoredDeclaration>>,
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

    if is_condition_key(&key, ctx.breakpoints) {
        // _hover: { bg: 'n200' }
        let mut nested_when = when.clone();
        nested_when.push(key.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    } else if is_known_style_prop(&key) {
        // color: 'red'  /  mt: '2r'
        handle_known_style_prop(ctx, &key, &prop.value, when);
    }
}

fn is_condition_key(key: &str, breakpoints: &BreakpointScale) -> bool {
    is_condition_prop(key)
        || breakpoints.names().iter().any(|n| n == key)
        || is_breakpoint_range(key, breakpoints)
}

fn is_breakpoint_range(key: &str, breakpoints: &BreakpointScale) -> bool {
    if key.ends_with("Down") || key.ends_with("Only") {
        return true;
    }
    if let Some((from, to)) = key.split_once("To") {
        if to.eq_ignore_ascii_case("p") || to.starts_with('p') || to.starts_with('P') {
            return false;
        }
        return breakpoints.names().iter().any(|n| n.eq_ignore_ascii_case(from))
            || breakpoints.names().iter().any(|n| n.eq_ignore_ascii_case(to));
    }
    false
}

fn handle_known_style_prop(
    ctx: &mut ObjectWalk<'_>,
    key: &str,
    val_expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(authored) = ctx.authored.as_mut() {
        if let Some((val, imp)) = super::ast_value::ast_to_json_value(val_expr, ctx.constants) {
            let when_strings: Vec<String> = when.iter().map(|w| w.to_string()).collect();
            authored.push(crate::runtime::AuthoredDeclaration {
                when: when_strings,
                prop: key.to_string(),
                value: val,
                important: ctx.important || imp,
            });
        }
    }
    let mut expr_ctx = ctx.expression_walk(key);
    walk_expression(&mut expr_ctx, val_expr, when);
}

/// Walk an `r` prop object: each key becomes an `@container` condition wrapping nested styles.
pub fn walk_r_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // r={{ 300: { p: '1r' }, md: { mt: '2r' }, "card/md": { p: '1r' } }}
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(raw_key) = resolve_property_key(&prop.key) else {
            continue;
        };
        let trimmed = raw_key.trim();
        let Some(query) = resolve_r_key(trimmed, ctx.breakpoints) else {
            // r={{ wat: { p: '1r' } }}
            ctx.warn(format!(
                "Unknown breakpoint name in r prop: \"{}\"",
                trimmed
            ));
            continue;
        };
        let mut nested_when = when.clone();
        nested_when.push(query.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    }
}

fn resolve_r_key(key: &str, scale: &BreakpointScale) -> Option<String> {
    if let Some((container, bp)) = key.split_once('/') {
        r::lower_r_key_named(bp.trim(), scale, container.trim())
    } else if let Some((bp, container)) = key.split_once('@') {
        r::lower_r_key_named(bp.trim(), scale, container.trim())
    } else {
        r::lower_r_key(key, scale)
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
    walk_spread_argument(ctx, &spread.argument, when);
}

/// Unpack a spread argument: inline objects, identifier local consts, or warn.
pub fn walk_spread_argument(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if walk_spread_value(ctx, expr, when) {
        return;
    }
    if walk_spread_branching(ctx, expr, when) {
        return;
    }
    // ...maybeFn()
    ctx.warn("Dynamic object spread encountered in style object; keeping sibling properties");
}

fn walk_spread_value(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ObjectExpression(inner_obj) => {
            // ...{ margin: '10px' }
            walk_style_object(ctx, inner_obj, when);
            true
        }
        Expression::Identifier(ident) => {
            // ...base  after  const base = { mt: '2r' }
            unpack_local_const_object(ctx, ident.name.as_str(), when);
            true
        }
        Expression::ParenthesizedExpression(p) => {
            // ...({ margin: '10px' })
            walk_spread_argument(ctx, &p.expression, when);
            true
        }
        _ => false,
    }
}

fn walk_spread_branching(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // ...(on ? { padding: '10px' } : { gap: '8px' })
            walk_spread_argument(ctx, &cond.consequent, when);
            walk_spread_argument(ctx, &cond.alternate, when);
            true
        }
        Expression::LogicalExpression(log) => {
            // ...(unk && { padding: '10px' })  /  ...(unk || { margin: '20px' })
            walk_spread_argument(ctx, &log.left, when);
            walk_spread_argument(ctx, &log.right, when);
            true
        }
        _ => false,
    }
}

fn unpack_local_const_object(ctx: &mut ObjectWalk<'_>, name: &str, when: &SmallVec<[Box<str>; 2]>) {
    let Some(obj) = ctx.constants.get_object(name) else {
        // ...unknown  — not a file-top const object
        ctx.warn("Dynamic object spread encountered in style object; keeping sibling properties");
        return;
    };
    let entries: Vec<(String, AtomValue)> = obj
        .iter()
        .filter(|(key, _)| is_known_style_prop(key))
        .map(|(key, val)| (key.clone(), val.clone()))
        .collect();
    for (key, val) in entries {
        let mut expr_ctx = ctx.expression_walk(&key);
        expr_ctx.push_want(val, when.clone(), false);
    }
}
