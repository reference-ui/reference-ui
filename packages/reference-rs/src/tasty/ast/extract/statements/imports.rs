use std::collections::BTreeMap;

use oxc_ast::ast::Statement;

use super::super::module_bindings::collect_import_bindings;
use crate::tasty::ast::model::ImportBinding;
use crate::tasty::scanner::ScannedFile;

pub(crate) fn collect_statement_import_bindings(
    root_dir: &std::path::Path,
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    file_id_set: &std::collections::BTreeSet<String>,
    import_bindings: &mut BTreeMap<String, ImportBinding>,
) {
    let Statement::ImportDeclaration(import) = statement else {
        return;
    };

    collect_import_bindings(
        root_dir,
        &scanned_file.file_id,
        import,
        &scanned_file.source,
        file_id_set,
        import_bindings,
    );
}
