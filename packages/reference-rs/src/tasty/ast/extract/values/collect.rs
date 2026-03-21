use std::collections::BTreeMap;

use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::TypeRef;
use oxc_ast::ast::{BindingPattern, Declaration, Statement, VariableDeclarationKind};

use super::infer_dispatch::infer_value_type_with_const_context;

pub(crate) fn collect_statement_value_bindings(
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
    expression: &oxc_ast::ast::Expression<'_>,
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
