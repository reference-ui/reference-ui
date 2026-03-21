use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement};
use oxc_span::GetSpan;

use crate::tasty::model::{TupleElement, TypeRef};
use crate::tasty::shared::type_ref_util::collapse_union;

use super::objects::infer_object_type;
use super::primitives::{infer_boolean_type_span, infer_numeric_type_span, infer_string_type_span};
use super::super::values::{infer_ts_as_expression, infer_ts_satisfies_expression};
use super::super::ExtractionContext;

pub(crate) fn infer_array_type(
    array: &ArrayExpression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    let element_types = infer_all_element_types(array, ctx, const_asserted)?;

    if const_asserted {
        return Some(tuple_from_elements(element_types));
    }
    array_from_collapsed_elements(element_types)
}

fn infer_all_element_types(
    array: &ArrayExpression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<Vec<TypeRef>> {
    let mut out = Vec::with_capacity(array.elements.len());
    for element in &array.elements {
        out.push(infer_array_element_type(element, ctx, const_asserted)?);
    }
    Some(out)
}

fn tuple_from_elements(element_types: Vec<TypeRef>) -> TypeRef {
    TypeRef::Tuple {
        elements: element_types
            .into_iter()
            .map(|element| TupleElement {
                label: None,
                optional: false,
                rest: false,
                element,
            })
            .collect(),
    }
}

fn array_from_collapsed_elements(element_types: Vec<TypeRef>) -> Option<TypeRef> {
    let element = collapse_union(element_types)?;
    Some(TypeRef::Array {
        element: Box::new(element),
    })
}

fn infer_array_element_type(
    element: &ArrayExpressionElement<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    use ArrayExpressionElement as El;

    match element {
        El::SpreadElement(_) | El::Elision(_) => None,
        El::NullLiteral(_) => Some(null_type()),
        El::BooleanLiteral(e) => Some(infer_boolean_type_span(ctx.source, e.span(), const_asserted)),
        El::NumericLiteral(e) => Some(infer_numeric_type_span(ctx.source, e.span(), const_asserted)),
        El::StringLiteral(e) => Some(infer_string_type_span(ctx.source, e.span(), const_asserted)),
        El::ObjectExpression(object) => infer_object_type(object, ctx, const_asserted),
        El::ArrayExpression(array) => infer_array_type(array, ctx, const_asserted),
        El::TSAsExpression(assertion) => infer_ts_as_expression(assertion, ctx, const_asserted),
        El::TSSatisfiesExpression(satisfies) => {
            infer_ts_satisfies_expression(satisfies, ctx, const_asserted)
        }
        _ => None,
    }
}

fn null_type() -> TypeRef {
    TypeRef::Intrinsic {
        name: "null".to_string(),
    }
}
