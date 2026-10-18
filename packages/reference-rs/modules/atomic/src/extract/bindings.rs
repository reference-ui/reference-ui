//! File-local import bindings for extract-site gating.
//!
//! Records which local names were imported from `@reference-ui/react` or
//! `@reference-ui/styled`. `css()` / `recipe()` extract only when the callee is
//! one of those bindings and is not shadowed. The compiler-internal
//! `__reference_ui_css` / `__reference_ui_recipe` aliases are reserved: the
//! virtual neutralize pass declares them as top-level `const` bindings, so
//! they extract even though the declaration would otherwise read as a shadow.
//! JSX hosts are the component names from the same packages; unknown `css`
//! is not an extract site. Every value import also records its provenance
//! (`provenance`), so a package-bound tag is never an own host.

use oxc_ast::ast::{Expression, ModuleExportName, Program, StaticMemberExpression};
use rustc_hash::{FxHashMap, FxHashSet};

use super::provenance::{TagProvenance, UNBOUND};

// A child module kept beside this file: `bindings/` is gitignored for ts-rs output.
#[path = "binding_imports.rs"]
mod collect;

/// Local names bound to Reference `css`, `recipe`, JSX hosts, and namespaces,
/// plus the provenance of every value import local.
#[derive(Debug, Default, Clone)]
pub struct ExtractBindings {
    css: FxHashSet<String>,
    recipe: FxHashSet<String>,
    jsx: FxHashSet<String>,
    namespaces: FxHashSet<String>,
    reexport_css_ns: FxHashSet<String>,
    reexport_recipe_ns: FxHashSet<String>,
    provenance: FxHashMap<String, TagProvenance>,
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
    /// Borrow the component names imported from Reference packages. The
    /// extract context unions this with the compile-global hosts by
    /// reference, so per-file setup never clones either set.
    pub fn jsx_hosts_ref(&self) -> &FxHashSet<String> {
        &self.jsx
    }

    /// The provenance of an import local; `Unbound` when no import binds it.
    pub fn provenance(&self, local: &str) -> &TagProvenance {
        self.provenance.get(local).unwrap_or(&UNBOUND)
    }

    /// True when `local` is a value import that ends at an installed package.
    pub fn binds_package(&self, local: &str) -> bool {
        matches!(self.provenance.get(local), Some(TagProvenance::Package(_)))
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

/// Collect import bindings from a parsed program, with no project graph:
/// non-Reference imports classify by their specifier's spelling alone.
pub fn collect_bindings(program: &Program<'_>) -> ExtractBindings {
    collect::collect(program, None)
}

/// Collect bindings with project identity: direct Reference imports plus
/// names that trace to a Reference export through consumer re-exports, and
/// every other import's provenance through the same project walk.
pub fn collect_bindings_with_identity(
    program: &Program<'_>,
    file: &str,
    graph: &super::identity::IdentityGraph<'_>,
) -> ExtractBindings {
    collect::collect(program, Some(&IdentityCtx { file, graph }))
}

pub(crate) fn is_shadowed(shadowed: &[FxHashSet<String>], name: &str) -> bool {
    shadowed.iter().any(|scope| scope.contains(name))
}

/// True when a scope deeper than the file top rebinds the name. The top
/// scope holds a wrapper's own definition, so only deeper scopes veto.
pub(crate) fn is_inner_shadowed(shadowed: &[FxHashSet<String>], name: &str) -> bool {
    shadowed.iter().skip(1).any(|scope| scope.contains(name))
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
