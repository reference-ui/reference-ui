//! Post-attach folding of pure-call declarator inits (`const x = getColor()`).
//! Runs after helper descriptors attach, so a `CallExpression` init whose
//! callee is a known `PureFn` folds through the existing fence and records
//! its result as `Scalars`, `Object`, or `Array` on the binding. Only clean
//! folds record — a refused arg or a baked residue fails closed to no init,
//! and the use warns exactly as before. Mutation safety rides the lookup
//! fence: mutated names resolve to nothing, so no fold can bake a stale
//! capture. The walk replays the collector's scope ids in program order, so
//! init chains fold declaration by declaration.

use std::cell::Cell;
use std::collections::BTreeMap;

use oxc_ast::ast::{BindingPattern, CallExpression, Expression, Program, VariableDeclarator};
use oxc_ast_visit::{walk, Visit};

use super::binding::BindingInit;
use super::lookup::{ImportLookup, ScopeChain, Scoped};
use super::table::{ScopeId, ScopeTable, ROOT_SCOPE};
use super::value::peel;
use crate::atom::AtomValue;
use crate::extract::constants::{ConstArrayElement, ConstObject, LocalConstants, ObjectProp};
use crate::extract::fold::{fold_pure_call, FenceValue};

/// Fold every pure-call init into its binding now that descriptors attached.
///
/// Same-file helpers resolve through the finished table; imports answer
/// nothing here (the graph lands in Slice 3), so imported-helper inits stay
/// valueless until then. Inits that already carry a value — factory and
/// `token()` calls — never reach the fill, which only plants on empty slots.
pub(crate) fn fold_call_inits(
    program: &Program<'_>,
    table: &mut ScopeTable,
    project: &LocalConstants,
) {
    let mut pass = CallInitPass {
        table,
        project,
        stack: Vec::new(),
        next: 0,
    };
    pass.visit_program(program);
}

/// Second-pass visitor folding call inits with the finished table in hand.
struct CallInitPass<'a, 'p> {
    table: &'a mut ScopeTable,
    project: &'p LocalConstants,
    stack: Vec<ScopeId>,
    next: ScopeId,
}

impl CallInitPass<'_, '_> {
    /// The innermost scope at the current visit position.
    fn current(&self) -> ScopeId {
        self.stack.last().copied().unwrap_or(ROOT_SCOPE)
    }

    /// Fold one declarator's call init into its binding, when it folds clean.
    fn fold_declarator(&mut self, decl: &VariableDeclarator<'_>) {
        let BindingPattern::BindingIdentifier(ident) = &decl.id else {
            return;
        };
        let Some(init) = decl.init.as_ref() else {
            return;
        };
        let Expression::CallExpression(call) = peel(init) else {
            return;
        };
        let name = ident.name.as_str();
        let scope = self.current();
        let folded = {
            let chain = ScopeChain::new(&*self.table, ImportLookup::ProjectBag(self.project));
            fold_call_init(call, chain.at(scope))
        };
        let Some(init) = folded else {
            return;
        };
        self.table.attach_call_init(scope, name, ident.span, init);
    }
}

impl<'a> Visit<'a> for CallInitPass<'_, '_> {
    fn enter_scope(
        &mut self,
        _flags: oxc_syntax::scope::ScopeFlags,
        _scope_id: &Cell<Option<oxc_syntax::scope::ScopeId>>,
    ) {
        let id = self.next;
        self.next += 1;
        self.stack.push(id);
    }

    fn leave_scope(&mut self) {
        self.stack.pop();
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        self.fold_declarator(decl);
        walk::walk_variable_declarator(self, decl);
    }
}

/// Fold one call init through the fence: clean folds record, the rest refuse.
///
/// Refused arguments and baked residue fail closed to no init — the use site
/// warns exactly as if the init had never folded, so one dynamic fragment
/// never silences its own diagnostic through a copy.
fn fold_call_init(call: &CallExpression<'_>, scoped: Scoped<'_>) -> Option<BindingInit> {
    let fold = fold_pure_call(call, scoped);
    if !fold.refusals.is_empty() || fold.residue.is_some() {
        return None;
    };
    fence_init(&fold.value?)
}

/// A folded fence value as a binding init: leaves, objects, and arrays
/// record; shapes the table cannot hold (arrays nested in objects, nested
/// arrays, multi-leaf slots) refuse the whole init.
fn fence_init(value: &FenceValue) -> Option<BindingInit> {
    match value {
        FenceValue::Leaves(leaves) => Some(BindingInit::Scalars(leaves.clone())),
        FenceValue::Object(entries) => Some(BindingInit::Object(fence_object(entries)?)),
        FenceValue::Array(elements) => Some(BindingInit::Array(fence_array(elements)?)),
    }
}

/// Folded object entries as a const object: leaves carry, nested objects
/// recurse, and duplicate keys keep the last — the runtime last-wins rule.
/// Array values have no const-object slot and refuse the whole init.
fn fence_object(entries: &[(Box<str>, FenceValue)]) -> Option<ConstObject> {
    let mut map = ConstObject::new();
    for (key, value) in entries {
        map.insert(key.to_string(), fence_entry(value)?);
    }
    Some(map)
}

/// One folded object entry: scalar leaves, a nested map, or a refusal.
fn fence_entry(value: &FenceValue) -> Option<ObjectProp> {
    match value {
        FenceValue::Leaves(leaves) => Some(ObjectProp {
            leaves: leaves.clone(),
            nested: ConstObject::new(),
            residue: false,
        }),
        FenceValue::Object(entries) => Some(ObjectProp {
            leaves: Vec::new(),
            nested: fence_object(entries)?,
            residue: false,
        }),
        FenceValue::Array(_) => None,
    }
}

/// Folded array elements as a const array: single leaves and single-leaf
/// objects record; holes cannot arise here (elisions bake to null leaves),
/// and multi-leaf or nested shapes refuse the whole init.
fn fence_array(elements: &[FenceValue]) -> Option<Vec<ConstArrayElement>> {
    elements.iter().map(fence_element).collect()
}

/// One folded array element: a single leaf, a flat object, or a refusal.
fn fence_element(value: &FenceValue) -> Option<ConstArrayElement> {
    match value {
        FenceValue::Leaves(leaves) => {
            let [leaf] = leaves.as_slice() else {
                return None;
            };
            Some(ConstArrayElement::Leaf(leaf.clone()))
        }
        FenceValue::Object(entries) => Some(ConstArrayElement::Object(fence_flat(entries)?)),
        FenceValue::Array(_) => None,
    }
}

/// Folded object entries as a flat single-leaf map, or None when any entry
/// carries nested values or anything but exactly one leaf.
fn fence_flat(entries: &[(Box<str>, FenceValue)]) -> Option<BTreeMap<String, AtomValue>> {
    let mut map = BTreeMap::new();
    for (key, value) in entries {
        let FenceValue::Leaves(leaves) = value else {
            return None;
        };
        let [leaf] = leaves.as_slice() else {
            return None;
        };
        map.insert(key.to_string(), leaf.clone());
    }
    Some(map)
}
