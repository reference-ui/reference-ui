//! The scope table: every scope in one file and the bindings each declares.
//! Scopes form a parent chain from the program root; each scope maps the
//! names declared directly in it to their bindings. Lookup walks outward
//! from the use site, so the innermost declarator always wins and sibling
//! scopes never see each other. One file owns one table; cross-file values
//! arrive only through the import lookup, never through this map.

use std::collections::BTreeMap;

use super::binding::{Binding, BindingId};

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

    /// The enclosing scope, or None at the root and for unknown ids.
    pub fn parent_of(&self, scope: ScopeId) -> Option<ScopeId> {
        self.scopes
            .get(scope as usize)
            .and_then(|entry| entry.parent)
    }
}
