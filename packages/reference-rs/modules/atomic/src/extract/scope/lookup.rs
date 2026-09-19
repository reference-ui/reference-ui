//! Identifier resolution through the scope chain, then the import lookup.
//! A name resolves to the innermost binding in scope: a const with a static
//! init yields its leaves, while a param, function, or dynamic declarator
//! yields nothing and shadows everything outside it. Imported and unbound
//! names fall through to the import lookup, whose Ph1 stub answers from the
//! merged project bag — the merge-era observable, preserved behind the seam
//! the Ph4 resolver (SPEC-V2-76) will fill. Unknown scope ids resolve as
//! unbound, so a miscounted scope degrades to today's behavior, never a ghost.

use std::collections::BTreeMap;

use super::binding::{Binding, BindingInit, BindingKind, ImportRef};
use super::table::{ScopeId, ScopeTable};
use crate::atom::AtomValue;
use crate::extract::constants::{LocalConstants, MutatedBinding};

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
/// Ph1 carries only the merge-era project bag; SPEC-V2-76 extends this
/// with the binding-aware resolver. An enum, not a trait object, so the
/// chain stays covariant and the walkers can shrink its lifetime.
#[derive(Debug, Clone, Copy)]
pub enum ImportLookup<'a> {
    /// The retired project name bag, consulted by local name. Unbound and
    /// imported names resolve exactly as the merge era resolved them.
    ProjectBag(&'a LocalConstants),
}

impl<'a> ImportLookup<'a> {
    /// Scalar leaves for a name outside local scope.
    fn scalar_leaves(self, name: &str) -> &'a [AtomValue] {
        self.bag().scalar_leaves(name)
    }

    /// A member of an object outside local scope.
    fn object_prop(self, obj: &str, prop: &str) -> Option<&'a AtomValue> {
        self.bag().get_object_prop(obj, prop)
    }

    /// A style object outside local scope.
    fn object(self, name: &str) -> Option<&'a BTreeMap<String, AtomValue>> {
        self.bag().get_object(name)
    }

    /// The write that poisoned a binding, if any (SPEC-V2-35).
    fn mutation(self, name: &str) -> Option<&'a MutatedBinding> {
        self.bag().mutation(name)
    }

    /// The backing project bag.
    fn bag(self) -> &'a LocalConstants {
        let Self::ProjectBag(bag) = self;
        bag
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
        Scoped {
            chain: self,
            scope,
        }
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
        Some(BindingInit::Scalars(leaves)) => leaves,
        _ => &[],
    }
}

/// The style object a local binding carries, if it carries one.
fn local_object(binding: &Binding) -> Option<&BTreeMap<String, AtomValue>> {
    match &binding.init {
        Some(BindingInit::Object(map)) => Some(map),
        _ => None,
    }
}

/// A chain fixed at one use-site scope: the walker-facing lookup handle.
#[derive(Debug, Clone, Copy)]
pub struct Scoped<'a> {
    chain: ScopeChain<'a>,
    scope: ScopeId,
}

impl<'a> Scoped<'a> {
    /// Every static leaf for a name: local leaves, or the import fallback.
    /// A mutated binding yields nothing anywhere — the walker names the write.
    pub fn scalar_leaves(self, name: &str) -> &'a [AtomValue] {
        // mt={space}  after  const space = '2r'
        if self.mutated(name) {
            return &[];
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => local_scalars(binding),
            Lookup::Import(imp) => self.chain.imports.scalar_leaves(&imp.local),
            Lookup::Unbound => self.chain.imports.scalar_leaves(name),
        }
    }

    /// The first static leaf for single-valued positions.
    pub fn scalar(self, name: &str) -> Option<&'a AtomValue> {
        self.scalar_leaves(name).first()
    }

    /// A member of a bound object, or the import fallback.
    pub fn object_prop(self, obj: &str, prop: &str) -> Option<&'a AtomValue> {
        // color={theme.primary}  after  const theme = { primary: 'n300' }
        if self.mutated(obj) {
            return None;
        }
        match self.chain.resolve(obj, self.scope) {
            Lookup::Local(binding) => local_object(binding).and_then(|map| map.get(prop)),
            Lookup::Import(imp) => self.chain.imports.object_prop(&imp.local, prop),
            Lookup::Unbound => self.chain.imports.object_prop(obj, prop),
        }
    }

    /// A bound style object, or the import fallback.
    pub fn object(self, name: &str) -> Option<&'a BTreeMap<String, AtomValue>> {
        // css({ ...base })  after  const base = { mt: '2r' }
        if self.mutated(name) {
            return None;
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => local_object(binding),
            Lookup::Import(imp) => self.chain.imports.object(&imp.local),
            Lookup::Unbound => self.chain.imports.object(name),
        }
    }

    /// The write that poisoned a binding, for the mutated-use diagnostic.
    pub fn mutation(self, name: &str) -> Option<&'a MutatedBinding> {
        self.chain.imports.mutation(name)
    }

    /// True when a write anywhere in the project poisoned this name.
    fn mutated(self, name: &str) -> bool {
        self.mutation(name).is_some()
    }
}
