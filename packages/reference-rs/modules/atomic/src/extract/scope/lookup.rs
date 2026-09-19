//! Identifier resolution through the scope chain, then the import lookup.
//! A name resolves to the innermost binding in scope: a const with a static
//! init yields its leaves, while a param, function, or dynamic declarator
//! yields nothing and shadows everything outside it. Imported names resolve
//! through the binding walk to the declared export in THAT file and read its
//! origin bag; unresolvable shapes fall back to the merge bag, as do unbound
//! names, preserving the merge-era observable. Unknown scope ids resolve as
//! unbound, so a miscounted scope degrades to today's behavior, never a ghost.

use std::collections::HashMap;

use super::binding::{Binding, BindingInit, BindingKind, ImportRef};
use super::table::{ScopeId, ScopeTable};
use crate::atom::AtomValue;
use crate::extract::constants::{
    ConstArrayElement, ConstObject, LocalConstants, MutatedBinding, ObjectProp,
};
use crate::extract::fold::fence::PureFn;
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
/// fallback for unhandled shapes and unbound names. An enum, not a trait
/// object, so the chain stays covariant and walkers shrink its lifetime.
#[derive(Debug, Clone, Copy)]
pub enum ImportLookup<'a> {
    /// The project name bag alone (bare extracts and unit tests).
    ProjectBag(&'a LocalConstants),
    /// Resolved imports by local name plus the bag fallback (compiles).
    Binding {
        /// Resolved imports of this file, keyed by local name.
        values: &'a HashMap<String, ResolvedExport>,
        /// Merge-era fallback for unhandled shapes and unbound names.
        fallback: &'a LocalConstants,
    },
}

impl<'a> ImportLookup<'a> {
    /// Scalar leaves for a name outside local scope.
    fn scalar_leaves(self, name: &str) -> &'a [AtomValue] {
        self.bag().scalar_leaves(name)
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

    /// An exported pure-helper descriptor outside local scope (SPEC-V2-57).
    fn pure_fn(self, name: &str) -> Option<&'a PureFn> {
        self.bag().get_pure_fn(name)
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

impl<'a> Scoped<'a> {
    /// Every static leaf for a name: locals, resolved imports, or the fallback.
    /// A mutated binding yields nothing anywhere — the walker names the write.
    /// A resolved import answers only its target's value, never the bag union.
    pub fn scalar_leaves(self, name: &str) -> &'a [AtomValue] {
        // mt={space}  after  const space = '2r'
        if self.mutated(name) {
            return &[];
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => local_scalars(binding),
            Lookup::Import(imp) => self.import_scalars(&imp.local),
            Lookup::Unbound => self.chain.imports.scalar_leaves(name),
        }
    }

