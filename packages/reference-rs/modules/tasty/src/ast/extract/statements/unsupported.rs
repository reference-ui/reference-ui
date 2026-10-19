//! Module-level statements tasty does not extract, each named by a warning instead of dropped silently.
//! A `declare module` augmentation of a path-shaped specifier (`./base`) warns `TST-W-UNSUPPORTED-AUGMENTATION`. `declare global`,
//! `export =`, and `import x = require()` warn `TST-W-UNSUPPORTED-SYNTAX` with the construct named, and so does an `import x = <entity>`
//! whose head the file never declares. An entity alias whose head the file declares is modelled, so it is not reported.
//! Only user-owned and reference-ui files are reported, since a dependency's declarations are not fixable here.
//! Bare-package ambient declarations stay silent, because a bare specifier may name a package nobody installed, and the pass reads
//! statements only, so it never changes what extraction keeps, reporting each distinct module or construct once per file.

use std::collections::BTreeSet;

use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, ImportDeclaration, ImportDeclarationSpecifier, Statement,
    TSImportEqualsDeclaration, TSModuleDeclaration, TSModuleDeclarationBody,
    TSModuleDeclarationName,
};

use super::super::namespaces::entity_target;
use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::diagnostics::{DiagnosticError, TastyDiagnostic};
use crate::scanner::ScannedFile;

