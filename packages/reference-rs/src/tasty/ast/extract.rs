mod comments;
mod lowering;
mod module_bindings;
mod symbols;

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::Statement;
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};

use self::module_bindings::{
    collect_default_export_declaration, collect_exported_declaration, collect_import_bindings,
};
use self::symbols::{push_interface_shell, push_type_alias_shell};
use super::super::model::ScannerDiagnostic;
use super::super::scanner::{ScannedFile, ScannedWorkspace};
use super::model::ParsedFileAst;

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

    if !parse_result.errors.is_empty() {
        diagnostics.push(ScannerDiagnostic {
            file_id: scanned_file.file_id.clone(),
            message: format!("parse reported {} error(s)", parse_result.errors.len()),
        });
    }

    let mut import_bindings = BTreeMap::new();
    let mut export_bindings = BTreeMap::new();
    let mut exports = Vec::new();

    for statement in parse_result.program.body.iter() {
        match statement {
            Statement::ImportDeclaration(import) => {
                collect_import_bindings(
                    root_dir,
                    &scanned_file.file_id,
                    import,
                    &scanned_file.source,
                    file_id_set,
                    &mut import_bindings,
                );
            }
            Statement::ExportNamedDeclaration(export_decl) => {
                collect_exported_declaration(
                    &scanned_file.file_id,
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    export_decl,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    &mut export_bindings,
                    &mut exports,
                );
            }
            Statement::ExportDefaultDeclaration(export_default)
                if scanned_file.library == "user" =>
            {
                collect_default_export_declaration(
                    &scanned_file.file_id,
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    export_default,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    &mut export_bindings,
                    &mut exports,
                );
            }
            Statement::TSInterfaceDeclaration(interface_decl) if scanned_file.library == "user" => {
                push_interface_shell(
                    &scanned_file.file_id,
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    interface_decl,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    false,
                    &mut exports,
                );
            }
            Statement::TSTypeAliasDeclaration(type_alias) if scanned_file.library == "user" => {
                push_type_alias_shell(
                    &scanned_file.file_id,
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    type_alias,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    false,
                    &mut exports,
                );
            }
            _ => {}
        }
    }

    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        source: scanned_file.source.clone(),
        import_bindings,
        export_bindings,
        exports,
    }
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}
