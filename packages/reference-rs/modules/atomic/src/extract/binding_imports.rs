//! The import pass behind [`ExtractBindings`](super::ExtractBindings), a child
//! module of `bindings` kept beside it.
//!
//! Walks a program's value imports once. Reference specifiers bind `css` /
//! `recipe` sites, JSX hosts and namespaces; every other specifier asks the
//! project walk (when there is one) whether it traces to a Reference export,
//! and otherwise records where it ends as the local's provenance. Without a
//! graph, a specifier's spelling alone classifies it.

use oxc_ast::ast::{
    ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind, Program, Statement,
};

use super::super::provenance::{import_provenance, ImportShape, TagProvenance};
use super::{imported_name, is_reference_package, ExtractBindings, IdentityCtx};

/// One pass over the program's value imports. Does not walk calls.
pub(super) fn collect(program: &Program<'_>, ctx: Option<&IdentityCtx<'_, '_>>) -> ExtractBindings {
    let mut bindings = ExtractBindings::default();
    for stmt in &program.body {
        let Statement::ImportDeclaration(decl) = stmt else {
            continue;
        };
        record_import(&mut bindings, decl, ctx);
    }
    bindings
}

/// One non-Reference import source plus the project walk, if any.
#[derive(Clone, Copy)]
struct ImportSite<'a, 'c, 's> {
    source: &'a str,
    ctx: Option<&'c IdentityCtx<'c, 's>>,
}

impl ImportSite<'_, '_, '_> {
    /// The provenance this site proves for one import shape.
    fn provenance(&self, shape: ImportShape<'_>) -> TagProvenance {
        import_provenance(self.ctx, self.source, shape)
    }

    /// The Reference export `imported` traces to through the project walk.
    fn trace_named(&self, imported: &str) -> Option<String> {
        self.ctx
            .and_then(|ctx| ctx.trace_named(self.source, imported))
    }
}

/// Record one value import declaration: Reference specifiers bind sites,
/// every other source walks for identity and provenance.
fn record_import(
    bindings: &mut ExtractBindings,
    decl: &ImportDeclaration<'_>,
    ctx: Option<&IdentityCtx<'_, '_>>,
) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let source = decl.source.value.as_str();
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    let reference = is_reference_package(source);
    let site = ImportSite { source, ctx };
    for spec in specifiers {
        if reference {
            record_specifier(bindings, spec);
        } else {
            extend_specifier(bindings, spec, site);
        }
    }
}

/// One non-Reference specifier: named and default imports record by
/// Reference origin when the walk proves one, namespaces record live
/// members eagerly, and every value local records its provenance.
fn extend_specifier(
    bindings: &mut ExtractBindings,
    spec: &ImportDeclarationSpecifier<'_>,
    site: ImportSite<'_, '_, '_>,
) {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind == ImportOrExportKind::Type {
                return;
            }
            let imported = imported_name(&named.imported);
            extend_named(bindings, named.local.name.as_str(), &imported, site);
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            extend_named(bindings, default.local.name.as_str(), "default", site);
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => {
            extend_namespace(bindings, ns.local.name.as_str(), site);
        }
    }
}

/// A named or default import: a traced Reference export binds the site
/// and proves `Own`; anything else records the walk's provenance.
fn extend_named(
    bindings: &mut ExtractBindings,
    local: &str,
    imported: &str,
    site: ImportSite<'_, '_, '_>,
) {
    if let Some(exported) = site.trace_named(imported) {
        record_named(bindings, local, exported);
        return;
    }
    let provenance = site.provenance(ImportShape::Named(imported));
    bindings.provenance.insert(local.to_string(), provenance);
}

/// A namespace over a wrapper: `ui.css` is live exactly when the wrapper
/// exports `css` from Reference's `css` (same for `recipe`). The namespace
/// itself takes its module's provenance.
fn extend_namespace(bindings: &mut ExtractBindings, local: &str, site: ImportSite<'_, '_, '_>) {
    if site.trace_named("css").as_deref() == Some("css") {
        bindings.reexport_css_ns.insert(local.to_string());
    }
    if site.trace_named("recipe").as_deref() == Some("recipe") {
        bindings.reexport_recipe_ns.insert(local.to_string());
    }
    let provenance = site.provenance(ImportShape::Namespace);
    bindings.provenance.insert(local.to_string(), provenance);
}

fn record_specifier(bindings: &mut ExtractBindings, spec: &ImportDeclarationSpecifier<'_>) {
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
            let local = ns.local.name.to_string();
            bindings
                .provenance
                .insert(local.clone(), TagProvenance::Own);
            bindings.namespaces.insert(local);
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(_) => {}
    }
}

/// A Reference-proven local: `css` / `recipe` sites or a JSX host, all `Own`.
fn record_named(bindings: &mut ExtractBindings, local: &str, imported: String) {
    bindings
        .provenance
        .insert(local.to_string(), TagProvenance::Own);
    match imported.as_str() {
        "css" | "__reference_ui_css" => {
            bindings.css.insert(local.to_string());
        }
        "recipe" | "__reference_ui_recipe" => {
            bindings.recipe.insert(local.to_string());
        }
        _ => {
            bindings.jsx.insert(local.to_string());
        }
    }
}
