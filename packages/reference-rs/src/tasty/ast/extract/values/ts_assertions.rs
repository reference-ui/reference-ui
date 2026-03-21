use std::collections::BTreeMap;

use oxc_ast::ast::{TSAsExpression, TSSatisfiesExpression};
use oxc_span::GetSpan;

use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::TypeRef;

use super::super::slice_span;
use super::infer_dispatch::infer_value_type_with_const_context;

pub(crate) fn infer_ts_as_expression(
    assertion: &TSAsExpression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    let next_const_context =
        const_asserted || slice_span(source, assertion.type_annotation.span()) == "const";
    infer_value_type_with_const_context(
        &assertion.expression,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
        next_const_context,
    )
}

pub(crate) fn infer_ts_satisfies_expression(
    satisfies: &TSSatisfiesExpression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    infer_value_type_with_const_context(
        &satisfies.expression,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
        const_asserted,
    )
}
