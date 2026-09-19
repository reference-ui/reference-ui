//! Call expressions in value position: the token surface, then the fence.
//! A `token()` value pushes its want and a refused token shape warns against
//! the surface; any other call tries the pure-helper fence, where a folded
//! value lowers, refused fragments warn, and a refused call warns exactly
//! like before — naming the write when the callee was reassigned.

use oxc_ast::ast::{CallExpression, Expression};
use oxc_span::Span;
use smallvec::SmallVec;

use super::{leaf::mutated_warn, util::unwrap_wrapper_target, ExpressionWalk};
use crate::diagnostics::DiagnosticCode;

/// Fold one call: a `token()` value pushes its want, a refused shape warns
/// against the surface, and any other call tries the pure-helper fence.
pub(crate) fn handle_token_call(
    ctx: &mut ExpressionWalk<'_>,
    call: &CallExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let Some(fold) = crate::extract::fold::fold_token_call(call, ctx.scopes) else {
        handle_pure_call(ctx, call, when);
        return;
    };
    if let Some(value) = fold.value {
        ctx.push_want(value, when.clone(), false, Some(call.span));
    }
    if let Some(refusal) = fold.refusal {
        let prop = ctx.prop;
        ctx.warn(
            refusal.span(call.span),
            refusal.code(),
            refusal.message(prop),
        );
    }
}

/// Fold one non-token call through the pure-helper fence: a folded value
/// lowers, refused fragments warn, and a refused call warns exactly like
/// before — naming the write when the callee binding was reassigned.
fn handle_pure_call(
    ctx: &mut ExpressionWalk<'_>,
    call: &CallExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_pure_call(call, ctx.scopes);
    if let Some(value) = fold.value {
        for refusal in &fold.refusals {
            let prop = ctx.prop;
            ctx.warn(
                refusal.span(),
                DiagnosticCode::DynamicExpression,
                refusal.message_for_value(prop),
            );
        }
        if let Some(subject) = fold.residue.as_ref() {
            ctx.warn(
                call.span,
                DiagnosticCode::PartialObjectProp,
                format!("{subject} drops a dynamic arm with no static style value"),
            );
        }
        crate::extract::fold::lower_call_value(ctx, &value, when, call.span);
        return;
    }
    let mut callee = &call.callee;
    while let Some(inner) = unwrap_wrapper_target(callee) {
        callee = inner;
    }
    if let Expression::Identifier(ident) = callee {
        if mutated_warn(ctx, ident.name.as_str(), call.span, "callee was reassigned") {
            return;
        }
    }
    // width={pick()}  — dynamic, warn, keep siblings
    warn_dynamic_expression(ctx, call.span);
}

/// The generic dynamic-expression warning for an unhandled value shape.
pub(crate) fn warn_dynamic_expression(ctx: &mut ExpressionWalk<'_>, span: Span) {
    let prop = ctx.prop;
    ctx.warn(
        span,
        DiagnosticCode::DynamicExpression,
        format!("Dynamic non-literal expression encountered for prop '{prop}'"),
    );
}
