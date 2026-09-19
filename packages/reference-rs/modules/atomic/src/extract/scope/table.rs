//! The scope table: every scope in one file and the bindings each declares.
//! Scopes form a parent chain from the program root; each scope maps the
//! names declared directly in it to their bindings. Lookup walks outward
//! from the use site, so the innermost declarator always wins and sibling
//! scopes never see each other. One file owns one table; cross-file values
//! arrive only through the import lookup, never through this map.

use std::collections::BTreeMap;

use oxc_span::Span;

use super::binding::{Binding, BindingId, BindingInit, BindingKind};
use crate::extract::fold::fence::PureFn;

/// Index of a scope in the table. The program scope is always 0: both the
/// collector and the extract visitor allocate one id per `enter_scope` in
/// walk order, so ids line up without sharing oxc internals.
pub type ScopeId = u32;

/// The program scope, allocated by the first `enter_scope` of a visit.
pub const ROOT_SCOPE: ScopeId = 0;

/// One lexical scope: its parent and the names declared directly in it.
#[derive(Debug, Default)]
pub struct Scope {
    parent: Option<ScopeId>,
    names: BTreeMap<String, BindingId>,
}

/// Every scope and binding declared in a single file.
#[derive(Debug, Default)]
pub struct ScopeTable {
    scopes: Vec<Scope>,
    bindings: Vec<Binding>,
}

impl ScopeTable {
    /// An empty table; the first allocated scope is the program root.
    pub fn new() -> Self {
        Self::default()
    }

    /// Allocate a scope whose parent is the enclosing scope, if any.
    pub fn alloc_scope(&mut self, parent: Option<ScopeId>) -> ScopeId {
        let id = self.scopes.len() as ScopeId;
        self.scopes.push(Scope {
            parent,
            names: BTreeMap::new(),
        });
        id
    }

    /// Declare a name in a scope. A repeated name in one scope overwrites,
    /// matching runtime last-wins; an unknown scope id keeps the binding
    /// unreachable rather than panicking.
    pub fn declare(&mut self, scope: ScopeId, name: &str, binding: Binding) -> BindingId {
        // var x = 1; var x = 2  — the second declaration wins
        debug_assert!(
            (scope as usize) < self.scopes.len(),
            "scope id out of table"
        );
        let id = self.bindings.len() as BindingId;
        self.bindings.push(binding);
        if let Some(entry) = self.scopes.get_mut(scope as usize) {
            entry.names.insert(name.to_string(), id);
        }
        id
    }

    /// Look up a name declared directly in one scope, without walking out.
    pub fn lookup_in(&self, scope: ScopeId, name: &str) -> Option<&Binding> {
        let entry = self.scopes.get(scope as usize)?;
        let id = entry.names.get(name)?;
        self.bindings.get(*id as usize)
    }

    /// Resolve a name from a scope outward, returning the declaring scope.
    /// Collect-time counterpart of the chain lookup: destructure and object
    /// sources read already-declared bindings through this.
    pub fn resolve_from(&self, name: &str, scope: ScopeId) -> Option<(ScopeId, &Binding)> {
        let mut cursor = Some(scope);
        while let Some(id) = cursor {
            if let Some(binding) = self.lookup_in(id, name) {
                return Some((id, binding));
            }
            cursor = self.parent_of(id);
        }
        None
    }

    /// Attach a lowered pure-helper descriptor to a valueless binding.
    /// The binding must be a declarator or function with the expected
    /// declaring span; anything else fails closed with `false`, so a
    /// misaligned scope id can never plant a descriptor on the wrong name.
    pub fn attach_pure_fn(
        &mut self,
        scope: ScopeId,
        name: &str,
        span: Span,
        pure_fn: PureFn,
    ) -> bool {
        let Some(binding) = self.binding_mut(scope, name) else {
            return false;
        };
        let callable = matches!(
            binding.kind,
            BindingKind::Const | BindingKind::Let | BindingKind::Var | BindingKind::Function
        );
        if !callable || binding.span != span || binding.init.is_some() {
            return false;
        }
        binding.init = Some(BindingInit::PureFn(pure_fn));
        true
    }

    /// Every attached pure-helper descriptor at the program root, in name
    /// order. Exports are top-level, so the binding walk (SPEC-V2-57) reads
    /// only these; nested helpers stay same-file. Order is deterministic.
    pub fn root_pure_fns(&self) -> Vec<(String, PureFn)> {
        let mut out = Vec::new();
        let Some(root) = self.scopes.first() else {
            return out;
        };
        for (name, id) in root.names.iter() {
            if let Some(BindingInit::PureFn(func)) =
                self.bindings.get(*id as usize).and_then(|b| b.init.as_ref())
            {
                out.push((name.clone(), func.clone()));
            }
        }
        out
    }

    /// Every carried value at the program root, in name order: scalars,
    /// style objects, and const arrays with identifier values, alias chains,
    /// and static spreads already resolved (SPEC-V2-34 cross-file). Pure
    /// helpers ride `root_pure_fns`, not this map.
    pub fn root_values(&self) -> Vec<(String, BindingInit)> {
        let mut out = Vec::new();
        let Some(root) = self.scopes.first() else {
            return out;
        };
        for (name, id) in root.names.iter() {
            if let Some(init) = self.bindings.get(*id as usize).and_then(|b| b.init.as_ref()) {
                if !matches!(init, BindingInit::PureFn(_)) {
                    out.push((name.clone(), init.clone()));
                }
            }
        }
        out
    }

    /// Clear a binding's carried value (it shadows from here on).
    pub fn clear_init(&mut self, scope: ScopeId, name: &str) {
        if let Some(binding) = self.binding_mut(scope, name) {
            binding.init = None;
        }
    }

    /// Remove one entry of a bound const object, if it carries one.
    pub fn remove_object_key(&mut self, scope: ScopeId, name: &str, key: &str) {
        if let Some(binding) = self.binding_mut(scope, name) {
            if let Some(BindingInit::Object(map)) = binding.init.as_mut() {
                map.remove(key);
            }
        }
    }

    /// Mutable access to a name declared directly in one scope.
    fn binding_mut(&mut self, scope: ScopeId, name: &str) -> Option<&mut Binding> {
        let entry = self.scopes.get(scope as usize)?;
        let id = *entry.names.get(name)?;
        self.bindings.get_mut(id as usize)
    }

    /// The enclosing scope, or None at the root and for unknown ids.
    pub fn parent_of(&self, scope: ScopeId) -> Option<ScopeId> {
        self.scopes
            .get(scope as usize)
            .and_then(|entry| entry.parent)
    }

    /// Every import binding in the file, for the resolver's upfront pass.
    pub fn import_refs(&self) -> Vec<super::binding::ImportRef> {
        self.bindings
            .iter()
            .filter_map(|binding| match &binding.kind {
                BindingKind::Import(imp) => Some(imp.clone()),
                _ => None,
            })
            .collect()
    }
}
