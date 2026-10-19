//! Import statement routing.
//! Turns an ImportDeclaration into collected import bindings for the file's parsed AST.

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
