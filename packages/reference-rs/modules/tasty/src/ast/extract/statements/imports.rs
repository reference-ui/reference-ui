//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::collections::BTreeMap;

use oxc_ast::ast::Statement;

use super::super::module_bindings::collect_import_bindings;
use super::super::StatementScope;
use crate::ast::model::ImportBinding;

pub(crate) fn import_bindings_from_statement(
    scope: &StatementScope<'_>,
    statement: &Statement<'_>,
    import_bindings: &mut BTreeMap<String, ImportBinding>,
) {
    let Statement::ImportDeclaration(import) = statement else {
        return;
    };

    collect_import_bindings(scope, import, import_bindings);
}
