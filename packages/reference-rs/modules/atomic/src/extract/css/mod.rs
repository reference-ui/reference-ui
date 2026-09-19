//! Extract `css()` / `css.object()` call arguments into wants.
//!
//! Hands object, whole-object, member, ternary-of-object, logical, and
//! merge-list arguments to the style walker. Wrapped args (`as const`,
//! parens, `!`, `<T>`) unwrap to the bare arg; any other non-object arg
//! diagnoses with its position and keeps sibling args — silence here is
//! the fail-open failure mode (SPEC-V2-65). Does not walk `recipe()` and
//! does not interpret JSX attributes.

use oxc_ast::ast::{
    Argument, ArrayExpression, ArrayExpressionElement, CallExpression, Expression, ObjectExpression,
};
use oxc_span::{GetSpan, Span};

use smallvec::smallvec;

use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::{
    block_value_kind, is_silent_block_value, unwrap_wrapper_target,
};
use crate::extract::expressions::{
    lower_array_object, lower_const_object, resolve_block_target, walk_style_object, BlockLookup,
};
use crate::extract::fold::{merge_spread, spread_base_name, MergeSpread};
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
            // css(ok ? {...} : other) — both arms lower; the runtime picks.
            // A folded test lowers the live arm only and names the dead.
            css_conditional(cond, origin, site, ctx);
        }
        Expression::ArrayExpression(arr) => {
            walk_array_arg(arr, origin, ctx);
        }
        _ => {
            handle_folding_arg(expr, origin, site, ctx);
        }
    }
}

/// Lower a conditional arg: the live arm when the test folds, else both.
fn css_conditional(
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scoped());
    emit_arg_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        handle_css_arg(&cond.consequent, origin, site, ctx);
        handle_css_arg(&cond.alternate, origin, site, ctx);
        return;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scoped());
    emit_arg_dead_arms(ctx, std::slice::from_ref(&arm));
    handle_css_arg(live, origin, site, ctx);
}

/// Report one info diagnostic per arm eliminated from a `css()` test.
fn emit_arg_dead_arms(ctx: &mut ExtractContext<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message("in css() argument"),
        );
    }
}

/// Lower a folding arg shape — logical operands, identifiers, members —
/// or refuse it with the arg position. Anything else is not a style block.
fn handle_folding_arg(
    expr: &Expression<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    match expr {
        Expression::LogicalExpression(log) => {
            // css(ok && {...}) — both operands lower, like spread operands.
            handle_css_arg(&log.left, origin, site, ctx);
            handle_css_arg(&log.right, origin, site, ctx);
        }
        Expression::Identifier(_) | Expression::StaticMemberExpression(_) => {
            // css(styles) / css(theme.colors) — resolve, lower, or diagnose.
            lower_block_arg(expr, origin, site, ctx);
        }
        _ => {
            refuse_unless_silent(expr, site, ctx);
        }
    }
}

/// Lower an identifier or member arg through its const object, exactly as
/// if spread. A miss names the write when the base is mutated, else
/// refuses with the arg position; sibling args always survive.
fn lower_block_arg(
    expr: &Expression<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    match resolve_block_target(ctx.scoped(), expr) {
        BlockLookup::Hit(name, obj) => {
            emit_import_residue(ctx, &name, expr.span());
            let mut obj_ctx = ctx.object_walk(origin, false);
            lower_const_object(&mut obj_ctx, &name, obj, &smallvec![], expr.span());
        }
        BlockLookup::Miss(base) => {
            if !mutated_arg_warn(ctx, &base, expr.span(), site) {
                refuse_unless_silent(expr, site, ctx);
            }
        }
        BlockLookup::NotBlock => {
            refuse_unless_silent(expr, site, ctx);
        }
    }
}

/// Diagnose nested spreads the imported arg object could not unfold.
fn emit_import_residue(ctx: &mut ExtractContext<'_>, name: &str, span: Span) {
    for marker in ctx.scoped().import_unfoldable(name) {
        ctx.warn(span, DiagnosticCode::UnfoldableSpread, marker.message());
    }
}

/// Warn naming the write when an arg's base name is a mutated binding.
fn mutated_arg_warn(ctx: &mut ExtractContext<'_>, base: &str, span: Span, site: ArgSite) -> bool {
    let Some(write) = ctx.scoped().mutation(base) else {
        return false;
    };
    ctx.warn(
        span,
        DiagnosticCode::MutatedBinding,
        format!(
            "Dynamic mutated binding '{base}' in css() {} ({}; keeping sibling args)",
            site.describe(),
            write.write_phrase()
        ),
    );
    true
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

/// Walk one merge-list element: objects merge, holes skip, literal and
/// const-array spreads flatten in place, dynamic spreads refuse.
fn walk_merge_element(
    elem: &ArrayExpressionElement<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    match elem {
        ArrayExpressionElement::SpreadElement(spread) => {
            walk_merge_spread(spread, origin, site, ctx);
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

/// Walk one merge-list spread: flatten, name the write, or refuse at the site.
fn walk_merge_spread(
    spread: &oxc_ast::ast::SpreadElement<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) {
    // css([{...}, ...[{...}], ...extras]) — siblings on either side merge
    // whether this spread flattens or refuses.
    if flatten_merge_spread(&spread.argument, origin, site, ctx) {
        return;
    }
    if let Some(name) = spread_base_name(&spread.argument) {
        if mutated_arg_warn(ctx, name, spread.span, site) {
            return;
        }
    }
    ctx.warn(
        spread.span,
        DiagnosticCode::NonObjectCssArg,
        format!(
            "css() {} is not a static style object (spread element)",
            site.describe()
        ),
    );
}

/// Flatten one merge-list spread: inline elements lower one by one under the
/// spread's site, const elements lower from the recording. False refuses.
fn flatten_merge_spread(
    arg: &Expression<'_>,
    origin: Option<&str>,
    site: ArgSite,
    ctx: &mut ExtractContext<'_>,
) -> bool {
    match merge_spread(arg, ctx.scoped()) {
        Some(MergeSpread::Inline(elements)) => {
            for elem in elements {
                walk_merge_element(elem, origin, site, ctx);
            }
            true
        }
        Some(MergeSpread::Const(elements)) => {
            lower_merge_const(elements, arg, origin, ctx);
            true
        }
        None => false,
    }
}

/// Lower a const merge-list spread: objects merge, leaves and holes skip.
fn lower_merge_const(
    elements: &[ConstArrayElement],
    arg: &Expression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
    // Literal leaves skip silently, like string-head args.
    let name = spread_base_name(arg).unwrap_or("array");
    for element in elements {
        if let ConstArrayElement::Object(map) = element {
            let mut obj_ctx = ctx.object_walk(origin, false);
            lower_array_object(&mut obj_ctx, name, map, &smallvec![], arg.span());
        }
    }
}
