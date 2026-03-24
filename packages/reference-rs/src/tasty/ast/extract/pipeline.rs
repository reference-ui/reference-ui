//! Per-file Oxc parse + statement walk that produces [`ParsedFileAst`](crate::tasty::ast::model::ParsedFileAst).

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{Comment, Statement, TSInterfaceDeclaration, TSTypeAliasDeclaration};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use super::statements::{exports_from_statement, import_bindings_from_statement};
use super::symbols::{push_interface_shell, push_type_alias_shell};
use super::values::value_bindings_from_statement;
use super::ExtractionContext;
use crate::tasty::ast::model::{ImportBinding, ParsedFileAst, SymbolShell};
use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
use crate::tasty::model::{ScannerDiagnostic, TypeRef};
use crate::tasty::scanner::symbol_id;
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

    bindings.materialize_library_export_closure(scanned_file, &parsed.program.body, comments);

    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        source: scanned_file.source.clone(),
        import_bindings: bindings.import_bindings,
        value_bindings: bindings.value_bindings,
        export_bindings: bindings.export_bindings,
        reexport_target: bindings.reexport_target,
        exports: bindings.exports,
    }
}

#[derive(Default)]
struct FileBindings {
    import_bindings: BTreeMap<String, ImportBinding>,
    value_bindings: BTreeMap<String, TypeRef>,
    export_bindings: BTreeMap<String, String>,
    reexport_target: BTreeMap<String, (String, String)>,
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
        import_bindings_from_statement(
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
        value_bindings_from_statement(statement, &value_ctx, &mut self.value_bindings);
        exports_from_statement(
            root_dir,
            file_id_set,
            scanned_file,
            statement,
            comments,
            &mut self.import_bindings,
            &mut self.export_bindings,
            &mut self.reexport_target,
            &mut self.exports,
        );
    }

    fn materialize_library_export_closure(
        &mut self,
        scanned_file: &ScannedFile,
        statements: &[Statement<'_>],
        comments: &[Comment],
    ) {
        if scanned_file.library == USER_LIBRARY_NAME {
            return;
        }

        enum LocalTypeDecl<'a> {
            Interface(&'a TSInterfaceDeclaration<'a>),
            TypeAlias(&'a TSTypeAliasDeclaration<'a>),
        }

        let local_decls = statements
            .iter()
            .filter_map(|statement| match statement {
                Statement::TSInterfaceDeclaration(interface_decl) => Some((
                    interface_decl.id.name.to_string(),
                    LocalTypeDecl::Interface(interface_decl),
                )),
                Statement::TSTypeAliasDeclaration(type_alias) => Some((
                    type_alias.id.name.to_string(),
                    LocalTypeDecl::TypeAlias(type_alias),
                )),
                _ => None,
            })
            .collect::<BTreeMap<_, _>>();

        if local_decls.is_empty() {
            return;
        }

        let ctx = ExtractionContext {
            source: &scanned_file.source,
            comments,
            import_bindings: &self.import_bindings,
            module_specifier: &scanned_file.module_specifier,
            library: &scanned_file.library,
        };

        let exported_locals = self
            .export_bindings
            .values()
            .filter(|name| name.as_str() != "default")
            .cloned()
            .collect::<std::collections::BTreeSet<_>>();

        let mut pending = exported_locals.iter().cloned().collect::<Vec<_>>();
        let mut emitted = self
            .exports
            .iter()
            .map(|shell| shell.id.clone())
            .collect::<std::collections::BTreeSet<_>>();

        while let Some(local_name) = pending.pop() {
            let local_id = symbol_id(&scanned_file.file_id, &local_name);
            if emitted.contains(&local_id) {
                continue;
            }

            let Some(local_decl) = local_decls.get(&local_name) else {
                continue;
            };

            let export_len_before = self.exports.len();
            let is_exported = exported_locals.contains(&local_name);

            match local_decl {
                LocalTypeDecl::Interface(interface_decl) => push_interface_shell(
                    &scanned_file.file_id,
                    &ctx,
                    interface_decl,
                    interface_decl.span(),
                    is_exported,
                    &mut self.exports,
                ),
                LocalTypeDecl::TypeAlias(type_alias) => push_type_alias_shell(
                    &scanned_file.file_id,
                    &ctx,
                    type_alias,
                    type_alias.span(),
                    is_exported,
                    &mut self.exports,
                ),
            }

            let Some(shell) = self.exports.get(export_len_before) else {
                continue;
            };

            emitted.insert(shell.id.clone());

            for referenced_local in local_references_in_file(shell, &scanned_file.module_specifier) {
                if local_decls.contains_key(&referenced_local) {
                    pending.push(referenced_local);
                }
            }
        }
    }
}

fn local_references_in_file(shell: &SymbolShell, module_specifier: &str) -> Vec<String> {
    shell
        .references
        .iter()
        .filter_map(|type_ref| match type_ref {
            TypeRef::Reference {
                name,
                source_module: Some(source_module),
                ..
            } if source_module == module_specifier => Some(name.clone()),
            _ => None,
        })
        .collect()
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
