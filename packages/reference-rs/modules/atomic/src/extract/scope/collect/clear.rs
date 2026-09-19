//! Post-visit clearing of optimistically recorded call inits.
//! Factory and `token()` inits record before their callee's import is known,
//! so this pass clears every init whose callee is not a Reference import.
//! Forward imports resolve here, shadowed and foreign callees clear, and
//! dependents that cloned a cleared init clear too, to a fixpoint — no stale
//! name survives through a copy.

use super::super::binding::BindingKind;
use super::super::table::{ScopeId, ScopeTable};
use super::super::value::{Dep, DepKey};
use super::{FactoryWait, TokenWait};

/// Clear call inits whose callee is not a Reference import.
///
/// Runs after the visit so forward imports resolve; shadowed, unbound, and
/// foreign-package callees clear. Dependents that cloned a cleared init —
/// alias chains, object entries — clear too, to a fixpoint, so no stale
/// name survives through a copy.
pub(crate) fn clear_unbound_calls(
    table: &mut ScopeTable,
    deps: &[Dep],
    factory: &[FactoryWait],
    token_waits: &[TokenWait],
) {
    let mut cleared = initial_factory_clears(table, factory);
    cleared.extend(initial_token_clears(table, token_waits));
    while cascade_call_clears(table, deps, &mut cleared) {}
}

/// Clear every factory init without a Reference factory import behind it.
fn initial_factory_clears(table: &mut ScopeTable, waits: &[FactoryWait]) -> Vec<(ScopeId, String)> {
    let mut cleared = Vec::new();
    for wait in waits {
        if factory_import_bound(table, wait) {
            continue;
        }
        table.clear_init(wait.scope, &wait.name);
        cleared.push((wait.scope, wait.name.clone()));
    }
    cleared
}

/// Clear every `token()` init without a Reference `token` import behind it.
fn initial_token_clears(table: &mut ScopeTable, waits: &[TokenWait]) -> Vec<(ScopeId, String)> {
    let mut cleared = Vec::new();
    for wait in waits {
        if token_import_bound(table, wait) {
            continue;
        }
        table.clear_init(wait.scope, &wait.name);
        cleared.push((wait.scope, wait.name.clone()));
    }
    cleared
}

/// True when a token callee resolves to a `token` import from Reference.
fn token_import_bound(table: &ScopeTable, wait: &TokenWait) -> bool {
    let Some((_, binding)) = table.resolve_from(&wait.callee, wait.scope) else {
        return false;
    };
    let BindingKind::Import(imp) = &binding.kind else {
        return false;
    };
    crate::extract::fold::is_token_import(imp)
}

/// One cascade pass: clear dependents of cleared inits. True when it cleared.
fn cascade_call_clears(
    table: &mut ScopeTable,
    deps: &[Dep],
    cleared: &mut Vec<(ScopeId, String)>,
) -> bool {
    let mut grew = false;
    for dep in deps {
        if !cleared_source(cleared, dep) || is_cleared(cleared, dep.scope, &dep.name) {
            continue;
        }
        match &dep.key {
            DepKey::Whole => table.clear_init(dep.scope, &dep.name),
            DepKey::ObjectKey(key) => table.remove_object_key(dep.scope, &dep.name, key),
        }
        cleared.push((dep.scope, dep.name.clone()));
        grew = true;
    }
    grew
}

/// True when a dep's source binding already cleared.
fn cleared_source(cleared: &[(ScopeId, String)], dep: &Dep) -> bool {
    cleared
        .iter()
        .any(|(s, n)| *s == dep.src_scope && *n == dep.src_name)
}

/// True when a binding already cleared.
fn is_cleared(cleared: &[(ScopeId, String)], scope: ScopeId, name: &str) -> bool {
    cleared.iter().any(|(s, n)| *s == scope && n == name)
}

/// True when a factory callee resolves to a `keyframes`/`positionTry` import
/// from a Reference package. Aliases answer by imported name; locals,
/// unbound names, and foreign packages refuse.
fn factory_import_bound(table: &ScopeTable, wait: &FactoryWait) -> bool {
    let Some((_, binding)) = table.resolve_from(&wait.callee, wait.scope) else {
        return false;
    };
    let BindingKind::Import(imp) = &binding.kind else {
        return false;
    };
    (imp.imported.as_ref() == "keyframes" || imp.imported.as_ref() == "positionTry")
        && imp.specifier.as_ref().starts_with("@reference-ui/")
}
