//! `css` and `r` keys inside a JSX spread bag, walked as their attributes.
//! A bag key names an attribute, so `css` lowers exactly like the `css`
//! prop (objects, merge-list arrays, ternaries, logicals, and block targets)
//! and `r` lowers exactly like the `r` prop (objects and ternaries); dynamic
//! values refuse with the same `NonObjectJsxStyle` vocabulary the attributes
//! use. Silent block values skip either way, mirroring the attribute sites.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, Expression};
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::{
    block::{resolve_block_target, BlockLookup},
    lower::{lower_array_object, lower_const_object},
    walk_r_object, walk_style_object, ObjectWalk,
};
use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::walk::{
    block_value_kind, is_silent_block_value, unwrap_wrapper_target,
};
use crate::extract::fold::{merge_spread, spread_base_name, MergeSpread};

/// Walk a bag `css` value exactly like the `css` attribute's value.
pub(crate) fn walk_css_value(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // css: {...} as const  — wrappers erase to the bare block
        walk_css_value(ctx, inner, when);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            walk_style_object(ctx, obj, when);
        }
        Expression::ArrayExpression(arr) => walk_css_array(ctx, arr, when),
        _ => walk_css_block_value(ctx, expr, when),
    }
}

/// Walk a non-object bag `css` value: branches walk every arm, block
/// targets resolve, and anything else refuses unless it skips silently.
fn walk_css_block_value(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // css: on ? {...} : {...}  — both arms walk, like the attribute
            walk_css_value(ctx, &cond.consequent, when);
            walk_css_value(ctx, &cond.alternate, when);
        }
        Expression::LogicalExpression(log) => {
            // css: ok && {...}  — both operands lower, like spreads
            walk_css_value(ctx, &log.left, when);
            walk_css_value(ctx, &log.right, when);
        }
        Expression::Identifier(_) | Expression::StaticMemberExpression(_) => {
            // css: styles  — resolve, lower, or diagnose
            lower_css_block(ctx, expr, when);
        }
        _ => {
            refuse_unless_silent_bag(ctx, "css", expr);
        }
    }
}

/// Walk a bag `r` value exactly like the `r` attribute's value.
pub(crate) fn walk_r_value(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // r: {...} as const  — wrappers erase to the bare block
        walk_r_value(ctx, inner, when);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            walk_r_object(ctx, obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            // r: on ? {...} : {...}  — both arms walk, like the attribute
            walk_r_value(ctx, &cond.consequent, when);
            walk_r_value(ctx, &cond.alternate, when);
        }
        _ => {
            refuse_unless_silent_bag(ctx, "r", expr);
        }
    }
}

/// Lower an identifier or member `css` value through its const object,
/// exactly as if spread. A miss names the write when the base is mutated,
/// else refuses at the key; sibling keys always survive.
fn lower_css_block(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match resolve_block_target(ctx.scopes, expr) {
        BlockLookup::Hit(name, obj) => {
            lower_const_object(ctx, &name, obj, when, expr.span());
        }
        BlockLookup::Miss(base) => {
            if !mutated_bag_warn(ctx, "css", &base, expr.span()) {
                refuse_unless_silent_bag(ctx, "css", expr);
            }
        }
        BlockLookup::NotBlock => {
            refuse_unless_silent_bag(ctx, "css", expr);
        }
    }
}

/// Warn naming the write when a bag block value's base name is mutated.
fn mutated_bag_warn(ctx: &mut ObjectWalk<'_>, prop: &str, base: &str, span: Span) -> bool {
    let Some(write) = ctx.scopes.mutation(base) else {
        return false;
    };
    ctx.warn(
        span,
        DiagnosticCode::MutatedBinding,
        format!(
            "Dynamic mutated binding '{base}' in JSX '{prop}' prop value ({}; keeping sibling attributes)",
            write.write_phrase()
        ),
    );
    true
}

/// Diagnose a bag block value that extracts nothing, unless it skips silently.
fn refuse_unless_silent_bag(ctx: &mut ObjectWalk<'_>, prop: &str, expr: &Expression<'_>) {
    if !is_silent_block_value(expr) {
        ctx.warn(
            expr.span(),
            DiagnosticCode::NonObjectJsxStyle,
            format!(
                "JSX '{prop}' prop value is not a static style object ({})",
                block_value_kind(expr)
            ),
        );
    }
}

/// Walk one merge-list array of a bag `css` value, element by element.
fn walk_css_array(
    ctx: &mut ObjectWalk<'_>,
    arr: &ArrayExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // css: [{...}, ...[{...}]]  — siblings merge whether each flattens or refuses
    for elem in &arr.elements {
        walk_css_element(ctx, elem, when);
    }
}

/// Walk one merge-list element: spreads flatten, holes skip, the rest recurses.
fn walk_css_element(
    ctx: &mut ObjectWalk<'_>,
    elem: &ArrayExpressionElement<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match elem {
        ArrayExpressionElement::SpreadElement(spread) => {
            walk_css_spread(ctx, spread, when);
        }
        ArrayExpressionElement::Elision(_) => {
            // Holes skip silently.
        }
        _ => {
            if let Some(elem_expr) = elem.as_expression() {
                walk_css_value(ctx, elem_expr, when);
            }
        }
    }
}

/// Walk one bag merge-list spread: flatten, name the write, or refuse.
fn walk_css_spread(
    ctx: &mut ObjectWalk<'_>,
    spread: &oxc_ast::ast::SpreadElement<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if flatten_css_spread(&spread.argument, ctx, when) {
        return;
    }
    if let Some(name) = spread_base_name(&spread.argument) {
        if mutated_bag_warn(ctx, "css", name, spread.span) {
            return;
        }
    }
    ctx.warn(
        spread.span,
        DiagnosticCode::NonObjectJsxStyle,
        "JSX 'css' prop value is not a static style object (spread element)",
    );
}

/// Flatten one bag merge-list spread: inline elements lower one by one,
/// const elements lower from the recording. False refuses.
fn flatten_css_spread(
    arg: &Expression<'_>,
    ctx: &mut ObjectWalk<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match merge_spread(arg, ctx.scopes) {
        Some(MergeSpread::Inline(elements)) => {
            for elem in elements {
                walk_css_element(ctx, elem, when);
            }
            true
        }
        Some(MergeSpread::Const(elements)) => {
            lower_css_const(elements, arg, ctx, when);
            true
        }
        None => false,
    }
}

/// Lower a const bag merge-list spread: objects merge, leaves and holes skip.
fn lower_css_const(
    elements: &[ConstArrayElement],
    arg: &Expression<'_>,
    ctx: &mut ObjectWalk<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // Literal leaves skip silently, like string-head args.
    let name = spread_base_name(arg).unwrap_or("array");
    for element in elements {
        if let ConstArrayElement::Object(map) = element {
            lower_array_object(ctx, name, map, when, arg.span());
        }
    }
}
