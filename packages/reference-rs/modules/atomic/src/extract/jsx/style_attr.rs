//! Style-attribute walkers for JSX: a style prop value walks as an expression, a folded object
//! spreads like a css argument, `r` keys scope under container queries, and merge-list spreads
//! lower entry by entry. Refusals land as located diagnostics on the attribute, and only the value
//! that cannot fold is dropped, so sibling props keep their wants. Takes an expression with its
//! style-attribute site and emits wants and authored plans through the extract context.

use oxc_ast::ast::{ArrayExpressionElement, Expression};
use oxc_span::GetSpan;
use oxc_span::Span;
use smallvec::{smallvec, SmallVec};

use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::object::lower::LowerSite;
use crate::extract::expressions::walk::{
    block_value_kind, is_silent_block_value, unwrap_wrapper_target,
};
use crate::extract::expressions::{
    lower_array_object, lower_const_object, resolve_block_target, BlockLookup,
};
use crate::extract::fold::{merge_spread, spread_base_name, MergeSpread};
use crate::extract::ExtractContext;

use super::StyleAttr;

pub(super) fn walk_r_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    // <Div r={{ md: { mt: '2r' } }} />
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // <Div r={{...} as const} /> — wrappers erase to the bare block.
        walk_r_attr(inner, site, ctx);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            let mut obj_ctx = ctx.object_walk(site.origin, false, site.backing);
            crate::extract::expressions::walk_r_object(&mut obj_ctx, obj, &smallvec![]);
        }
        Expression::ConditionalExpression(cond) => {
            // <Div r={on ? { md: {...} } : { md: {...} }} /> — both arms walk.
            walk_r_attr(&cond.consequent, site, ctx);
            walk_r_attr(&cond.alternate, site, ctx);
        }
        _ => {
            refuse_unless_silent_jsx(expr, site, ctx);
        }
    }
}
pub(super) fn walk_style_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={{ color: 'red' }} />
    // <Div _hover={{ bg: 'n200' }} />
    // <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // <Div css={{...} as const} /> — wrappers erase to the bare block.
        walk_style_attr(inner, site, ctx, when);
        return;
    }
    match expr {
        Expression::ObjectExpression(obj) => {
            let mut obj_ctx = ctx.object_walk(site.origin, false, site.backing);
            crate::extract::expressions::walk_style_object(&mut obj_ctx, obj, when);
        }
        Expression::ArrayExpression(arr) => walk_style_attr_array(arr, site, ctx, when),
        Expression::ConditionalExpression(cond) => {
            // <Div _hover={on ? { bg: 'n200' } : { bg: 'n300' }} />
            // Both literal arms compile; the runtime picks (D11, core parity).
            walk_style_attr(&cond.consequent, site, ctx, when);
            walk_style_attr(&cond.alternate, site, ctx, when);
        }
        _ => {
            handle_folding_attr(expr, site, ctx, when);
        }
    }
}
/// Lower a folding style-block shape — logical operands, identifiers,
/// members — or refuse it at the prop. Anything else is not a style block.
fn handle_folding_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::LogicalExpression(log) => {
            // <Div css={ok && {...}} /> — both operands lower, like spreads.
            walk_style_attr(&log.left, site, ctx, when);
            walk_style_attr(&log.right, site, ctx, when);
        }
        Expression::Identifier(_) | Expression::StaticMemberExpression(_) => {
            // <Div css={styles} /> — resolve, lower, or diagnose.
            lower_block_attr(expr, site, ctx, when);
        }
        _ => {
            refuse_unless_silent_jsx(expr, site, ctx);
        }
    }
}
/// Lower an identifier or member style block through its const object,
/// exactly as if spread. A miss names the write when the base is mutated,
/// else refuses at the prop; sibling attributes always survive.
fn lower_block_attr(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match resolve_block_target(ctx.scoped(), expr) {
        BlockLookup::Hit(name, obj) => {
            let mut obj_ctx = ctx.object_walk(site.origin, false, site.backing);
            lower_const_object(
                &mut obj_ctx,
                obj,
                LowerSite {
                    name: &name,
                    when,
                    span: expr.span(),
                },
            );
        }
        BlockLookup::Miss(base) => {
            if !mutated_attr_warn(ctx, &base, expr.span(), site) {
                refuse_unless_silent_jsx(expr, site, ctx);
            }
        }
        BlockLookup::NotBlock => {
            refuse_unless_silent_jsx(expr, site, ctx);
        }
    }
}
/// Warn naming the write when a style block's base name is mutated.
fn mutated_attr_warn(
    ctx: &mut ExtractContext<'_>,
    base: &str,
    span: Span,
    site: &StyleAttr<'_>,
) -> bool {
    let Some(write) = ctx.scoped().mutation(base) else {
        return false;
    };
    ctx.warn_help(
        span,
        DiagnosticCode::MutatedBinding,
        format!(
            "Dynamic mutated binding '{base}' in JSX '{}' prop value ({}; keeping sibling attributes)",
            site.prop,
            write.write_phrase()
        ),
        vec![format!(
            "hoist '{base}' above the style call and stop reassigning it ({})",
            write.write_phrase()
        )],
    );
    true
}
/// Diagnose a block value that extracts nothing, unless it skips silently.
fn refuse_unless_silent_jsx(
    expr: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    if !is_silent_block_value(expr) {
        refuse_style_attr(expr, site, ctx);
    }
}
/// Diagnose a JSX style-block value that is not a static style object.
fn refuse_style_attr(expr: &Expression<'_>, site: &StyleAttr<'_>, ctx: &mut ExtractContext<'_>) {
    // <Div css={styles} />  /  <Div _hover={on && {...}} />
    ctx.warn_help(
        expr.span(),
        DiagnosticCode::NonObjectJsxStyle,
        format!(
            "JSX '{}' prop value is not a static style object ({})",
            site.prop,
            block_value_kind(expr)
        ),
        vec![format!(
            "pass a static style object to '{}' (got {})",
            site.prop,
            block_value_kind(expr)
        )],
    );
}
fn walk_style_attr_array(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={[{ color: 'blue.300' }, { backgroundColor: 'green.300' }]} />
    for elem in &arr.elements {
        walk_style_attr_element(elem, site, ctx, when);
    }
}
/// Walk one merge-list element of a JSX style-block array: literal and
/// const-array spreads flatten in place, dynamic spreads refuse.
fn walk_style_attr_element(
    elem: &ArrayExpressionElement<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match elem {
        ArrayExpressionElement::SpreadElement(spread) => {
            walk_attr_spread(spread, site, ctx, when);
        }
        ArrayExpressionElement::Elision(_) => {
            // Holes skip silently.
        }
        _ => {
            if let Some(elem_expr) = elem.as_expression() {
                walk_style_attr(elem_expr, site, ctx, when);
            }
        }
    }
}
/// Walk one JSX merge-list spread: flatten, name the write, or refuse.
fn walk_attr_spread(
    spread: &oxc_ast::ast::SpreadElement<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // <Div css={[{...}, ...[{...}], ...extras]} /> — siblings merge whether
    // this spread flattens or refuses.
    if flatten_attr_spread(&spread.argument, site, ctx, when) {
        return;
    }
    if let Some(name) = spread_base_name(&spread.argument) {
        if mutated_attr_warn(ctx, name, spread.span, site) {
            return;
        }
    }
    ctx.warn_help(
        spread.span,
        DiagnosticCode::NonObjectJsxStyle,
        format!(
            "JSX '{}' prop value is not a static style object (spread element)",
            site.prop
        ),
        vec![format!(
            "pass a static style object to '{}' (got spread element)",
            site.prop
        )],
    );
}
/// Flatten one JSX merge-list spread: inline elements lower one by one,
/// const elements lower from the recording. False refuses.
fn flatten_attr_spread(
    arg: &Expression<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match merge_spread(arg, ctx.scoped()) {
        Some(MergeSpread::Inline(elements)) => {
            for elem in elements {
                walk_style_attr_element(elem, site, ctx, when);
            }
            true
        }
        Some(MergeSpread::Const(elements)) => {
            let name = spread_base_name(arg).unwrap_or("array");
            let spread = LowerSite {
                name,
                when,
                span: arg.span(),
            };
            lower_attr_const(elements, spread, site, ctx);
            true
        }
        None => false,
    }
}
/// Lower a const JSX merge-list spread: objects merge, leaves and holes skip.
fn lower_attr_const(
    elements: &[ConstArrayElement],
    spread: LowerSite<'_>,
    site: &StyleAttr<'_>,
    ctx: &mut ExtractContext<'_>,
) {
    // Literal leaves skip silently, like string-head args.
    for element in elements {
        if let ConstArrayElement::Object(map) = element {
            let mut obj_ctx = ctx.object_walk(site.origin, false, site.backing);
            lower_array_object(&mut obj_ctx, map, spread);
        }
    }
}
