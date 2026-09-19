//! Branching-spread recording for const objects (SPEC-V2-24).
//!
//! [`union_spread_arms`] unions every resolvable arm of a conditional or
//! logical spread into the entry sink: inline-object arms lower directly,
//! identifier arms clone the recorded object, and anything else stays out.
//! Same-key leaves concatenate — dropping an arm would lose keys the
//! runtime spread carries — so a spread of `cond ? { color: 'red' } :
//! { color: 'blue' }` records both colors and the use site lowers both,
//! exactly like the top-level walk.

use oxc_ast::ast::Expression;

use super::table::{ScopeId, ScopeTable};
use super::value::{object_binding, object_init, DepKey, EntrySink, KeyProvenance};
use crate::extract::constants::{union_entry, ConstObject};

/// Union every resolvable arm of a branching spread into the sink.
///
/// The caller filters logical operands for guards first; conditional arms
/// arrive whole. Calls, members, and non-object arms stay out: calls never
/// spread statically, and member paths need collect-time reads (follow-up).
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