/// One unsupported construct in a file, ordered so one file reports each distinct construct once.
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
enum Unsupported {
    /// A `declare module './x' { … }` augmentation, keyed by its module specifier.
    Augmentation(String),
    /// Module-level syntax named by the construct's source form.
    Syntax(&'static str),
}

pub(crate) fn unsupported_syntax_diagnostics(
    scanned_file: &ScannedFile,
    statements: &[Statement<'_>],
) -> Result<Vec<TastyDiagnostic>, DiagnosticError> {
    if !is_user_owned(scanned_file) {
        return Ok(Vec::new());
    }

    let source = scanned_file.source.as_str();
    let heads = declared_names(statements);
    statements
        .iter()
        .flat_map(|statement| unsupported_statement(statement, &heads, source))
        .collect::<BTreeSet<Unsupported>>()
        .into_iter()
        .map(|finding| match finding {
            Unsupported::Augmentation(module) => {
                crate::diagnostics::unsupported_augmentation(&scanned_file.file_id, &module)
            }
            Unsupported::Syntax(construct) => {
                crate::diagnostics::unsupported_syntax(&scanned_file.file_id, construct)
            }
        })
        .collect()
}

/// Same ownership test the type-shell pass uses: user files and reference-ui packages only.
fn is_user_owned(scanned_file: &ScannedFile) -> bool {
    scanned_file.library == USER_LIBRARY_NAME || scanned_file.library.starts_with("@reference-ui/")
}

/// The findings for one statement. `heads` are the names the enclosing scope declares, which an entity alias's head must name.
fn unsupported_statement(
    statement: &Statement<'_>,
    heads: &BTreeSet<String>,
    source: &str,
) -> Vec<Unsupported> {
    match statement {
        Statement::TSModuleDeclaration(declaration) => module_findings(declaration, heads, source),
        Statement::TSImportEqualsDeclaration(import) => alias_findings(import, heads, source),
        Statement::ExportNamedDeclaration(export) => export_findings(export, heads, source),
        _ => syntax_findings(statement),
    }
}

/// The findings for the statements whose whole construct is unsupported, which carry no declared names of their own.
fn syntax_findings(statement: &Statement<'_>) -> Vec<Unsupported> {
    match statement {
        Statement::TSGlobalDeclaration(_) => vec![Unsupported::Syntax("declare global")],
        Statement::TSExportAssignment(_) => vec![Unsupported::Syntax("export =")],
        _ => Vec::new(),
    }
}

/// An `export import X = …` alias is the same construct as a plain one, so it takes the same check.
fn export_findings(
    export: &ExportNamedDeclaration<'_>,
    heads: &BTreeSet<String>,
    source: &str,
) -> Vec<Unsupported> {
    match &export.declaration {
        Some(Declaration::TSImportEqualsDeclaration(import)) => {
            alias_findings(import, heads, source)
        }
        _ => Vec::new(),
    }
}

fn alias_findings(
    import: &TSImportEqualsDeclaration<'_>,
    heads: &BTreeSet<String>,
    source: &str,
) -> Vec<Unsupported> {
    import_equals(import, heads, source).into_iter().collect()
}

/// A namespace block is checked against the names it declares itself, on top of the file's own.
fn module_findings(
    declaration: &TSModuleDeclaration<'_>,
    heads: &BTreeSet<String>,
    source: &str,
) -> Vec<Unsupported> {
    let mut findings: Vec<Unsupported> = augmentation(declaration).into_iter().collect();
    if let Some(TSModuleDeclarationBody::TSModuleBlock(block)) = &declaration.body {
        let mut block_heads = heads.clone();
        block_heads.extend(declared_names(block.body.as_slice()));
        findings.extend(
            block
                .body
                .iter()
                .flat_map(|statement| unsupported_statement(statement, &block_heads, source)),
        );
    }
    findings
}

/// A body-bearing `declare module` names a module by string. Only a path-shaped name is reported:
/// tasty can address a file, so the augmentation targets something it could have merged.
fn augmentation(declaration: &TSModuleDeclaration<'_>) -> Option<Unsupported> {
    let TSModuleDeclarationName::StringLiteral(module) = &declaration.id else {
        return None;
    };
    let specifier = module.value.as_str();
    (declaration.body.is_some() && is_path_shaped(specifier))
        .then(|| Unsupported::Augmentation(specifier.to_string()))
}

fn is_path_shaped(specifier: &str) -> bool {
    specifier.starts_with('.') || specifier.starts_with('/')
}

/// `import x = require()` always warns, since it names a module object. An entity alias warns only when its head is a name the
/// scope never declares, because a declared head is an entity tasty can address.
fn import_equals(
    import: &TSImportEqualsDeclaration<'_>,
    heads: &BTreeSet<String>,
    source: &str,
) -> Option<Unsupported> {
    let Some(target) = entity_target(&import.module_reference, source) else {
        return Some(Unsupported::Syntax("import x = require()"));
    };
    let head = target.split('.').next().unwrap_or("");
    (!heads.contains(head)).then_some(Unsupported::Syntax("import x = <entity>"))
}

/// The names a statement list declares at its own level.
fn declared_names(statements: &[Statement<'_>]) -> BTreeSet<String> {
    statements.iter().flat_map(statement_names).collect()
}

fn statement_names(statement: &Statement<'_>) -> Vec<String> {
    match statement {
        Statement::ImportDeclaration(import) => import_names(import),
        Statement::ExportNamedDeclaration(export) => export
            .declaration
            .as_ref()
            .map_or_else(Vec::new, declaration_names),
        _ => plain_statement_names(statement),
    }
}

/// The name a non-exported declaration statement declares.
fn plain_statement_names(statement: &Statement<'_>) -> Vec<String> {
    match statement {
        Statement::TSModuleDeclaration(declaration) => {
            module_name(declaration).into_iter().collect()
        }
        Statement::TSInterfaceDeclaration(declaration) => vec![declaration.id.name.to_string()],
        Statement::TSTypeAliasDeclaration(declaration) => vec![declaration.id.name.to_string()],
        Statement::TSImportEqualsDeclaration(import) => vec![import.id.name.to_string()],
        _ => Vec::new(),
    }
}

fn declaration_names(declaration: &Declaration<'_>) -> Vec<String> {
    match declaration {
        Declaration::TSModuleDeclaration(declaration) => {
            module_name(declaration).into_iter().collect()
        }
        Declaration::TSInterfaceDeclaration(declaration) => vec![declaration.id.name.to_string()],
        Declaration::TSTypeAliasDeclaration(declaration) => vec![declaration.id.name.to_string()],
        Declaration::TSImportEqualsDeclaration(import) => vec![import.id.name.to_string()],
        _ => Vec::new(),
    }
}

fn module_name(declaration: &TSModuleDeclaration<'_>) -> Option<String> {
    match &declaration.id {
        TSModuleDeclarationName::Identifier(identifier) => Some(identifier.name.to_string()),
        TSModuleDeclarationName::StringLiteral(_) => None,
    }
}

fn import_names(import: &ImportDeclaration<'_>) -> Vec<String> {
    import
        .specifiers
        .iter()
        .flat_map(|specifiers| specifiers.iter())
        .map(|specifier| match specifier {
            ImportDeclarationSpecifier::ImportSpecifier(named) => named.local.name.to_string(),
            ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
                default.local.name.to_string()
            }
            ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace) => {
                namespace.local.name.to_string()
            }
        })
        .collect()
}
