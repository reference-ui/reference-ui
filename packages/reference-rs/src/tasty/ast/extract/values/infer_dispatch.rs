use std::collections::BTreeMap;

use oxc_ast::ast::Expression;
use oxc_span::GetSpan;

use super::ts_assertions::{infer_ts_as_expression, infer_ts_satisfies_expression};
use crate::tasty::ast::extract::infer::{
    infer_array_type, infer_boolean_type_span, infer_numeric_type_span, infer_object_type,
    infer_string_type_span,
};
use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::TypeRef;

pub(crate) fn infer_value_type_with_const_context(
    expression: &Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    match expression {
        Expression::BooleanLiteral(_) => Some(infer_boolean_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        Expression::NullLiteral(_) => Some(TypeRef::Intrinsic {
            name: "null".to_string(),
        }),
        Expression::NumericLiteral(_) => Some(infer_numeric_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        Expression::StringLiteral(_) => Some(infer_string_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        Expression::ObjectExpression(object) => Some(infer_object_type(
            object,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?),
        Expression::ArrayExpression(array) => Some(infer_array_type(
            array,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?),
        Expression::TSAsExpression(assertion) => infer_ts_as_expression(
            assertion,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        Expression::TSSatisfiesExpression(satisfies) => infer_ts_satisfies_expression(
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
