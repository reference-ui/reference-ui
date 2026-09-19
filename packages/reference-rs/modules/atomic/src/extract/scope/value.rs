//! Collect-time values for const objects with identifier and spread members.
//! The shared lowering records literals, branching leaves, nested maps, and
//! dynamic markers; this pass overlays resolved identifier values and static
//! spreads in property order (`{ primary: red }`, `{ ...base }`), so member
//! uses and destructuring sources resolve without a VM (SPEC-V2-34 object
//! half). Every overlaid entry carries its source as a `Dep`; `strip_stale`
//! drops entries whose source was written anywhere in the project, so a
//! mutated source can never resolve stale through an object it fed.

use std::collections::HashSet;

use oxc_ast::ast::{Expression, ObjectExpression, ObjectPropertyKind, PropertyKey};

use super::binding::BindingInit;
use super::fill::OriginFill;
use super::spreads::SpreadCtx;
use super::table::{ScopeId, ScopeTable};
use crate::atom::AtomValue;
use crate::extract::constants::{
    canonical_numeric_key, object_entries, ConstObject, LocalConstants, ObjectProp,
};
use crate::extract::resolver::UnfoldableSpread;

/// Which slot of a dependent binding a `Dep` strips.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub(crate) enum DepKey {
    /// The binding's whole init (a destructured scalar, default, or array rest).
    Whole,
    /// One entry of a const object (`key` in `{ key: red }` or `{ ...base }`).
    ObjectKey(String),
}

/// One baked value and the source binding it was copied from, for stripping.
#[derive(Debug, Clone)]
pub(crate) struct Dep {
    /// Scope and name of the binding that carries the baked value.
    pub(crate) scope: ScopeId,
    /// Name of the binding that carries the baked value.
    pub(crate) name: String,
    /// Which slot of the dependent strips when the source goes stale.
    pub(crate) key: DepKey,
    /// Scope and name of the source binding the value was copied from.
    pub(crate) src_scope: ScopeId,
    /// Name of the source binding the value was copied from.
    pub(crate) src_name: String,
    /// Which slot of the source feeds this dep (`None` = the whole binding).
    pub(crate) src_key: Option<DepKey>,
}

/// Where one recorded object entry's value came from (literals carry none).
#[derive(Debug, Clone)]
pub(crate) struct KeyProvenance {
    /// The recorded entry key.
    pub(crate) key: String,
    /// Scope of the source binding.
    pub(crate) src_scope: ScopeId,
    /// Name of the source binding.
    pub(crate) src_name: String,
    /// Source slot (`None` for a scalar source, `Some` for a spread entry).
    pub(crate) src_key: Option<DepKey>,
}

impl KeyProvenance {
    /// A dep stripping `key` of `(scope, name)` when this provenance goes stale.
    pub(crate) fn into_dep(self, scope: ScopeId, name: &str, key: DepKey) -> Dep {
        Dep {
            scope,
            name: name.to_string(),
            key,
            src_scope: self.src_scope,
            src_name: self.src_name,
            src_key: self.src_key,
        }
    }
}

/// The peeled object when an init is an object literal under wrappers.
pub(crate) fn as_object_init<'a, 'b>(init: &'b Expression<'a>) -> Option<&'b ObjectExpression<'a>> {
    let unwrapped = peel(init);
    if let Expression::ObjectExpression(obj) = unwrapped {
        Some(obj)
    } else {
        None
    }
}

/// The recorded entries of a const object init: the shared lowering plus
/// resolved identifier values and static spreads, last key wins. The fill
/// answers import bindings from their origin values; without it, imports
/// stay out exactly as before.
pub(crate) fn object_init(
    obj: &ObjectExpression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    fill: Option<OriginFill<'_>>,
) -> EntrySink {
    // const theme = { primary: red, ...base }  — `red` and `base` resolve
    // only when an earlier declaration in scope already recorded them.
    let base = object_entries(obj);
    let mut build = EntryBuild {
        base: &base,
        sink: EntrySink::default(),
        fill,
    };
    let ctx = SpreadCtx { table, scope, fill };
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::ObjectProperty(prop) => {
                record_entry(prop, table, scope, &mut build);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                super::spreads::record_spread(&spread.argument, ctx, &mut build.sink);
            }
        }
    }
    build.sink
}

