//! Extract `css()` / `css.object()` call arguments into wants.
//!
//! Hands object, ternary-of-object, and merge-list arguments to the style
//! walker. Wrapped args (`as const`, parens, `!`, `<T>`) unwrap to the bare
//! arg; any other non-object arg diagnoses with its position and keeps
//! sibling args — silence here is the fail-open failure mode (SPEC-V2-65).
//! Does not walk `recipe()` and does not interpret JSX attributes.

use oxc_ast::ast::{
    Argument, ArrayExpression, ArrayExpressionElement, CallExpression, Expression, ObjectExpression,
};
use oxc_span::GetSpan;

use smallvec::smallvec;

use crate::diagnostics::DiagnosticCode;
use crate::extract::expressions::walk::{
    block_value_kind, is_silent_block_value, unwrap_wrapper_target,
};
use crate::extract::expressions::walk_style_object;
use crate::extract::ExtractContext;

/// Position of a `css()` argument for positioned diagnostics (1-based).
#[derive(Clone, Copy)]
enum ArgSite {
    /// Top-level call argument: `css(a, b)`.
    Arg(usize),
    /// Element of a merge-list array: `css([a, b])`.
    Element(usize),
}

impl ArgSite {
    /// Human-readable position for the diagnostic message.
    fn describe(self) -> String {
        match self {
            ArgSite::Arg(index) => format!("argument {index}"),
            ArgSite::Element(index) => format!("merge-list element {index}"),
        }
    }
}

/// Extract style objects from a `css(...)` call. No-ops if the callee is not
/// a live Reference `css` import (unknown or shadowed `css` is not a site).
pub fn extract(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    // css({ mt: '2r' }, { color: 'red' })
    let Some(origin) = ctx.bindings.css_origin(&call.callee, ctx.shadowed) else {
        return;
    };
    for (index, arg) in call.arguments.iter().enumerate() {
        let site = ArgSite::Arg(index + 1);
        match arg {
            Argument::SpreadElement(spread) => {
                // css(...args) — the spread is not a static object; siblings stay.
                ctx.warn(
                    spread.span,
                    DiagnosticCode::NonObjectCssArg,
                    format!(
                        "css() {} is not a static style object (spread element)",
                        site.describe()
                    ),
                );
            }
            _ => {
                if let Some(expr) = arg.as_expression() {
                    handle_css_arg(expr, Some(origin.as_str()), site, ctx);
                }
            }
        }
    }
}

fn handle_css_arg(
    expr: &Expression<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // css({...} as const) — wrappers erase to the bare arg.
        handle_css_arg(inner, origin, site, ctx);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            walk_object_expr(obj, origin, ctx);
        }
        Expression::ConditionalExpression(cond) => {
            walk_object_branch(&cond.consequent, origin, site, ctx);
            walk_object_branch(&cond.alternate, origin, site, ctx);
        }
        Expression::ArrayExpression(arr) => {
            walk_array_arg(arr, origin, ctx);
        }
        _ => {
            refuse_unless_silent(expr, site, ctx);
        }
    }
}

/// Diagnose a block value that extracts nothing, unless it skips silently.
fn refuse_unless_silent(expr: &Expression<'_>, site: ArgSite, ctx: &mut ExtractContext<'_>) {
    if !is_silent_block_value(expr) {
        refuse_css_arg(expr, site, ctx);
    }
}

/// Diagnose a non-object `css()` argument, keeping sibling args.
fn refuse_css_arg(expr: &Expression<'_>, site: ArgSite, ctx: &mut ExtractContext<'_>) {
    // css(styles)  /  css(fn())  /  css(a, cond && {...})
    ctx.warn(
        expr.span(),
        DiagnosticCode::NonObjectCssArg,
        format!(
            "css() {} is not a static style object ({})",
            site.describe(),
            block_value_kind(expr)
        ),
    );
}

fn walk_object_expr(
    obj: &ObjectExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    let mut obj_ctx = ctx.object_walk(origin, false);
    walk_style_object(&mut obj_ctx, obj, &smallvec![]);
}

fn walk_array_arg(arr: &ArrayExpression<'_>, origin: Option<&str>, ctx: &mut ExtractContext<'_>) {
    for (index, elem) in arr.elements.iter().enumerate() {
        walk_merge_element(elem, origin, ArgSite::Element(index + 1), ctx);
    }
}

/// Walk one merge-list element: objects merge, holes skip, spreads refuse.
fn walk_merge_element(
    elem: &ArrayExpressionElement<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    match elem {
        ArrayExpressionElement::SpreadElement(spread) => {
            // css([{...}, ...rest]) — Ph1 refuses; Ph3 flattens literal spreads.
            ctx.warn(
                spread.span,
                DiagnosticCode::NonObjectCssArg,
                format!(
                    "css() {} is not a static style object (spread element)",
                    site.describe()
                ),
            );
        }
        ArrayExpressionElement::Elision(_) => {
            // css([{...}, , {...}]) — holes skip silently.
        }
        _ => {
            if let Some(elem_expr) = elem.as_expression() {
                handle_css_arg(elem_expr, origin, site, ctx);
            }
        }
    }
}

fn walk_object_branch(
    expr: &Expression<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // css(ok ? ({...}) : ({...} as const)) — arms unwrap like args.
        walk_object_branch(inner, origin, site, ctx);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            walk_object_expr(obj, origin, ctx);
        }
        Expression::ConditionalExpression(cond) => {
            // css(a ? (b ? {...} : {...}) : {...}) — nested arms walk through.
            walk_object_branch(&cond.consequent, origin, site, ctx);
            walk_object_branch(&cond.alternate, origin, site, ctx);
        }
        Expression::ArrayExpression(arr) => {
            // css(ok ? [{...}, {...}] : {...}) — array arms merge like args.
            walk_array_arg(arr, origin, ctx);
        }
        _ => {
            refuse_unless_silent(expr, site, ctx);
        }
    }
}
