use std::collections::BTreeMap;

use oxc_ast::ast::{
    BindingPattern, Declaration, Expression, Statement, TSAsExpression, TSSatisfiesExpression,
    VariableDeclarationKind,
};
use oxc_span::GetSpan;

use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::TypeRef;

use super::infer_arrays::infer_array_type;
use super::infer_objects::infer_object_type;
use super::infer_primitives::{
    infer_boolean_type_span, infer_numeric_type_span, infer_string_type_span,
};
use super::slice_span;

pub(super) fn collect_statement_value_bindings(
    statement: &Statement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    value_bindings: &mut BTreeMap<String, TypeRef>,
) {
    match statement {
        Statement::VariableDeclaration(declaration) => collect_variable_declaration_value_bindings(
            declaration,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            value_bindings,
        ),
        Statement::ExportNamedDeclaration(export_named) => {
            let Some(Declaration::VariableDeclaration(declaration)) =
                export_named.declaration.as_ref()
            else {
                return;
            };

            collect_variable_declaration_value_bindings(
                declaration,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
                value_bindings,
            );
        }
        _ => {}
    }
}

fn collect_variable_declaration_value_bindings(
    declaration: &oxc_allocator::Box<'_, oxc_ast::ast::VariableDeclaration<'_>>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    value_bindings: &mut BTreeMap<String, TypeRef>,
) {
    if declaration.kind != VariableDeclarationKind::Const {
        return;
    }

    for declarator in declaration.declarations.iter() {
        let BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };

        if let Some(value_type) = infer_value_type(
            init,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        ) {
            value_bindings.insert(identifier.name.to_string(), value_type);
        }
    }
}

fn infer_value_type(
    expression: &Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Option<TypeRef> {
    infer_value_type_with_const_context(
        expression,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
        false,
    )
}

pub(super) fn infer_value_type_with_const_context(
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

pub(super) fn infer_ts_as_expression(
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

pub(super) fn infer_ts_satisfies_expression(
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
