use oxc_ast::ast::{TSAsExpression, TSSatisfiesExpression};
use oxc_span::GetSpan;

use super::super::slice_span;
use super::super::ExtractionContext;
use super::infer_dispatch::infer_value_type_with_const_context;
use crate::tasty::model::TypeRef;

pub(crate) fn infer_ts_as_expression(
    assertion: &TSAsExpression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    let next_const_context =
        const_asserted || slice_span(ctx.source, assertion.type_annotation.span()) == "const";
    infer_value_type_with_const_context(&assertion.expression, ctx, next_const_context)
}

pub(crate) fn infer_ts_satisfies_expression(
    satisfies: &TSSatisfiesExpression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    infer_value_type_with_const_context(&satisfies.expression, ctx, const_asserted)
}
