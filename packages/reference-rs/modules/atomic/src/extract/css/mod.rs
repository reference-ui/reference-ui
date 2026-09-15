//! Extract `css()` / `css.object()` call arguments into wants.
//! Hands object and ternary-of-object arguments to the expression walker.
//! Does not walk `recipe()` and does not interpret JSX attributes.

use oxc_ast::ast::{CallExpression, Expression};
use smallvec::smallvec;

use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;

/// Extract style objects from a `css(...)` call. No-ops if the callee is not
/// a live Reference `css` import (unknown or shadowed `css` is not a site).
pub fn extract(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    // css({ mt: '2r' }, { color: 'red' })
    let Some(origin) = ctx.bindings.css_origin(&call.callee, ctx.shadowed) else {
        return;
    };
    for arg in &call.arguments {
        if let Some(expr) = arg.as_expression() {
            handle_css_arg(expr, Some(origin.as_str()), ctx);
        }
    }
}

fn handle_css_arg(expr: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    match expr {
        Expression::ObjectExpression(obj) => {
            // css({ color: 'red', _hover: { bg: 'n200' } })
            let mut obj_ctx = ctx.object_walk(origin, false);
            walk_style_object(&mut obj_ctx, obj, &smallvec![]);
        }
        Expression::ConditionalExpression(cond) => {
            // css(on ? { color: 'red' } : { color: 'blue' })
            walk_object_branch(&cond.consequent, origin, ctx);
            walk_object_branch(&cond.alternate, origin, ctx);
        }
        _ => {}
    }
}

fn walk_object_branch(expr: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    // { color: 'red' }  — one arm of css(on ? { ... } : { ... })
    let Expression::ObjectExpression(obj) = expr else {
        return;
    };
    let mut obj_ctx = ctx.object_walk(origin, false);
    walk_style_object(&mut obj_ctx, obj, &smallvec![]);
}
