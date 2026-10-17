//! The walker-facing lookup handle: `Scoped` answers each identifier question at one fixed use-site
//! scope. Accessors cover static leaves, pure-helper descriptors, style objects and arrays, import
//! bindings, mutation poison, and unfoldable import spreads. Locals resolve first and imports
//! through the module graph, so every method agrees with the chain rules in the parent module.
//! Takes a name and emits borrowed values or facts from the chain; nothing here allocates a new
//! scope.

use super::super::binding::{Binding, BindingInit, ImportRef};
use super::{
    local_array, local_object, local_object_prop, local_scalar_residue, local_scalars, Lookup,
    Scoped,
};
use crate::atom::AtomValue;
use crate::extract::constants::{ConstArrayElement, ConstObject, MutatedBinding, ObjectProp};
use crate::extract::fold::fence::PureFn;
use crate::extract::resolver::{ResolvedExport, UnfoldableSpread};

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
