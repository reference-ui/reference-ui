//! Scalar leaves in value position: identifiers, unary, and binary folds.
//! Identifiers resolve through the scope chain — the innermost binding wins
//! and params shadow everything outside — while unary and binary expressions
//! fold through the shared fold nodes. Refusals diagnose at their own code,
//! dynamic operands re-walk for their own diagnostics but never for wants,
//! and a mutated base names its write instead of resolving stale.

use oxc_ast::ast::{BinaryExpression, UnaryExpression, UnaryOperator};
use oxc_span::Span;
use smallvec::SmallVec;

use super::{
    branch::{emit_dead_arms, push_folded_want},
    walk_expression, DynamicRefusal, ExpressionWalk,
};
use crate::diagnostics::DiagnosticCode;

pub(crate) fn handle_identifier_fallback(
    ctx: &mut ExpressionWalk<'_>,
    name: &str,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    // mt={space}  after  const space = '2r'
    // borderBottomColor={subtleBorder}  after  const subtleBorder = isDark ? 'gray.800' : 'gray.200'
    // Resolves through the scope chain: the innermost binding wins, and a
    // param or inner declarator shadows outer and cross-file consts.
    let leaves = ctx.scopes.scalar_leaves(name);
    if leaves.is_empty() {
        handle_identifier(ctx, name, span, when);
        return;
    }
    for val in leaves {
        ctx.push_want(val.clone(), when.clone(), false, Some(span));
    }
}

fn handle_identifier(
    ctx: &mut ExpressionWalk<'_>,
    name: &str,
    span: Span,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if name == "undefined" || name == "null" {
        // bg={on ? 'n300' : undefined}  — omit
        return;
    }
    if mutated_warn(ctx, name, span, "declared value is stale") {
        // css({ color })  after  color = 'blue'  — the init is stale
        return;
    }
    // mt={space}  when `space` is not a file-top const
    let prop = ctx.prop;
    ctx.warn_dynamic(DynamicRefusal {
        span,
        code: DiagnosticCode::DynamicIdentifier,
        message: format!("Dynamic non-literal identifier '{name}' encountered for prop '{prop}'"),
        when,
    });
}

/// Warn naming the write when a base name is a mutated binding.
pub(crate) fn mutated_warn(
    ctx: &mut ExpressionWalk<'_>,
    name: &str,
    span: Span,
    detail: &str,
) -> bool {
    let Some(write) = ctx.scopes.mutation(name) else {
        return false;
    };
    let prop = ctx.prop;
    ctx.warn(
        span,
        DiagnosticCode::MutatedBinding,
        format!(
            "Dynamic mutated binding '{name}' encountered for prop '{prop}' ({}; {detail})",
            write.write_phrase()
        ),
    );
    true
}

pub(crate) fn handle_unary(
    ctx: &mut ExpressionWalk<'_>,
    unary: &UnaryExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if unary.operator == UnaryOperator::Void {
        // void 0
        return;
    }
    // -space  /  !true  /  ~5  — the shared fold node; refusals diagnose,
    // dynamic operands re-walk for their own diagnostics, never for wants
    let fold = crate::extract::fold::fold_unary(unary.operator, &unary.argument, ctx.scopes);
    for val in &fold.values {
        ctx.push_want(val.clone(), when.clone(), false, Some(unary.span));
    }
    for refusal in &fold.refusals {
        let prop = ctx.prop;
        ctx.warn_dynamic(DynamicRefusal {
            span: unary.span,
            code: DiagnosticCode::DynamicUnary,
            message: refusal.message(prop),
            when,
        });
    }
    for refusal in &fold.template_refusals {
        let prop = ctx.prop;
        ctx.warn_dynamic(DynamicRefusal {
            span: refusal.span(),
            code: DiagnosticCode::DynamicTemplate,
            message: refusal.message(prop),
            when,
        });
    }
    emit_dead_arms(ctx, &fold.dead_arms);
    for operand in fold.dynamic {
        walk_expression(ctx, operand, when);
    }
}

pub(crate) fn handle_binary(
    ctx: &mut ExpressionWalk<'_>,
    binary: &BinaryExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // width={1 + 'px'}  — the shared fold node; refusals diagnose,
    // dead arms info, dynamic operands re-walk for their own diagnostics
    let fold =
        crate::extract::fold::fold_binary(binary.operator, &binary.left, &binary.right, ctx.scopes);
    for val in &fold.values {
        push_folded_want(ctx, val, when, binary.span);
    }
    for refusal in &fold.refusals {
        let prop = ctx.prop;
        ctx.warn_dynamic(DynamicRefusal {
            span: binary.span,
            code: DiagnosticCode::DynamicBinary,
            message: refusal.message(prop),
            when,
        });
    }
    for refusal in &fold.unary_refusals {
        let prop = ctx.prop;
        ctx.warn_dynamic(DynamicRefusal {
            span: binary.span,
            code: DiagnosticCode::DynamicUnary,
            message: refusal.message(prop),
            when,
        });
    }
    for refusal in &fold.template_refusals {
        let prop = ctx.prop;
        ctx.warn_dynamic(DynamicRefusal {
            span: binary.span,
            code: DiagnosticCode::DynamicTemplate,
            message: refusal.message(prop),
            when,
        });
    }
    emit_dead_arms(ctx, &fold.dead_arms);
    for operand in fold.dynamic {
        walk_expression(ctx, operand, when);
    }
}
