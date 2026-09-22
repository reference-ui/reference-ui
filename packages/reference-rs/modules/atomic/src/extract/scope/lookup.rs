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

use rustc_hash::FxHashMap;

use super::binding::{Binding, BindingInit, BindingKind, ImportRef};
use super::table::{ScopeId, ScopeTable};
use crate::atom::AtomValue;
use crate::extract::constants::{
    ConstArrayElement, ConstObject, LocalConstants, MutatedBinding, ObjectProp,
};
use crate::extract::fold::fence::PureFn;
use crate::extract::resolver::{ResolvedExport, UnfoldableSpread};

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

    /// Scalar leaves for an import: the resolved target, else nothing.
    fn import_scalars(self, local: &str) -> &'a [AtomValue] {
        self.chain
            .imports
            .import_value(local)
            .map_or(&[], ResolvedExport::scalars)
    }

    /// True when a name's scalar init dropped a dynamic arm beside its
    /// leaves: locals, resolved imports, or the fallback. A mutated binding
    /// carries nothing, so it carries no residue either.
    pub fn scalar_residue(self, name: &str) -> bool {
        // isSelected ? a : b  after  const isSelected = c ? dyn : false
        if self.mutated(name) {
            return false;
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => local_scalar_residue(binding),
            Lookup::Import(imp) => self.import_scalar_residue(&imp.local),
            Lookup::Unbound => self.chain.imports.scalar_residue(name),
        }
    }

    /// True when an import's resolved scalar dropped a dynamic arm.
    fn import_scalar_residue(self, local: &str) -> bool {
        self.chain
            .imports
            .import_value(local)
            .is_some_and(ResolvedExport::scalar_residue)
    }

    /// The first static leaf for single-valued positions.
    pub fn scalar(self, name: &str) -> Option<&'a AtomValue> {
        self.scalar_leaves(name).first()
    }

    /// The lowered pure-helper descriptor for a name: the same-file binding,
    /// else the walked import origin's descriptor (SPEC-V2-57). Imports
    /// answer only their target's descriptor — aliases and re-export chains
    /// fold through the walk — while unbound names refuse with no fallback,
    /// so a bare call with no import warns instead of folding another file's
    /// helper. A mutated callee refuses like any mutated use.
    pub fn pure_fn(self, name: &str) -> Option<&'a PureFn> {
        // color={tone('600')}  after  import { tone } from './helpers'
        if self.mutated(name) {
            return None;
        }
        match self.chain.resolve(name, self.scope) {
            Lookup::Local(binding) => Self::local_pure_fn(binding),
            Lookup::Import(imp) => self.import_pure_fn(&imp.local),
            Lookup::Unbound => None,
        }
    }

    /// A descriptor for an import: the walked origin's export, if it lowered.
    fn import_pure_fn(self, local: &str) -> Option<&'a PureFn> {
        self.chain.imports.import_value(local)?.pure_fn()
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

    /// One member entry for an import: the resolved target, else nothing.
    fn import_object_prop(self, local: &str, prop: &str) -> Option<&'a ObjectProp> {
        self.chain
            .imports
            .import_value(local)
            .and_then(|value| value.object_prop(prop))
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

    /// A style object for an import: the resolved target, else nothing.
    fn import_object(self, local: &str) -> Option<&'a ConstObject> {
        self.chain
            .imports
            .import_value(local)
            .and_then(ResolvedExport::object)
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

    /// Array elements for an import: the resolved target, else nothing.
    fn import_array(self, local: &str) -> Option<&'a [ConstArrayElement]> {
        self.chain
            .imports
            .import_value(local)
            .and_then(ResolvedExport::array)
    }

    /// The import binding for a name, when the chain resolves it to an import.
    pub fn import_ref(self, name: &str) -> Option<&'a ImportRef> {
        match self.chain.resolve(name, self.scope) {
            Lookup::Import(imp) => Some(imp),
            Lookup::Local(_) | Lookup::Unbound => None,
        }
    }

    /// The write that poisoned a binding, for the mutated-use diagnostic.
    /// Imports answer their origin file's write only, so a same-named
    /// write in another file never poisons them; locals and unbound names
    /// keep the name-wide write set.
    pub fn mutation(self, name: &str) -> Option<&'a MutatedBinding> {
        let Lookup::Import(imp) = self.chain.resolve(name, self.scope) else {
            return self.chain.imports.mutation(name);
        };
        self.chain.imports.import_value(&imp.local)?.mutation()
    }

    /// Nested spreads the imported object could not unfold, for the use-site
    /// floor. Only a name that resolves to an import carries markers; locals
    /// and unbound names diagnose their own spreads at their own sites.
    pub fn import_unfoldable(self, name: &str) -> &'a [UnfoldableSpread] {
        let Lookup::Import(imp) = self.chain.resolve(name, self.scope) else {
            return &[];
        };
        self.chain
            .imports
            .import_value(&imp.local)
            .map_or(&[], ResolvedExport::unfoldable)
    }

    /// True when a write poisoned this name: the origin file's for imports,
    /// anywhere in the project for locals and unbound names.
    fn mutated(self, name: &str) -> bool {
        self.mutation(name).is_some()
    }
}
