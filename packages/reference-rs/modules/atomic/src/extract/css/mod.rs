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
            walk_object_expr(obj, origin, ctx);
        }
        Expression::ConditionalExpression(cond) => {
            walk_object_branch(&cond.consequent, origin, ctx);
            walk_object_branch(&cond.alternate, origin, ctx);
        }
        Expression::ArrayExpression(arr) => {
            walk_array_arg(arr, origin, ctx);
        }
        _ => {}
    }
}

fn walk_object_expr(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    let mut obj_ctx = ctx.object_walk(origin, false);
    walk_style_object(&mut obj_ctx, obj, &smallvec![]);
}

fn walk_array_arg(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    for elem in &arr.elements {
        if let Some(elem_expr) = elem.as_expression() {
            handle_css_arg(elem_expr, origin, ctx);
        }
    }
}

fn walk_object_branch(expr: &Expression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    let Expression::ObjectExpression(obj) = expr else {
        return;
    };
    walk_object_expr(obj, origin, ctx);
}
