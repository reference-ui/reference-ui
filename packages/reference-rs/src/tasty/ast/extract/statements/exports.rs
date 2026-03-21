use std::collections::BTreeMap;

use oxc_ast::ast::Statement;
use oxc_span::GetSpan;

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;

use super::super::module_bindings::{
    collect_default_export_declaration, collect_exported_declaration,
};
use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use crate::tasty::ast::model::{ImportBinding, SymbolShell};
use crate::tasty::scanner::ScannedFile;

pub(crate) fn collect_statement_exports(
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    comments: &[oxc_ast::ast::Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    collect_named_export_statement(
        scanned_file,
        statement,
        comments,
        import_bindings,
        export_bindings,
        exports,
    );
    collect_user_export_statement(
        scanned_file,
        statement,
        comments,
        import_bindings,
        export_bindings,
        exports,
    );
    collect_user_type_shell(scanned_file, statement, comments, import_bindings, exports);
}

fn collect_named_export_statement(
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    comments: &[oxc_ast::ast::Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    let Statement::ExportNamedDeclaration(export_decl) = statement else {
        return;
    };

    collect_exported_declaration(
        &scanned_file.file_id,
        &scanned_file.module_specifier,
        &scanned_file.library,
        export_decl,
        &scanned_file.source,
        comments,
        import_bindings,
        export_bindings,
        exports,
    );
}

fn collect_user_export_statement(
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    comments: &[oxc_ast::ast::Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    if scanned_file.library != USER_LIBRARY_NAME {
        return;
    }

    let Statement::ExportDefaultDeclaration(export_default) = statement else {
        return;
    };

    collect_default_export_declaration(
        &scanned_file.file_id,
        &scanned_file.module_specifier,
        &scanned_file.library,
        export_default,
        &scanned_file.source,
        comments,
        import_bindings,
        export_bindings,
        exports,
    );
}

fn collect_user_type_shell(
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    comments: &[oxc_ast::ast::Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    exports: &mut Vec<SymbolShell>,
) {
    if scanned_file.library != USER_LIBRARY_NAME {
        return;
    }

    match statement {
        Statement::TSInterfaceDeclaration(interface_decl) => push_interface_shell(
            &scanned_file.file_id,
            &scanned_file.module_specifier,
            &scanned_file.library,
            interface_decl,
            interface_decl.span(),
            &scanned_file.source,
            comments,
            import_bindings,
            false,
            exports,
        ),
        Statement::TSTypeAliasDeclaration(type_alias) => push_type_alias_shell(
            &scanned_file.file_id,
            &scanned_file.module_specifier,
            &scanned_file.library,
            type_alias,
            type_alias.span(),
            &scanned_file.source,
            comments,
            import_bindings,
            false,
            exports,
        ),
        _ => {}
    }
}
