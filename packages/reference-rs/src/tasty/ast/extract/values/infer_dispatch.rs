use oxc_ast::ast::Expression;
use oxc_span::GetSpan;

use super::super::infer::{
    infer_array_type, infer_boolean_type_span, infer_numeric_type_span, infer_object_type,
    infer_string_type_span,
};
use super::ts_assertions::{infer_ts_as_expression, infer_ts_satisfies_expression};
use super::super::ExtractionContext;
use crate::tasty::model::TypeRef;

pub(crate) fn infer_value_type_with_const_context(
    expression: &Expression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    match expression {
        Expression::BooleanLiteral(_) => Some(infer_boolean_type_span(
            ctx.source,
            expression.span(),
            const_asserted,
        )),
        Expression::NullLiteral(_) => Some(TypeRef::Intrinsic {
            name: "null".to_string(),
        }),
        Expression::NumericLiteral(_) => Some(infer_numeric_type_span(
            ctx.source,
            expression.span(),
            const_asserted,
        )),
        Expression::StringLiteral(_) => Some(infer_string_type_span(
            ctx.source,
            expression.span(),
            const_asserted,
        )),
        Expression::ObjectExpression(object) => {
            Some(infer_object_type(object, ctx, const_asserted)?)
        }
        Expression::ArrayExpression(array) => {
            Some(infer_array_type(array, ctx, const_asserted)?)
        }
        Expression::TSAsExpression(assertion) => {
            infer_ts_as_expression(assertion, ctx, const_asserted)
        }
        Expression::TSSatisfiesExpression(satisfies) => {
            infer_ts_satisfies_expression(satisfies, ctx, const_asserted)
        }
        _ => None,
    }
}