    /// Scalar leaves for an import: the resolved target, else the bag union.
    fn import_scalars(self, local: &str) -> &'a [AtomValue] {
        if let Some(value) = self.chain.imports.import_value(local) {
            return value.scalars();
        }
        self.chain.imports.scalar_leaves(local)
    }

    /// The first static leaf for single-valued positions.
    pub fn scalar(self, name: &str) -> Option<&'a AtomValue> {
        self.scalar_leaves(name).first()
    }

    /// The lowered pure-helper descriptor for a name: the same-file
    /// binding, else the merge-era descriptor export by local name
    /// (SPEC-V2-57). A mutated callee refuses like any mutated use; the
    /// Ph4 resolver (SPEC-V2-76) will answer imports by binding instead.
    pub fn pure_fn(self, name: &str) -> Option<&'a PureFn> {
        // color={tone('600')}  after  const tone = (shade) => `red.${shade}`
        if self.mutated(name) {
            return None;
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => Self::local_pure_fn(binding),
            found => self.fallback_pure_fn(name, found),
        }
    }

    /// A descriptor outside local scope: imports answer by local name,
    /// unbound names by name, both from the descriptor export.
    fn fallback_pure_fn(self, name: &str, found: Lookup<'_>) -> Option<&'a PureFn> {
        match found {
            Lookup::Import(imp) => self.chain.imports.pure_fn(&imp.local),
            Lookup::Unbound => self.chain.imports.pure_fn(name),
            Lookup::Local(_) => None,
        }
    }

    /// Every static leaf of a bound object's member, or the import fallback.
    /// A mutated base yields nothing anywhere — the walker names the write.
    pub fn object_prop_leaves(self, obj: &str, prop: &str) -> &'a [AtomValue] {
        // color={theme.primary}  after  const theme = { primary: 'n300' }
        self.object_prop_entry(obj, prop)
            .map_or(&[], |entry| entry.leaves.as_slice())
    }

    /// A bound object's nested entries one hop down, or the import fallback.
    /// Scalar and dynamic members carry no object, so member args over them
    /// refuse; multi-hop paths stay unresolved for SPEC-V2-31.
    pub fn member_object(self, obj: &str, prop: &str) -> Option<&'a ConstObject> {
        // css(theme.colors)  after  const theme = { colors: { primary: 'blue' } }
        let entry = self.object_prop_entry(obj, prop)?;
        if entry.nested.is_empty() {
            return None;
        }
        Some(&entry.nested)
    }

    /// A same-file binding's descriptor, when it lowered as a pure helper.
    fn local_pure_fn(binding: &Binding) -> Option<&PureFn> {
        match &binding.init {
            Some(BindingInit::PureFn(func)) => Some(func),
            _ => None,
        }
    }

    /// True when a bound object's member kept leaves beside a dropped
    /// dynamic arm (Ph4 residue channel), through locals or the fallback.
    pub fn object_prop_residue(self, obj: &str, prop: &str) -> bool {
        // color={part.color}  after  const part = { color: flag ? 'white' : run() }
        self.object_prop_entry(obj, prop)
            .is_some_and(|entry| entry.residue && !entry.leaves.is_empty())
    }

    /// The recorded entry for one member, through locals or the fallback.
    /// A resolved import answers only its target's object, never the bag's.
    fn object_prop_entry(self, obj: &str, prop: &str) -> Option<&'a ObjectProp> {
        if self.mutated(obj) {
            return None;
        }
        match self.chain.resolve(obj, self.scope) {
            Lookup::Local(binding) => local_object_prop(binding, prop),
            Lookup::Import(imp) => self.import_object_prop(&imp.local, prop),
            Lookup::Unbound => self.chain.imports.object_prop(obj, prop),
        }
    }

    /// One member entry for an import: the resolved target, else the bag.
    fn import_object_prop(self, local: &str, prop: &str) -> Option<&'a ObjectProp> {
        match self.chain.imports.import_value(local) {
            Some(value) => value.object_prop(prop),
            None => self.chain.imports.object_prop(local, prop),
        }
    }

    /// A bound style object, resolved imports first, then the fallback.
    pub fn object(self, name: &str) -> Option<&'a ConstObject> {
        // css({ ...base })  after  const base = { mt: '2r' }
        if self.mutated(name) {
            return None;
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => local_object(binding),
            Lookup::Import(imp) => self.import_object(&imp.local),
            Lookup::Unbound => self.chain.imports.object(name),
        }
    }

    /// A style object for an import: the resolved target, else the bag.
    fn import_object(self, local: &str) -> Option<&'a ConstObject> {
        match self.chain.imports.import_value(local) {
            Some(value) => value.object(),
            None => self.chain.imports.object(local),
        }
    }

    /// A bound const array's elements, resolved imports first, then fallback.
    pub fn array(self, name: &str) -> Option<&'a [ConstArrayElement]> {
        // margin: sizes[1]  after  const sizes = ['2px', '4px']
        if self.mutated(name) {
            return None;
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => local_array(binding),
            Lookup::Import(imp) => self.import_array(&imp.local),
            Lookup::Unbound => self.chain.imports.array(name),
        }
    }

    /// Array elements for an import: the resolved target, else the bag.
    fn import_array(self, local: &str) -> Option<&'a [ConstArrayElement]> {
        match self.chain.imports.import_value(local) {
            Some(value) => value.array(),
            None => self.chain.imports.array(local),
        }
    }

    /// The import binding for a name, when the chain resolves it to an import.
    pub fn import_ref(self, name: &str) -> Option<&'a ImportRef> {
        match self.chain.resolve(name, self.scope) {
            Lookup::Import(imp) => Some(imp),
            Lookup::Local(_) | Lookup::Unbound => None,
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
