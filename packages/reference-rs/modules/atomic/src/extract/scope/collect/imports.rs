//! Import declaration bindings: named, default, and namespace specifiers.
//! Every value import binds its local name with the specifier and exported
//! name it names, carrying no value of its own. Type-only imports bind
//! nothing. The resolver follows these bindings to the declared export; until
//! a shape resolves, the name shadows like any other binding.

use oxc_ast::ast::{ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind};

use super::super::binding::{Binding, BindingKind, ImportRef};
use super::ScopeCollector;

/// Record the value bindings of an import declaration, skipping type-only.
pub(crate) fn record_import(collector: &mut ScopeCollector, decl: &ImportDeclaration<'_>) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        record_specifier(collector, decl.source.value.as_str(), spec);
    }
}

/// Record one import specifier as an import binding in the current scope.
fn record_specifier(
    collector: &mut ScopeCollector,
    specifier: &str,
    spec: &ImportDeclarationSpecifier<'_>,
) {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind == ImportOrExportKind::Type {
                return;
            }
            // import { brand as primary } from './tokens'
            let imported = super::super::super::bindings::imported_name(&named.imported);
            let binding = import_binding(
                named.local.name.as_str(),
                &imported,
                specifier,
                named.local.span,
            );
            collector.declare_current(named.local.name.as_str(), binding);
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            // import theme from './tokens'
            let binding = import_binding(
                default.local.name.as_str(),
                "default",
                specifier,
                default.local.span,
            );
            collector.declare_current(default.local.name.as_str(), binding);
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => {
            // import * as tokens from './tokens'
            let binding = import_binding(ns.local.name.as_str(), "*", specifier, ns.local.span);
            collector.declare_current(ns.local.name.as_str(), binding);
        }
    }
}

/// One imported name with its specifier and exported name, carrying no value.
fn import_binding(local: &str, imported: &str, specifier: &str, span: oxc_span::Span) -> Binding {
    Binding {
        kind: BindingKind::Import(ImportRef {
            local: local.into(),
            imported: imported.into(),
            specifier: specifier.into(),
        }),
        init: None,
        span,
    }
}
