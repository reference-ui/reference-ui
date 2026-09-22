//! File-local Reference import bindings for extract-site gating.
//!
//! Records which local names were imported from `@reference-ui/react` or
//! `@reference-ui/styled`. `css()` / `recipe()` extract only when the callee is
//! one of those bindings and is not shadowed. The compiler-internal
//! `__reference_ui_css` / `__reference_ui_recipe` aliases are reserved: the
//! virtual neutralize pass declares them as top-level `const` bindings, so
//! they extract even though the declaration would otherwise read as a shadow.
//! JSX hosts are the component names from the same packages; unknown `css`
//! is not an extract site.

use oxc_ast::ast::{
    Expression, ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    ModuleExportName, Program, Statement, StaticMemberExpression,
};
use rustc_hash::FxHashSet;

/// Local names bound to Reference `css`, `recipe`, JSX hosts, and namespaces.
#[derive(Debug, Default, Clone)]
pub struct ExtractBindings {
    css: FxHashSet<String>,
    recipe: FxHashSet<String>,
    jsx: FxHashSet<String>,
    namespaces: FxHashSet<String>,
    reexport_css_ns: FxHashSet<String>,
    reexport_recipe_ns: FxHashSet<String>,
}

/// Where an identity walk starts: the importing file plus the project graph.
pub(crate) struct IdentityCtx<'a, 's> {
    pub file: &'a str,
    pub graph: &'a super::identity::IdentityGraph<'s>,
}

impl IdentityCtx<'_, '_> {
    /// The Reference export one import of this file traces to, if any.
    fn trace_named(&self, source: &str, imported: &str) -> Option<String> {
        self.graph
            .trace_reference_export(self.file, source, imported)
    }
}

impl ExtractBindings {
    /// Record a walked import under its Reference origin; a miss records nothing.
    fn record_traced(&mut self, local: &str, origin: Option<String>) {
        if let Some(exported) = origin {
            record_named(self, local, exported);
        }
    }
}

impl ExtractBindings {
    /// Borrow the component names imported from Reference packages. The
    /// extract context unions this with the compile-global hosts by
    /// reference, so per-file setup never clones either set.
    pub fn jsx_hosts_ref(&self) -> &FxHashSet<String> {
        &self.jsx
    }

    /// Origin string when `callee` is a live Reference `css` binding.
    pub fn css_origin(
        &self,
        callee: &Expression<'_>,
        shadowed: &[FxHashSet<String>],
    ) -> Option<String> {
        match callee {
            Expression::Identifier(ident) => live_css_name(self, ident.name.as_str(), shadowed),
            Expression::StaticMemberExpression(member) => css_member_origin(self, member, shadowed),
            _ => None,
        }
    }

    /// Origin string when `callee` is a live Reference `recipe` binding.
    pub fn recipe_origin(
        &self,
        callee: &Expression<'_>,
        shadowed: &[FxHashSet<String>],
    ) -> Option<String> {
        match callee {
            Expression::Identifier(ident) => live_recipe_name(self, ident.name.as_str(), shadowed),
            Expression::StaticMemberExpression(member) => {
                recipe_member_origin(self, member, shadowed)
            }
            _ => None,
        }
    }
}

/// Collect Reference import bindings from a parsed program. Does not walk calls.
pub fn collect_bindings(program: &Program<'_>) -> ExtractBindings {
    let mut bindings = ExtractBindings::default();
    for stmt in &program.body {
        let Statement::ImportDeclaration(decl) = stmt else {
            continue;
        };
        record_import(&mut bindings, decl);
    }
    bindings
}

/// Collect bindings with project identity: direct Reference imports plus
/// names that trace to a Reference export through consumer re-exports.
pub fn collect_bindings_with_identity(
    program: &Program<'_>,
    file: &str,
    graph: &super::identity::IdentityGraph<'_>,
) -> ExtractBindings {
    let mut bindings = collect_bindings(program);
    let ctx = IdentityCtx { file, graph };
    for stmt in &program.body {
        let Statement::ImportDeclaration(decl) = stmt else {
            continue;
        };
        extend_identity(&mut bindings, decl, &ctx);
    }
    bindings
}

/// Record identity carried through a non-Reference import, if the walk proves it.
fn extend_identity(
    bindings: &mut ExtractBindings,
    decl: &ImportDeclaration<'_>,
    ctx: &IdentityCtx<'_, '_>,
) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let source = decl.source.value.as_str();
    if is_reference_package(source) {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        extend_specifier(bindings, spec, source, ctx);
    }
}

/// One non-Reference specifier through the identity walk: named and default
/// imports record by Reference origin; namespaces record live members eagerly.
fn extend_specifier(
    bindings: &mut ExtractBindings,
    spec: &ImportDeclarationSpecifier<'_>,
    source: &str,
    ctx: &IdentityCtx<'_, '_>,
) {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind == ImportOrExportKind::Type {
                return;
            }
            let origin = ctx.trace_named(source, &imported_name(&named.imported));
            bindings.record_traced(named.local.name.as_str(), origin);
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            let origin = ctx.trace_named(source, "default");
            bindings.record_traced(default.local.name.as_str(), origin);
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => {
            extend_namespace(bindings, ns.local.name.as_str(), source, ctx);
        }
    }
}

