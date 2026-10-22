//! Per-file Oxc parse + statement walk that produces [`ParsedFileAst`](crate::ast::model::ParsedFileAst).
//! Parses with Oxc and runs the statement loop; extract_files is the entry point. A file the nesting gate refuses
//! yields an empty shell and one TST-W-PARSE-ERROR, so its siblings still extract.

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{Comment, Statement, TSInterfaceDeclaration, TSTypeAliasDeclaration};
use shared::parse::parse_bounded;
use oxc_span::{GetSpan, SourceType};

use super::module_bindings::{ExportOutputs, ExportScope};
use super::namespaces::{collect_namespace_table, NamespaceView};
use super::statements::{
    exports_from_statement, import_bindings_from_statement, unresolved_import_diagnostics,
    unsupported_syntax_diagnostics,
};
use super::symbols::{push_interface_shell, push_type_alias_shell};
use super::values::value_bindings_from_statement;
use super::{ExtractionContext, ShellSink, StatementScope};
use crate::ast::model::{ImportBinding, ParsedFileAst, SymbolShell};
use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::diagnostics::{DiagnosticError, TastyDiagnostic};
use crate::model::TypeRef;
use crate::scanner::symbol_id;
use crate::scanner::{ImportResolver, ScannedFile, ScannedWorkspace};

pub(crate) fn extract_files(
    scanned_workspace: &ScannedWorkspace,
    resolver: &ImportResolver,
    diagnostics: &mut Vec<TastyDiagnostic>,
) -> Result<Vec<ParsedFileAst>, DiagnosticError> {
    scanned_workspace
        .files
        .iter()
        .map(|file| extract_file(resolver, file, &scanned_workspace.file_ids, diagnostics))
        .collect()
}

fn extract_file(
    resolver: &ImportResolver,
    scanned_file: &ScannedFile,
    file_id_set: &std::collections::BTreeSet<String>,
    diagnostics: &mut Vec<TastyDiagnostic>,
) -> Result<ParsedFileAst, DiagnosticError> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&scanned_file.file_id).unwrap_or_default();
    let parsed = match parse_bounded(&allocator, &scanned_file.source, source_type) {
        Ok(parsed) => parsed,
        Err(refusal) => {
            diagnostics.push(crate::diagnostics::nesting_refused(&scanned_file.file_id, refusal)?);
            return Ok(refused_file(scanned_file));
        }
    };

    record_parse_errors(scanned_file, parsed.errors.len(), diagnostics)?;
    diagnostics.extend(unresolved_import_diagnostics(
        resolver,
        scanned_file,
        file_id_set,
        &parsed.program.body,
    )?);
    diagnostics.extend(unsupported_syntax_diagnostics(
        scanned_file,
        &parsed.program.body,
    )?);

    let comments = &parsed.program.comments;
    let namespaces = collect_namespace_table(&parsed.program.body, &scanned_file.source);
    let mut bindings = FileBindings::default();
    bindings.import_bindings.extend(namespaces.aliases.clone());

    let scope = StatementScope {
        resolver,
        file_id_set,
        scanned_file,
        comments,
    };
    for statement in parsed.program.body.iter() {
        bindings.apply_statement(&scope, statement);
    }

    bindings.materialize_library_export_closure(scanned_file, &parsed.program.body, comments);

    let view = NamespaceView {
        scanned_file,
        comments,
        file_bindings: &bindings.import_bindings,
        table: &namespaces,
    };
    view.record_export_aliases(&mut bindings.export_bindings, &mut bindings.reexport_target);
    let seeds: Vec<String> = bindings.export_bindings.values().cloned().collect();
    view.materialize(seeds, &mut bindings.exports);

    Ok(ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        import_bindings: bindings.import_bindings,
        value_bindings: bindings.value_bindings,
        export_bindings: bindings.export_bindings,
        reexport_target: bindings.reexport_target,
        export_all_targets: bindings.export_all_targets,
        exports: bindings.exports,
    })
}

#[derive(Default)]
struct FileBindings {
    import_bindings: BTreeMap<String, ImportBinding>,
    value_bindings: BTreeMap<String, TypeRef>,
    export_bindings: BTreeMap<String, String>,
    reexport_target: BTreeMap<String, (String, String)>,
    export_all_targets: Vec<String>,
    exports: Vec<SymbolShell>,
}

