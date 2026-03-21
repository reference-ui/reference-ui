mod comments;
mod infer_arrays;
mod infer_objects;
mod infer_primitives;
mod members;
mod module_bindings;
mod symbols;
mod type_references;
mod types;
mod values;

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;

use self::module_bindings::{
    collect_default_export_declaration, collect_exported_declaration, collect_import_bindings,
};
use self::symbols::{push_interface_shell, push_type_alias_shell};
use self::values::collect_statement_value_bindings;
use crate::tasty::ast::model::{ImportBinding, ParsedFileAst, SymbolShell};
use crate::tasty::model::ScannerDiagnostic;
use crate::tasty::scanner::{ScannedFile, ScannedWorkspace};

pub(super) fn extract_files(
    scanned_workspace: &ScannedWorkspace,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> Vec<ParsedFileAst> {
    scanned_workspace
        .files
        .iter()
        .map(|scanned_file| {
            extract_file(
                &scanned_workspace.root_dir,
                scanned_file,
                &scanned_workspace.file_ids,
                diagnostics,
            )
        })
        .collect()
}

fn extract_file(
    root_dir: &std::path::Path,
    scanned_file: &ScannedFile,
    file_id_set: &std::collections::BTreeSet<String>,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> ParsedFileAst {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&scanned_file.file_id).unwrap_or_default();
    let parse_result = Parser::new(&allocator, &scanned_file.source, source_type).parse();

    record_parse_errors(scanned_file, parse_result.errors.len(), diagnostics);

    let mut import_bindings = BTreeMap::new();
    let mut value_bindings = BTreeMap::new();
    let mut export_bindings = BTreeMap::new();
    let mut exports = Vec::new();
    let comments = &parse_result.program.comments;

    for statement in parse_result.program.body.iter() {
        collect_statement_import_bindings(
            root_dir,
            scanned_file,
            statement,
            file_id_set,
            &mut import_bindings,
        );
        collect_statement_value_bindings(
            statement,
            &scanned_file.source,
            &import_bindings,
            &scanned_file.module_specifier,
            &scanned_file.library,
            &mut value_bindings,
        );
        collect_statement_exports(
            scanned_file,
            statement,
            comments,
            &import_bindings,
            &mut export_bindings,
            &mut exports,
        );
    }

    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        source: scanned_file.source.clone(),
        import_bindings,
        value_bindings,
        export_bindings,
        exports,
    }
}

fn record_parse_errors(
    scanned_file: &ScannedFile,
    error_count: usize,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) {
    if error_count == 0 {
        return;
    }

    diagnostics.push(ScannerDiagnostic {
        file_id: scanned_file.file_id.clone(),
        message: format!("parse reported {error_count} error(s)"),
    });
}

fn collect_statement_import_bindings(
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

fn collect_statement_exports(
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

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}
