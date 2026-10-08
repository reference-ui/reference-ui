//! File-local Reference import bindings for diagnostics analysis.
//!
//! Scans one program's direct Reference imports: which local names spell
//! `css()`, which spell JSX hosts, and which namespaces carry `css` as a
//! member. Type-only imports bind nothing, default imports are not sites,
//! and `recipe` imports are neither. Re-export tracing stays an extraction
//! job, so a site analysis misses is silence, never a phantom expectation.

use rustc_hash::FxHashSet;

/// File-local Reference import bindings for one program.
#[derive(Debug, Default)]
pub struct FileBindings {
    pub css: FxHashSet<String>,
    pub jsx: FxHashSet<String>,
    pub namespaces: FxHashSet<String>,
}

/// Scan one program's direct Reference imports into file-local bindings.
pub fn scan_imports(program: &oxc_ast::ast::Program<'_>) -> FileBindings {
    use oxc_ast::ast::Statement;
    let mut bindings = FileBindings::default();
    for stmt in &program.body {
        let Statement::ImportDeclaration(decl) = stmt else {
            continue;
        };
        record_import(&mut bindings, decl);
    }
    bindings
}

/// Record one import declaration's Reference bindings, if it carries any.
fn record_import(bindings: &mut FileBindings, decl: &oxc_ast::ast::ImportDeclaration<'_>) {
    use oxc_ast::ast::ImportOrExportKind;
    if decl.import_kind == ImportOrExportKind::Type
        || !is_reference_package(decl.source.value.as_str())
    {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        record_specifier(bindings, spec);
    }
}

/// Record one import specifier: named imports by export, namespaces whole,
/// default imports never.
fn record_specifier(
    bindings: &mut FileBindings,
    spec: &oxc_ast::ast::ImportDeclarationSpecifier<'_>,
) {
    use oxc_ast::ast::{ImportDeclarationSpecifier, ImportOrExportKind};
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind == ImportOrExportKind::Type {
                return;
            }
            record_named(
                bindings,
                named.local.name.as_str(),
                imported_name(&named.imported),
            );
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => {
            bindings.namespaces.insert(ns.local.name.to_string());
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(_) => {}
    }
}

/// Record one named import: `css` joins the call gate, components join
/// the host gate, `recipe` is ignored.
fn record_named(bindings: &mut FileBindings, local: &str, imported: &str) {
    match imported {
        "css" | "__reference_ui_css" => {
            bindings.css.insert(local.to_string());
        }
        "recipe" | "__reference_ui_recipe" => {}
        _ => {
            bindings.jsx.insert(local.to_string());
        }
    }
}

/// The imported spelling of one named import specifier, borrowed: every
/// arm names an AST atom, so matching never allocates.
fn imported_name<'a>(name: &oxc_ast::ast::ModuleExportName<'a>) -> &'a str {
    match name {
        oxc_ast::ast::ModuleExportName::IdentifierName(id) => id.name.as_str(),
        oxc_ast::ast::ModuleExportName::IdentifierReference(id) => id.name.as_str(),
        oxc_ast::ast::ModuleExportName::StringLiteral(lit) => lit.value.as_str(),
    }
}

/// True for the two packages whose imports are analysis surfaces. This
/// two-string allowlist intentionally duplicates the extraction gate:
/// analysis must stay decoupled from the binding logic whose omissions it
/// exists to catch. Drift watch: `extract::bindings::is_reference_package`.
fn is_reference_package(source: &str) -> bool {
    matches!(source, "@reference-ui/react" | "@reference-ui/styled")
}

#[cfg(test)]
mod tests {
    use super::super::support::parse_for_test;
    use super::*;

    #[test]
    fn import_scan_gates_css_hosts_and_namespaces() {
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(
            &allocator,
            "import { css, Div, recipe } from '@reference-ui/react';\n\
             import * as ui from '@reference-ui/styled';\n\
             import { css as other } from 'other';\n\
             import type { css as tcss } from '@reference-ui/react';",
        );
        let bindings = scan_imports(&program);
        assert!(bindings.css.contains("css"));
        assert!(bindings.jsx.contains("Div"));
        assert!(!bindings.css.contains("recipe"));
        assert!(!bindings.jsx.contains("recipe"));
        assert!(bindings.namespaces.contains("ui"));
        assert!(!bindings.css.contains("other"));
        assert!(!bindings.css.contains("tcss"));
    }
}