/// Recorded entries plus where each non-literal entry was copied from.
#[derive(Default)]
pub(crate) struct EntrySink {
    pub(crate) entries: ConstObject,
    pub(crate) provenances: Vec<KeyProvenance>,
    pub(crate) residues: Vec<UnfoldableSpread>,
}

/// The sink plus the shared lowering it overlays, in property order.
struct EntryBuild<'b, 'v> {
    base: &'b ConstObject,
    sink: EntrySink,
    fill: Option<OriginFill<'v>>,
}

/// Record one object entry: a resolved identifier value, else the base entry.
fn record_entry(
    prop: &oxc_ast::ast::ObjectProperty<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    build: &mut EntryBuild<'_, '_>,
) {
    let Some(key) = static_key(&prop.key) else {
        return;
    };
    if let Expression::Identifier(id) = peel(&prop.value) {
        let ctx = SpreadCtx {
            table,
            scope,
            fill: build.fill,
        };
        if record_ident_entry(ctx, id.name.as_str(), &key, &mut build.sink) {
            return;
        }
    }
    // Literals, branching leaves, nested maps, and dynamic markers lower
    // exactly as the shared node lowered them (last key wins by order);
    // array-valued identifiers stay markers for the const-array slice.
    if let Some(prop) = build.base.get(&key) {
        build.sink.entries.insert(key, prop.clone());
    }
}

/// Record one identifier entry: a table-local value, a fill value, or the
/// base marker. True when an arm recorded, so the base stays untouched.
fn record_ident_entry(ctx: SpreadCtx<'_, '_>, name: &str, key: &str, sink: &mut EntrySink) -> bool {
    // { primary: red }  after  const red = 'n300' (or a const ternary —
    // every leaf fills, so no arm silently drops)
    if let Some((leaves, src_scope)) = scalar_leaves(ctx.table, ctx.scope, name) {
        super::fill::push_provenance(sink, key, src_scope, name);
        let residue = scalar_residue(ctx.table, ctx.scope, name);
        sink.entries.insert(
            key.to_string(),
            ObjectProp {
                leaves,
                nested: ConstObject::new(),
                residue,
            },
        );
        return true;
    }
    // { hover: hoverObj }  — object idents clone the nested map so
    // member paths read through the name (SITE-29 member depth)
    if let Some((src_scope, map)) = object_binding(ctx.table, ctx.scope, name) {
        super::fill::push_provenance(sink, key, src_scope, name);
        sink.entries.insert(
            key.to_string(),
            ObjectProp {
                leaves: Vec::new(),
                nested: map,
                residue: false,
            },
        );
        return true;
    }
    // { color: accent } with `accent` imported — origin values bake in
    // with no strip dep: origins arrive unmutated and bags never change.
    if let Some(export) = super::fill::fill_export(ctx.fill, ctx.table, ctx.scope, name) {
        if super::fill::record_fill_entry(sink, key, export) {
            return true;
        }
    }
    false
}

/// The recorded object of an in-scope object binding, with its scope.
pub(crate) fn object_binding(
    table: &ScopeTable,
    scope: ScopeId,
    name: &str,
) -> Option<(ScopeId, ConstObject)> {
    let (src_scope, binding) = table.resolve_from(name, scope)?;
    if let Some(BindingInit::Object(map)) = &binding.init {
        Some((src_scope, map.clone()))
    } else {
        None
    }
}

