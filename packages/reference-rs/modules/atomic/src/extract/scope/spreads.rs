//! Spread recording for const objects: direct, member, and branching.
//!
//! [`record_spread`] copies a static spread's entries verbatim — an
//! identifier's recorded object, an inline object, or a member path's nested
//! entries — while [`union_spread_arms`] unions every resolvable arm of a
//! conditional or logical spread (SPEC-V2-24). Same-key leaves concatenate —
//! dropping an arm would lose keys the runtime spread carries — so a spread
//! of `cond ? { color: 'red' } : { color: 'blue' }` records both colors and
//! the use site lowers both, exactly like the top-level walk.

use oxc_ast::ast::{Expression, StaticMemberExpression};

use super::lookup::{ImportLookup, ScopeChain};
use super::table::{ScopeId, ScopeTable};
use super::value::{object_binding, object_init, peel, DepKey, EntrySink, KeyProvenance};
use crate::extract::constants::{union_entry, ConstObject, LocalConstants};
use crate::extract::expressions::walk::is_guard_expression;

/// Copy a static spread's entries verbatim; branching spreads union every
/// resolvable arm; other spreads stay out.
pub(crate) fn record_spread(
    argument: &Expression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) {
    let spread = peel(argument);
    if record_direct_spread(spread, table, scope, sink) {
        return;
    }
    record_branching_spread(spread, table, scope, sink);
    // Calls never spread statically.
}

/// A direct spread: an identifier's recorded object, an inline object, or a
/// member path's nested entries. True when the shape matched, resolved or not.
fn record_direct_spread(
    spread: &Expression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) -> bool {
    if let Expression::Identifier(id) = spread {
        // { ...base }  after  const base = { mt: '2r' }
        if let Some((src_scope, map)) = object_binding(table, scope, id.name.as_str()) {
            for (key, prop) in map {
                push_spread_provenance(sink, &key, src_scope, id.name.as_str());
                sink.entries.insert(key, prop);
            }
        }
        return true;
    }
    if let Expression::ObjectExpression(inner) = spread {
        // { ...{ mt: '2r' } }  — inline spreads recurse with their provenance
        let (inner_entries, inner_provenances) = object_init(inner, table, scope);
        sink.provenances.extend(inner_provenances);
        sink.entries.extend(inner_entries);
        return true;
    }
    if let Expression::StaticMemberExpression(mem) = spread {
        // { ...styles.hover }  — the nested entries copy verbatim (§13)
        record_member_spread(mem, table, scope, sink);
        return true;
    }
    false
}

/// A branching spread: conditionals union both arms, logicals union the
/// non-guard operands. Anything else is not a spread shape at all.
fn record_branching_spread(
    spread: &Expression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) {
    if let Expression::ConditionalExpression(cond) = spread {
        // { ...(c ? a : b) }  — union every arm that resolves (SPEC-V2-24)
        union_spread_arms(&[&cond.consequent, &cond.alternate], table, scope, sink);
        return;
    }
    if let Expression::LogicalExpression(log) = spread {
        // { ...(u && a) }  — non-guard operands union, as walked
        union_spread_arms(&logical_arms(log), table, scope, sink);
    }
}

/// The non-guard operands of a logical spread, as the walk lowers them.
fn logical_arms<'a, 'b>(log: &'b oxc_ast::ast::LogicalExpression<'a>) -> Vec<&'b Expression<'a>> {
    [&log.left, &log.right]
        .into_iter()
        .filter(|side| !is_guard_expression(side))
        .collect()
}

/// Union every resolvable arm of a branching spread into the sink.
///
/// The caller filters logical operands for guards first; conditional arms
/// arrive whole. Calls, member paths, and non-object arms stay out: calls
/// never spread statically, and member paths union only as direct spreads
/// (`record_spread`), never as branch arms.
pub(crate) fn union_spread_arms(
    arms: &[&Expression<'_>],
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) {
    for arm in arms {
        union_one_arm(arm, table, scope, sink);
    }
}

/// Union one spread arm: an inline object, a named object, or nothing.
fn union_one_arm(arm: &Expression<'_>, table: &ScopeTable, scope: ScopeId, sink: &mut EntrySink) {
    let arm = super::value::peel(arm);
    if let Expression::ObjectExpression(obj) = arm {
        union_inline_arm(obj, table, scope, sink);
        return;
    }
    if let Expression::Identifier(id) = arm {
        union_ident_arm(id.name.as_str(), table, scope, sink);
    }
}

/// Union one inline-object arm, recursing with its provenance.
fn union_inline_arm(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) {
    let (inner_entries, inner_provenances) = object_init(obj, table, scope);
    sink.provenances.extend(inner_provenances);
    union_sink_entries(sink, inner_entries);
}

/// Union one identifier arm's recorded object, with per-key provenance.
fn union_ident_arm(target: &str, table: &ScopeTable, scope: ScopeId, sink: &mut EntrySink) {
    if let Some((src_scope, map)) = object_binding(table, scope, target) {
        for (key, prop) in map {
            push_spread_provenance(sink, &key, src_scope, target);
            union_entry(&mut sink.entries, key, prop);
        }
    }
}

/// Union resolved entries into the sink one key at a time.
fn union_sink_entries(sink: &mut EntrySink, entries: ConstObject) {
    for (key, prop) in entries {
        union_entry(&mut sink.entries, key, prop);
    }
}

/// Copy a member-hop spread's nested entries verbatim, with whole-root
/// provenance: any write to the root strips every copied entry, matching
/// the poison member inits carry. Unresolvable paths stay out.
pub(crate) fn record_member_spread(
    mem: &StaticMemberExpression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) {
    let Some((src_scope, root, map)) = member_spread_object(table, scope, mem) else {
        return;
    };
    for (key, prop) in map {
        sink.provenances.push(KeyProvenance {
            key: key.clone(),
            src_scope,
            src_name: root.clone(),
            src_key: None,
        });
        sink.entries.insert(key, prop);
    }
}

/// The nested entries a member-hop spread names, with the root's scope and
/// name. Resolves table-locally only (no imports), exactly like member inits.
fn member_spread_object(
    table: &ScopeTable,
    scope: ScopeId,
    mem: &StaticMemberExpression<'_>,
) -> Option<(ScopeId, String, ConstObject)> {
    let root = crate::extract::fold::member_root_name(mem)?;
    let empty = LocalConstants::default();
    let chain = ScopeChain::new(table, ImportLookup::ProjectBag(&empty));
    let entries = crate::extract::fold::member_path_object(mem, chain.at(scope))?;
    let (src_scope, _) = table.resolve_from(root, scope)?;
    Some((src_scope, root.to_string(), entries.clone()))
}

/// Provenance for one copied spread entry: the source object and key.
pub(crate) fn push_spread_provenance(
    sink: &mut EntrySink,
    key: &str,
    src_scope: ScopeId,
    src_name: &str,
) {
    sink.provenances.push(KeyProvenance {
        key: key.to_string(),
        src_scope,
        src_name: src_name.to_string(),
        src_key: Some(DepKey::ObjectKey(key.to_string())),
    });
}
