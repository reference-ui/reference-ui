//! Resolves a module's recorded exports once every top-level binding is known.
//! `finish` follows identifier and wrapper links to the component, factory or import each export names, and writes those targets into the module's export map.
//! It then re-keys compound-member aliases under the exported names their namespace is reachable through, so an unexported namespace mints no dotted host.

use std::collections::{BTreeMap, BTreeSet};

use rustc_hash::{FxHashMap, FxHashSet};

use crate::analysis::model::{ExportTarget, MemberAlias, TraceImport};

use super::exports::DEFAULT_EXPORT;
use super::ParseState;

/// Resolve every recorded export against the finished module, then re-key the compound-member
/// aliases under the exported names their namespace is reachable through. Runs once per module,
/// after the statement walk, so declaration order never decides an export.
pub(super) fn finish(state: &mut ParseState, imports: &FxHashMap<String, TraceImport>) {
    let entries = std::mem::take(&mut state.local_exports.entries);
    let mut publics: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for entry in &entries {
        let public = if entry.exported == DEFAULT_EXPORT {
            entry.local.clone()
        } else {
            entry.exported.clone()
        };
        publics
            .entry(identity_root(state, &entry.local))
            .or_default()
            .insert(public);
        if entry.exported == DEFAULT_EXPORT {
            continue;
        }
        if let Some(target) = resolve_local_export(state, imports, &entry.local) {
            state.exports.insert(entry.exported.clone(), target);
        }
    }
    state.member_aliases = rename_member_aliases(state, &publics);
}

/// Re-key each compound-member alias under every exported name its namespace answers to.
/// A namespace nothing exports mints nothing, so `TabsRoot.Item` never leaks past the module.
fn rename_member_aliases(
    state: &ParseState,
    publics: &BTreeMap<String, BTreeSet<String>>,
) -> Vec<MemberAlias> {
    let mut renamed = Vec::new();
    for alias in &state.member_aliases {
        let Some(namespaces) = publics.get(&identity_root(state, &alias.namespace)) else {
            continue;
        };
        for namespace in namespaces {
            renamed.push(MemberAlias {
                namespace: namespace.clone(),
                prop: alias.prop.clone(),
                target: alias.target.clone(),
            });
        }
    }
    renamed
}

/// The binding an identity chain (`const A = B`) bottoms out at. Wrapper links stop the walk,
/// because a memo or forwardRef object is not the wrapped binding; cycles stop at the repeat.
fn identity_root(state: &ParseState, name: &str) -> String {
    let mut current = name.to_string();
    let mut seen = FxHashSet::default();
    loop {
        if state.local_exports.wrapper_links.contains(&current) || !seen.insert(current.clone()) {
            return current;
        }
        match state.identifier_aliases.get(&current) {
            Some(next) => current = next.clone(),
            None => return current,
        }
    }
}

/// The export target a local binding names: a component or factory in this module, an import,
/// or an identifier link (`export const Card = CardBase`) that reaches one of those. Type-only
/// bindings and cycles resolve to nothing.
fn resolve_local_export(
    state: &ParseState,
    imports: &FxHashMap<String, TraceImport>,
    local: &str,
) -> Option<ExportTarget> {
    let mut current = local.to_string();
    let mut seen = FxHashSet::default();
    loop {
        if !seen.insert(current.clone()) || state.local_exports.type_only.contains(&current) {
            return None;
        }
        if state.components.contains_key(&current)
            || state.component_factories.contains_key(&current)
        {
            return Some(ExportTarget::Local(current));
        }
        if let Some(import) = imports.get(&current) {
            return Some(ExportTarget::Imported {
                source: import.source.clone(),
                imported_name: import.imported_name.clone(),
            });
        }
        current = state.identifier_aliases.get(&current)?.clone();
    }
}