/// Every static leaf carried by an in-scope scalar binding, with its scope.
pub(crate) fn scalar_leaves(
    table: &ScopeTable,
    scope: ScopeId,
    name: &str,
) -> Option<(Vec<AtomValue>, ScopeId)> {
    // { tone: t }  after  const t = flag ? 'red' : 'blue'
    let (src_scope, binding) = table.resolve_from(name, scope)?;
    if let Some(BindingInit::Scalars { leaves, .. }) = &binding.init {
        if !leaves.is_empty() {
            return Some((leaves.clone(), src_scope));
        }
    }
    None
}

/// True when an in-scope scalar binding dropped a dynamic arm beside its
/// leaves, so copies of its value carry the same residue mark.
pub(crate) fn scalar_residue(table: &ScopeTable, scope: ScopeId, name: &str) -> bool {
    // { sel: isSelected }  after  const isSelected = c ? dyn : false
    let Some((_, binding)) = table.resolve_from(name, scope) else {
        return false;
    };
    matches!(
        &binding.init,
        Some(BindingInit::Scalars { residue: true, .. })
    )
}

/// A single-leaf scalar carried by an in-scope binding, with its scope.
pub(crate) fn single_scalar(
    table: &ScopeTable,
    scope: ScopeId,
    name: &str,
) -> Option<(AtomValue, ScopeId)> {
    // [red]  /  { [key]: c }  — positional slots hold exactly one leaf
    let (leaves, src_scope) = scalar_leaves(table, scope, name)?;
    if leaves.len() == 1 {
        return leaves.into_iter().next().map(|leaf| (leaf, src_scope));
    }
    None
}

/// Drop every baked entry whose source was written or went stale itself.
/// Deps run in visit order: a dep's source is always an earlier declaration
/// (resolution requires it), so one forward pass settles every chain.
pub(crate) fn strip_stale(table: &mut ScopeTable, deps: &[Dep], project: &LocalConstants) {
    let mut stripped: HashSet<(ScopeId, String, Option<DepKey>)> = HashSet::new();
    for dep in deps {
        if project.mutation(&dep.src_name).is_some()
            || stripped.contains(&(dep.src_scope, dep.src_name.clone(), dep.src_key.clone()))
            || stripped.contains(&(dep.src_scope, dep.src_name.clone(), None))
        {
            strip_dep(table, dep);
            stripped.insert((dep.scope, dep.name.clone(), Some(dep.key.clone())));
            if dep.key == DepKey::Whole {
                stripped.insert((dep.scope, dep.name.clone(), None));
            }
        }
    }
}

/// Apply one dep's strip to its dependent slot.
fn strip_dep(table: &mut ScopeTable, dep: &Dep) {
    match &dep.key {
        DepKey::Whole => table.clear_init(dep.scope, &dep.name),
        DepKey::ObjectKey(key) => table.remove_object_key(dep.scope, &dep.name, key),
    }
}

/// A static object key, mirroring the shared lowering fence (no numerics).
fn static_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // { primary: 'n300' }
            Some(ident.name.to_string())
        }
        PropertyKey::StringLiteral(lit) => {
            // { 'primary': 'n300' }  (computed or not — the spelling is static)
            Some(lit.value.to_string())
        }
        PropertyKey::NumericLiteral(lit) => {
            // { 500: 'red' }  — numerics record canonically, verbatim v2
            Some(canonical_numeric_key(lit.value))
        }
        // Computed `[k]` keys fold through the SITE-49 key node.
        _ => None,
    }
}

/// A literal leaf, or None for dynamic shapes.
pub(crate) fn literal_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    match expr {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => {
            Some(AtomValue::Number(n.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// Peel transparent wrappers (parens, `as`, `satisfies`, `!`) off an init.
pub(crate) fn peel<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    match expr {
        Expression::ParenthesizedExpression(p) => peel(&p.expression),
        Expression::TSAsExpression(as_expr) => peel(&as_expr.expression),
        Expression::TSSatisfiesExpression(sat) => peel(&sat.expression),
        Expression::TSNonNullExpression(non_null) => peel(&non_null.expression),
        _ => expr,
    }
}
