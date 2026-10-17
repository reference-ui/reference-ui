//! Merge-list arguments for `css([...])`: each element lowers in order, objects merge, literal and
//! const-array spreads flatten in place, and dynamic spreads refuse at their own site. A const
//! spread lowers from its recording, leaves and holes skip, and an unresolvable element warns
//! without dropping its siblings. Takes an array argument with its origin and emits wants and
//! authored plans through the extract context.

use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement, Expression};
use oxc_span::GetSpan;
use smallvec::smallvec;

use super::{handle_css_arg, mutated_arg_warn, ArgSite};
use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::ConstArrayElement;
use crate::extract::expressions::lower_array_object;
use crate::extract::expressions::object::lower::LowerSite;
use crate::extract::fold::{merge_spread, spread_base_name, MergeSpread};
use crate::extract::ExtractContext;

pub(super) fn walk_array_arg(
    arr: &ArrayExpression<'_>,
    origin: Option<&str>,
    ctx: &mut ExtractContext<'_>,
) {
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
    ctx.warn_help(
        spread.span,
        DiagnosticCode::NonObjectCssArg,
        format!(
            "css() {} is not a static style object (spread element)",
            site.describe()
        ),
        vec![format!(
            "pass a static style object as css() {} (got spread element)",
            site.describe()
        )],
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
            let mut obj_ctx = ctx.object_walk(origin, false, false);
            lower_array_object(
                &mut obj_ctx,
                map,
                LowerSite {
                    name,
                    when: &smallvec![],
                    span: arg.span(),
                },
            );
        }
    }
}
