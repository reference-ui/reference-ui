//! Dangling module requests in one file: the path-shaped specifiers of `import`, `export * from`,
//! and `export { x } from` statements that name no file on disk. Extraction keeps the names those
//! statements provide external, so this pass turns each distinct (file, specifier) pair into one
//! `TST-W-UNRESOLVED-IMPORT` warning instead of letting the drop stay silent. Bare package
//! specifiers are never reported, because an uninstalled package may be a type nobody needs here.
//! The specifier text is read the same way each binding site reads it, so the verdict matches the
//! resolution the rest of extraction performed.

use std::collections::BTreeSet;

use oxc_ast::ast::{Statement, StringLiteral};

use super::super::slice_span;
use crate::diagnostics::{DiagnosticError, TastyDiagnostic};
use crate::scanner::{ImportResolver, ScannedFile};

pub(crate) fn unresolved_import_diagnostics(
    resolver: &ImportResolver,
    scanned_file: &ScannedFile,
    file_id_set: &BTreeSet<String>,
    statements: &[Statement<'_>],
) -> Result<Vec<TastyDiagnostic>, DiagnosticError> {
    statements
        .iter()
        .filter_map(|statement| request_specifier(statement, &scanned_file.source))
        .collect::<BTreeSet<String>>()
        .into_iter()
        .filter(|specifier| is_dangling(resolver, scanned_file, file_id_set, specifier))
        .map(|specifier| crate::diagnostics::unresolved_import(&scanned_file.file_id, &specifier))
        .collect()
}

/// The module specifier of a statement that loads another module, if it has one.
fn request_specifier(statement: &Statement<'_>, source: &str) -> Option<String> {
    match statement {
        Statement::ImportDeclaration(import) => Some(raw_specifier(&import.source, source)),
        Statement::ExportAllDeclaration(export) => Some(trim_quotes(export.source.value.as_str())),
        Statement::ExportNamedDeclaration(export) => export
            .source
            .as_ref()
            .map(|literal| raw_specifier(literal, source)),
        _ => None,
    }
}

fn raw_specifier(literal: &StringLiteral<'_>, source: &str) -> String {
    trim_quotes(slice_span(source, literal.span))
}

fn trim_quotes(text: &str) -> String {
    text.trim_matches('"').trim_matches('\'').to_string()
}

/// Only relative and absolute specifiers are path requests. A target that the scan did not
/// include but that exists on disk (a stylesheet, a JSON file, a file outside the globs) is not
/// dangling, so the disk check is what separates a missing target from a skipped one.
fn is_dangling(
    resolver: &ImportResolver,
    scanned_file: &ScannedFile,
    file_id_set: &BTreeSet<String>,
    specifier: &str,
) -> bool {
    let path_shaped = specifier.starts_with('.') || specifier.starts_with('/');
    path_shaped
        && resolver
            .resolve_import(&scanned_file.file_id, specifier, file_id_set)
            .is_none()
        && !resolver.names_file_on_disk(&scanned_file.file_id, specifier)
}
