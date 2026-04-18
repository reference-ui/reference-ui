use std::collections::BTreeMap;

use crate::tasty::model::TypeRef;
use oxc_ast::ast::{BindingPattern, Declaration, Statement, VariableDeclarationKind};

use super::super::ExtractionContext;
use super::infer_dispatch::infer_value_type_with_const_context;

pub(crate) fn value_bindings_from_statement(
    statement: &Statement<'_>,
    ctx: &ExtractionContext<'_>,
    value_bindings: &mut BTreeMap<String, TypeRef>,
) {
    match statement {
        Statement::VariableDeclaration(declaration) => {
            collect_variable_declaration_value_bindings(declaration, ctx, value_bindings)
        }
        Statement::ExportNamedDeclaration(export_named) => {
            let Some(Declaration::VariableDeclaration(declaration)) =
                export_named.declaration.as_ref()
            else {
                return;
            };

            collect_variable_declaration_value_bindings(declaration, ctx, value_bindings);
        }
        _ => {}
    }
}

fn collect_variable_declaration_value_bindings(
    declaration: &oxc_allocator::Box<'_, oxc_ast::ast::VariableDeclaration<'_>>,
    ctx: &ExtractionContext<'_>,
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

        if let Some(value_type) = infer_value_type(init, ctx) {
            value_bindings.insert(identifier.name.to_string(), value_type);
        }
    }
}

fn infer_value_type(
    expression: &oxc_ast::ast::Expression<'_>,
    ctx: &ExtractionContext<'_>,
) -> Option<TypeRef> {
    infer_value_type_with_const_context(expression, ctx, false)
}
