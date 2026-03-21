use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{Comment, Statement};
use oxc_parser::Parser;
use oxc_span::SourceType;

use super::statements::{collect_statement_exports, collect_statement_import_bindings};
use super::values::collect_statement_value_bindings;
use super::ExtractionContext;
use crate::tasty::ast::model::{ImportBinding, ParsedFileAst, SymbolShell};
use crate::tasty::model::{ScannerDiagnostic, TypeRef};
use crate::tasty::scanner::{ScannedFile, ScannedWorkspace};

pub(crate) fn extract_files(
    scanned_workspace: &ScannedWorkspace,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> Vec<ParsedFileAst> {
    scanned_workspace
        .files
        .iter()
        .map(|file| {
            extract_file(
                &scanned_workspace.root_dir,
                file,
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
    let parsed = Parser::new(&allocator, &scanned_file.source, source_type).parse();

    record_parse_errors(scanned_file, parsed.errors.len(), diagnostics);

    let comments = &parsed.program.comments;
    let mut bindings = FileBindings::default();

    for statement in parsed.program.body.iter() {
        bindings.apply_statement(root_dir, scanned_file, file_id_set, statement, comments);
    }

    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        source: scanned_file.source.clone(),
        import_bindings: bindings.import_bindings,
        value_bindings: bindings.value_bindings,
        export_bindings: bindings.export_bindings,
        exports: bindings.exports,
    }
}

#[derive(Default)]
struct FileBindings {
    import_bindings: BTreeMap<String, ImportBinding>,
    value_bindings: BTreeMap<String, TypeRef>,
    export_bindings: BTreeMap<String, String>,
    exports: Vec<SymbolShell>,
}

impl FileBindings {
    fn apply_statement(
        &mut self,
        root_dir: &std::path::Path,
        scanned_file: &ScannedFile,
        file_id_set: &std::collections::BTreeSet<String>,
        statement: &Statement<'_>,
        comments: &[Comment],
    ) {
        collect_statement_import_bindings(
            root_dir,
            scanned_file,
            statement,
            file_id_set,
            &mut self.import_bindings,
        );
        let value_ctx = ExtractionContext {
            source: &scanned_file.source,
            comments: &[],
            import_bindings: &self.import_bindings,
            module_specifier: &scanned_file.module_specifier,
            library: &scanned_file.library,
        };
        collect_statement_value_bindings(statement, &value_ctx, &mut self.value_bindings);
        collect_statement_exports(
            scanned_file,
            statement,
            comments,
            &self.import_bindings,
            &mut self.export_bindings,
            &mut self.exports,
        );
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
