//! Top-level statements tasty does not extract, each named by a warning instead of dropped silently.
//! A `declare module` augmentation of a path-shaped specifier (`./base`) warns `TST-W-UNSUPPORTED-AUGMENTATION`,
//! and `declare global`, `import x = …`, and `export =` warn `TST-W-UNSUPPORTED-SYNTAX` with the construct named.
//! Only user-owned and reference-ui files are reported, since a dependency's declarations are not fixable here.
//! Bare-package ambient declarations stay silent, because a bare specifier may name a package nobody installed.
//! The pass reads statements only, so it never changes what extraction keeps, and it reports each distinct module or construct once per file.

use std::collections::BTreeSet;

use oxc_ast::ast::{Statement, TSModuleDeclaration, TSModuleDeclarationName, TSModuleReference};

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

    statements
        .iter()
        .filter_map(unsupported_statement)
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

fn unsupported_statement(statement: &Statement<'_>) -> Option<Unsupported> {
    match statement {
        Statement::TSModuleDeclaration(declaration) => augmentation(declaration),
        Statement::TSGlobalDeclaration(_) => Some(Unsupported::Syntax("declare global")),
        Statement::TSImportEqualsDeclaration(import) => Some(Unsupported::Syntax(
            import_equals_construct(&import.module_reference),
        )),
        Statement::TSExportAssignment(_) => Some(Unsupported::Syntax("export =")),
        _ => None,
    }
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

fn import_equals_construct(reference: &TSModuleReference<'_>) -> &'static str {
    match reference {
        TSModuleReference::ExternalModuleReference(_) => "import x = require()",
        TSModuleReference::IdentifierReference(_) | TSModuleReference::QualifiedName(_) => {
            "import x = <entity>"
        }
    }
}
