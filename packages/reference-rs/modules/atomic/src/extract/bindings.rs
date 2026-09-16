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

use std::collections::HashSet;

use oxc_ast::ast::{
    Expression, ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    ModuleExportName, Program, Statement, StaticMemberExpression,
};

/// Local names bound to Reference `css`, `recipe`, JSX hosts, and namespaces.
#[derive(Debug, Default, Clone)]
pub struct ExtractBindings {
    css: HashSet<String>,
    recipe: HashSet<String>,
    jsx: HashSet<String>,
    namespaces: HashSet<String>,
}

impl ExtractBindings {
    /// Component names imported from Reference packages.
    pub fn jsx_hosts(&self) -> HashSet<String> {
        self.jsx.clone()
    }

    /// Origin string when `callee` is a live Reference `css` binding.
    pub fn css_origin(
        &self,
        callee: &Expression<'_>,
        shadowed: &[HashSet<String>],
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
        shadowed: &[HashSet<String>],
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

pub(crate) fn is_shadowed(shadowed: &[HashSet<String>], name: &str) -> bool {
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

fn imported_name(name: &ModuleExportName<'_>) -> String {
    match name {
        ModuleExportName::IdentifierName(id) => id.name.to_string(),
        ModuleExportName::IdentifierReference(id) => id.name.to_string(),
        ModuleExportName::StringLiteral(lit) => lit.value.to_string(),
    }
}

fn is_reference_package(source: &str) -> bool {
    matches!(source, "@reference-ui/react" | "@reference-ui/styled")
}

fn live_css_name(
    bindings: &ExtractBindings,
    name: &str,
    shadowed: &[HashSet<String>],
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
    shadowed: &[HashSet<String>],
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
    shadowed: &[HashSet<String>],
) -> Option<String> {
    let object_name = identifier_name(&member.object)?;
    if is_shadowed(shadowed, object_name) {
        return None;
    }
    let prop = member.property.name.as_str();
    if prop == "object" {
        return css_object_origin(bindings, object_name);
    }
    if prop == "css" && bindings.namespaces.contains(object_name) {
        return Some("css".to_string());
    }
    None
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
    shadowed: &[HashSet<String>],
) -> Option<String> {
    let object_name = identifier_name(&member.object)?;
    if is_shadowed(shadowed, object_name) {
        return None;
    }
    let prop = member.property.name.as_str();
    if prop == "recipe" && bindings.namespaces.contains(object_name) {
        return Some("recipe".to_string());
    }
    None
}

fn identifier_name<'a>(expr: &'a Expression<'_>) -> Option<&'a str> {
    if let Expression::Identifier(ident) = expr {
        return Some(ident.name.as_str());
    }
    None
}