impl FileBindings {
    fn apply_statement(&mut self, scope: &StatementScope<'_>, statement: &Statement<'_>) {
        import_bindings_from_statement(scope, statement, &mut self.import_bindings);
        let value_ctx = ExtractionContext {
            source: &scope.scanned_file.source,
            comments: &[],
            import_bindings: &self.import_bindings,
            module_specifier: &scope.scanned_file.module_specifier,
            library: &scope.scanned_file.library,
        };
        value_bindings_from_statement(statement, &value_ctx, &mut self.value_bindings);

        let export_ctx = ExtractionContext {
            source: &scope.scanned_file.source,
            comments: scope.comments,
            import_bindings: &self.import_bindings,
            module_specifier: &scope.scanned_file.module_specifier,
            library: &scope.scanned_file.library,
        };
        let export_scope = ExportScope {
            file_id: &scope.scanned_file.file_id,
            ctx: &export_ctx,
            resolver: scope.resolver,
            file_id_set: scope.file_id_set,
        };
        let mut outputs = ExportOutputs {
            export_bindings: &mut self.export_bindings,
            reexport_target: &mut self.reexport_target,
            export_all_targets: &mut self.export_all_targets,
            exports: &mut self.exports,
        };
        exports_from_statement(&export_scope, statement, &mut outputs);
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

        let local_decls = local_type_decls(statements);
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
            let mut sink = ShellSink {
                file_id: &scanned_file.file_id,
                ctx: &ctx,
                exports: &mut self.exports,
            };
            push_local_decl(local_decl, &mut sink, exported_locals.contains(&local_name));

            let Some(shell) = self.exports.get(export_len_before) else {
                continue;
            };
            emitted.insert(shell.id.clone());
            pending.extend(
                local_references_in_file(shell, &scanned_file.module_specifier)
                    .into_iter()
                    .filter(|referenced_local| local_decls.contains_key(referenced_local)),
            );
        }
    }
}

/// A local interface or type alias that a library export closure may emit.
enum LocalTypeDecl<'a> {
    Interface(&'a TSInterfaceDeclaration<'a>),
    TypeAlias(&'a TSTypeAliasDeclaration<'a>),
}

/// The interface and type-alias declarations of a file, keyed by name. A later declaration with the same name
/// replaces an earlier one, as it did when the map was collected in one pass.
fn local_type_decls<'a>(statements: &'a [Statement<'a>]) -> BTreeMap<String, LocalTypeDecl<'a>> {
    statements.iter().filter_map(local_type_decl).collect()
}

fn local_type_decl<'a>(statement: &'a Statement<'a>) -> Option<(String, LocalTypeDecl<'a>)> {
    match statement {
        Statement::TSInterfaceDeclaration(interface_decl) => Some((
            interface_decl.id.name.to_string(),
            LocalTypeDecl::Interface(interface_decl),
        )),
        Statement::TSTypeAliasDeclaration(type_alias) => Some((
            type_alias.id.name.to_string(),
            LocalTypeDecl::TypeAlias(type_alias),
        )),
        _ => None,
    }
}

/// Pushes one local declaration's symbol shell into the sink, marked exported or not.
fn push_local_decl(local_decl: &LocalTypeDecl<'_>, sink: &mut ShellSink<'_, '_>, exported: bool) {
    match local_decl {
        LocalTypeDecl::Interface(interface_decl) => {
            push_interface_shell(sink, interface_decl, interface_decl.span(), exported)
        }
        LocalTypeDecl::TypeAlias(type_alias) => {
            push_type_alias_shell(sink, type_alias, type_alias.span(), exported)
        }
    }
}

/// Names a library shell reaches in its own module, which the export closure may need to emit. A type
/// parameter is never a dependency, so a nested binder's flagged reference is skipped, and a shell's own
/// parameters are skipped by name because the resolver has not flagged them yet at this point.
fn local_references_in_file(shell: &SymbolShell, module_specifier: &str) -> Vec<String> {
    shell
        .references
        .iter()
        .filter_map(|type_ref| match type_ref {
            TypeRef::Reference {
                name,
                source_module: Some(source_module),
                type_parameter: false,
                ..
            } if source_module == module_specifier && !binds_own_parameter(shell, name) => {
                Some(name.clone())
            }
            _ => None,
        })
        .collect()
}

fn binds_own_parameter(shell: &SymbolShell, name: &str) -> bool {
    shell
        .type_parameters
        .iter()
        .any(|parameter| parameter.name == name)
}

/// The shell of a file the nesting gate refused: its identity and no declarations, so every sibling still resolves
/// and the refusal is reported once, as TST-W-PARSE-ERROR.
fn refused_file(scanned_file: &ScannedFile) -> ParsedFileAst {
    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        import_bindings: BTreeMap::new(),
        value_bindings: BTreeMap::new(),
        export_bindings: BTreeMap::new(),
        reexport_target: BTreeMap::new(),
        export_all_targets: Vec::new(),
        exports: Vec::new(),
    }
}

fn record_parse_errors(
    scanned_file: &ScannedFile,
    error_count: usize,
    diagnostics: &mut Vec<TastyDiagnostic>,
) -> Result<(), DiagnosticError> {
    if error_count == 0 {
        return Ok(());
    }

    diagnostics.push(crate::diagnostics::parse_error(
        &scanned_file.file_id,
        error_count,
    )?);
    Ok(())
}
