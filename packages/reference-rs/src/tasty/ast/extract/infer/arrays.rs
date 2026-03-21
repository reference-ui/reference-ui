use oxc_ast::ast::{ArrayExpression, ArrayExpressionElement};
use oxc_span::GetSpan;

use crate::tasty::shared::typeref_util::collapse_union;

use crate::tasty::model::{TupleElement, TypeRef};

use super::super::values::{infer_ts_as_expression, infer_ts_satisfies_expression};
use super::objects::infer_object_type;
use super::primitives::{infer_boolean_type_span, infer_numeric_type_span, infer_string_type_span};

pub(crate) fn infer_array_type(
    array: &ArrayExpression<'_>,
    source: &str,
    import_bindings: &std::collections::BTreeMap<String, crate::tasty::ast::model::ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    let mut element_types = Vec::new();

    for element in array.elements.iter() {
        let inferred = infer_array_element_type(
            element,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?;
        element_types.push(inferred);
    }

    if const_asserted {
        return Some(TypeRef::Tuple {
            elements: element_types
                .into_iter()
                .map(|element| TupleElement {
                    label: None,
                    optional: false,
                    rest: false,
                    element,
                })
                .collect(),
        });
    }

    let element = collapse_union(element_types)?;
    Some(TypeRef::Array {
        element: Box::new(element),
    })
}

fn infer_array_element_type(
    element: &ArrayExpressionElement<'_>,
    source: &str,
    import_bindings: &std::collections::BTreeMap<String, crate::tasty::ast::model::ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    match element {
        ArrayExpressionElement::SpreadElement(_) | ArrayExpressionElement::Elision(_) => None,
        ArrayExpressionElement::BooleanLiteral(expression) => Some(infer_boolean_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        ArrayExpressionElement::NullLiteral(_) => Some(TypeRef::Intrinsic {
            name: "null".to_string(),
        }),
        ArrayExpressionElement::NumericLiteral(expression) => Some(infer_numeric_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        ArrayExpressionElement::StringLiteral(expression) => Some(infer_string_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        ArrayExpressionElement::ObjectExpression(object) => infer_object_type(
            object,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        ArrayExpressionElement::ArrayExpression(array) => infer_array_type(
            array,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        ArrayExpressionElement::TSAsExpression(assertion) => infer_ts_as_expression(
            assertion,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        ArrayExpressionElement::TSSatisfiesExpression(satisfies) => infer_ts_satisfies_expression(
            satisfies,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        _ => None,
    }
}
