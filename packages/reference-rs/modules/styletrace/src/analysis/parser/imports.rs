//! Collects one module's import bindings: each local name it binds, mapped to the module and imported name behind it.
//! It takes an import declaration and the module source text, and emits one `TraceImport` per specifier into the module's import table.
//! Default specifiers bind only for value imports, so a type-only default import leaves no binding to trace.

use oxc_ast::ast::{ImportDeclarationSpecifier, ImportOrExportKind};
use rustc_hash::FxHashMap;

use crate::analysis::model::TraceImport;
use crate::analysis::util::{module_export_name, module_source_literal};
use oxc_span::GetSpan;

/// The facts every specifier of one import declaration shares.
struct ImportSite<'a> {
    source: &'a str,
    module: String,
    type_only: bool,
}

impl ImportSite<'_> {
    fn binding(&self, imported_name: String, is_namespace: bool) -> TraceImport {
        TraceImport {
            source: self.module.clone(),
            imported_name,
            is_namespace,
        }
    }
}

pub(super) fn collect_imports(
    source: &str,
    import_decl: &oxc_ast::ast::ImportDeclaration<'_>,
    imports: &mut FxHashMap<String, TraceImport>,
) {
    let Some(specifiers) = &import_decl.specifiers else {
        return;
    };
    let site = ImportSite {
        source,
        module: module_source_literal(source, import_decl.source.span()),
        type_only: import_decl.import_kind == ImportOrExportKind::Type,
    };
    for specifier in specifiers {
        collect_import_specifier(specifier, &site, imports);
    }
}

fn collect_import_specifier(
    specifier: &ImportDeclarationSpecifier<'_>,
    site: &ImportSite<'_>,
    imports: &mut FxHashMap<String, TraceImport>,
) {
    match specifier {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            let imported_name = module_export_name(site.source, &named.imported);
            imports.insert(named.local.name.to_string(), site.binding(imported_name, false));
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
            // Type-only default imports are not recorded as value bindings.
            if !site.type_only {
                let binding = site.binding("default".to_string(), false);
                imports.insert(default_specifier.local.name.to_string(), binding);
            }
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => {
            let binding = site.binding("*".to_string(), true);
            imports.insert(namespace_specifier.local.name.to_string(), binding);
        }
    }
}

