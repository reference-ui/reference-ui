//! Identifier resolution through the scope chain, then the import lookup.
//! A name resolves to the innermost binding in scope: a const with a static
//! init yields its leaves, while a param, function, or dynamic declarator
//! yields nothing and shadows everything outside it. Imported names resolve
//! through the module graph to the declared export in THAT file and read its
//! origin values only — never the name-wide bag, whose write set stays for
//! unbound names alone. Mutation poison for imports is the origin file's
//! write, so a same-named write in another file never blocks an import that
//! resolves to an unmutated export. Helpers never fall back: an import
//! answers only its walked origin's descriptor, and an unbound callee
//! refuses, so bindings — never the name bag — decide which helper folds.
//! Unknown scope ids resolve as unbound.

mod scoped;

use rustc_hash::FxHashMap;

use super::binding::{Binding, BindingInit, BindingKind, ImportRef};
use super::table::{ScopeId, ScopeTable};
use crate::atom::AtomValue;
use crate::extract::constants::{
    ConstArrayElement, ConstObject, LocalConstants, MutatedBinding, ObjectProp,
};
use crate::extract::resolver::ResolvedExport;

/// Where a name resolved: a local binding, an import, or nowhere in scope.
#[derive(Debug, Clone, Copy)]
pub enum Lookup<'a> {
    /// A declarator, param, function, or enum binding in the chain.
    Local(&'a Binding),
    /// An imported name, answered by the import lookup.
    Import(&'a ImportRef),
    /// No binding in scope — answered by the import lookup fallback.
    Unbound,
}

/// Answers names the file does not bind: the import lookup seam.
/// The resolver map holds imports by local name; the bag stays as the
/// fallback for unbound names only — imports never consult it. An enum, not
/// a trait object, so the chain stays covariant and walkers shrink its
/// lifetime.
#[derive(Debug, Clone, Copy)]
pub enum ImportLookup<'a> {
    /// The project name bag alone (bare extracts and unit tests).
    ProjectBag(&'a LocalConstants),
    /// Resolved imports by local name plus the unbound-name fallback.
    Binding {
        /// Resolved imports of this file, keyed by local name.
        values: &'a FxHashMap<String, ResolvedExport>,
        /// Merge-era fallback for unbound names only, never imports.
        fallback: &'a LocalConstants,
    },
}

impl<'a> ImportLookup<'a> {
    /// Scalar leaves for a name outside local scope.
    fn scalar_leaves(self, name: &str) -> &'a [AtomValue] {
        self.bag().scalar_leaves(name)
    }

    /// True when the fallback's scalar init dropped a dynamic arm.
    fn scalar_residue(self, name: &str) -> bool {
        self.bag().scalar_residue(name)
    }

    /// A member of an object outside local scope.
    fn object_prop(self, obj: &str, prop: &str) -> Option<&'a ObjectProp> {
        self.bag().get_object_prop(obj, prop)
    }

    /// A style object outside local scope.
    fn object(self, name: &str) -> Option<&'a ConstObject> {
        self.bag().get_object(name)
    }

    /// A const array outside local scope.
    fn array(self, name: &str) -> Option<&'a [ConstArrayElement]> {
        self.bag().get_array(name)
    }

    /// The write that poisoned a binding, if any (SPEC-V2-35).
    fn mutation(self, name: &str) -> Option<&'a MutatedBinding> {
        self.bag().mutation(name)
    }

    /// The resolved import value for a local name, when the map holds it.
    fn import_value(self, local: &str) -> Option<&'a ResolvedExport> {
        match self {
            Self::ProjectBag(_) => None,
            Self::Binding { values, .. } => values.get(local),
        }
    }

    /// The backing project bag.
    fn bag(self) -> &'a LocalConstants {
        match self {
            Self::ProjectBag(bag) | Self::Binding { fallback: bag, .. } => bag,
        }
    }
}

/// A scope table plus its import lookup: everything resolution needs.
#[derive(Debug, Clone, Copy)]
pub struct ScopeChain<'a> {
    table: &'a ScopeTable,
    imports: ImportLookup<'a>,
}

impl<'a> ScopeChain<'a> {
    /// A chain over one file's table, falling back to the import lookup.
    pub fn new(table: &'a ScopeTable, imports: ImportLookup<'a>) -> Self {
        Self { table, imports }
    }

    /// Resolve a name from a use-site scope outward to the program root.
    pub fn resolve(self, name: &str, at: ScopeId) -> Lookup<'a> {
        let mut cursor = Some(at);
        while let Some(id) = cursor {
            if let Some(binding) = self.table.lookup_in(id, name) {
                return classify(binding);
            }
            cursor = self.table.parent_of(id);
        }
        Lookup::Unbound
    }

    /// Fix a use-site scope, for the walkers that resolve many names there.
    pub fn at(self, scope: ScopeId) -> Scoped<'a> {
        Scoped { chain: self, scope }
    }

    /// Innermost ident alias edge (`const X = Y`) visible from a scope.
    /// Host re-admission follows this; values never do.
    pub fn alias_edge(self, name: &str, at: ScopeId) -> Option<(ScopeId, String)> {
        self.table.alias_edge(name, at)
    }
}

/// Classify a found binding as local or imported.
fn classify(binding: &Binding) -> Lookup<'_> {
    if let BindingKind::Import(imp) = &binding.kind {
        Lookup::Import(imp)
    } else {
        Lookup::Local(binding)
    }
}

/// The scalar leaves a local binding carries, if it carries any.
fn local_scalars(binding: &Binding) -> &[AtomValue] {
    match &binding.init {
        Some(BindingInit::Scalars { leaves, .. }) => leaves,
        _ => &[],
    }
}

/// True when a local scalar binding dropped a dynamic arm beside its leaves.
fn local_scalar_residue(binding: &Binding) -> bool {
    matches!(
        &binding.init,
        Some(BindingInit::Scalars { residue: true, .. })
    )
}

/// The style object a local binding carries, if it carries one.
fn local_object(binding: &Binding) -> Option<&ConstObject> {
    match &binding.init {
        Some(BindingInit::Object(map)) => Some(map),
        _ => None,
    }
}

/// The recorded entry for one member of a local object, if it carries one.
fn local_object_prop<'a>(binding: &'a Binding, prop: &str) -> Option<&'a ObjectProp> {
    local_object(binding).and_then(|map| map.get(prop))
}

/// The const array a local binding carries, if it carries one.
fn local_array(binding: &Binding) -> Option<&[ConstArrayElement]> {
    match &binding.init {
        Some(BindingInit::Array(elements)) => Some(elements),
        _ => None,
    }
}

/// A chain fixed at one use-site scope: the walker-facing lookup handle.
#[derive(Debug, Clone, Copy)]
pub struct Scoped<'a> {
    chain: ScopeChain<'a>,
    scope: ScopeId,
}