/// A namespace over a wrapper: `ui.css` is live exactly when the wrapper
/// exports `css` from Reference's `css` (same for `recipe`).
fn extend_namespace(
    bindings: &mut ExtractBindings,
    local: &str,
    source: &str,
    ctx: &IdentityCtx<'_, '_>,
) {
    if ctx
        .graph
        .trace_reference_export(ctx.file, source, "css")
        .as_deref()
        == Some("css")
    {
        bindings.reexport_css_ns.insert(local.to_string());
    }
    if ctx
        .graph
        .trace_reference_export(ctx.file, source, "recipe")
        .as_deref()
        == Some("recipe")
    {
        bindings.reexport_recipe_ns.insert(local.to_string());
    }
}

pub(crate) fn is_shadowed(shadowed: &[FxHashSet<String>], name: &str) -> bool {
    shadowed.iter().any(|scope| scope.contains(name))
}

fn record_import(bindings: &mut ExtractBindings, decl: &ImportDeclaration<'_>) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    if !is_reference_package(decl.source.value.as_str()) {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        record_specifier(bindings, spec);
    }
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
            bindings.namespaces.insert(ns.local.name.to_string());
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(_) => {}
    }
}

fn record_named(bindings: &mut ExtractBindings, local: &str, imported: String) {
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

pub(crate) fn imported_name(name: &ModuleExportName<'_>) -> String {
    match name {
        ModuleExportName::IdentifierName(id) => id.name.to_string(),
        ModuleExportName::IdentifierReference(id) => id.name.to_string(),
        ModuleExportName::StringLiteral(lit) => lit.value.to_string(),
    }
}

pub(crate) fn is_reference_package(source: &str) -> bool {
    matches!(source, "@reference-ui/react" | "@reference-ui/styled")
}

fn live_css_name(
    bindings: &ExtractBindings,
    name: &str,
    shadowed: &[FxHashSet<String>],
) -> Option<String> {
    if name == "__reference_ui_css" {
        return Some(name.to_string());
    }
    if is_shadowed(shadowed, name) {
        return None;
    }
    if bindings.css.contains(name) {
        return Some(name.to_string());
    }
    None
}

fn live_recipe_name(
    bindings: &ExtractBindings,
    name: &str,
    shadowed: &[FxHashSet<String>],
) -> Option<String> {
    if name == "__reference_ui_recipe" {
        return Some(name.to_string());
    }
    if is_shadowed(shadowed, name) {
        return None;
    }
    if bindings.recipe.contains(name) {
        return Some(name.to_string());
    }
    None
}

fn css_member_origin(
    bindings: &ExtractBindings,
    member: &StaticMemberExpression<'_>,
    shadowed: &[FxHashSet<String>],
) -> Option<String> {
    let object_name = identifier_name(&member.object)?;
    if is_shadowed(shadowed, object_name) {
        return None;
    }
    let prop = member.property.name.as_str();
    if prop == "object" {
        return css_object_origin(bindings, object_name);
    }
    if prop == "css" && is_live_css_namespace(bindings, object_name) {
        return Some("css".to_string());
    }
    None
}

/// True for direct Reference namespaces and wrapper namespaces carrying `css`.
fn is_live_css_namespace(bindings: &ExtractBindings, object_name: &str) -> bool {
    bindings.namespaces.contains(object_name) || bindings.reexport_css_ns.contains(object_name)
}

fn css_object_origin(bindings: &ExtractBindings, object_name: &str) -> Option<String> {
    if object_name == "__reference_ui_css" || bindings.css.contains(object_name) {
        return Some("css.object".to_string());
    }
    None
}

fn recipe_member_origin(
    bindings: &ExtractBindings,
    member: &StaticMemberExpression<'_>,
    shadowed: &[FxHashSet<String>],
) -> Option<String> {
    let object_name = identifier_name(&member.object)?;
    if is_shadowed(shadowed, object_name) {
        return None;
    }
    let prop = member.property.name.as_str();
    if prop == "recipe" && is_live_recipe_namespace(bindings, object_name) {
        return Some("recipe".to_string());
    }
    None
}

/// True for direct Reference namespaces and wrapper namespaces carrying `recipe`.
fn is_live_recipe_namespace(bindings: &ExtractBindings, object_name: &str) -> bool {
    bindings.namespaces.contains(object_name) || bindings.reexport_recipe_ns.contains(object_name)
}

fn identifier_name<'a>(expr: &'a Expression<'_>) -> Option<&'a str> {
    if let Expression::Identifier(ident) = expr {
        return Some(ident.name.as_str());
    }
    None
}
