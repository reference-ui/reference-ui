//! Resolves compound-member aliases (`Tabs.Panel = TabPanel`) to dotted style hosts.
//! Takes one parsed module's member assignments plus the analyzer's trace
//! caches, and follows each alias target through local components, factories,
//! identifier chains, and imports back to Reference primitives.
//! Emits one dotted binding (`Tabs.Panel`) plus its owned props per traced
//! target, so member-form use sites collect. Aliases onto untraced targets
//! emit nothing; cycles resolve to untraced, reassigned hosts last-wins.

use std::collections::BTreeSet;
use std::path::Path;

use rustc_hash::FxHashSet;

use super::analyzer::StyleTraceAnalyzer;
use super::model::{MemberAlias, TraceModule, TracedBinding};
use crate::resolver::StyleTraceError;

/// One module under alias walk: its path, parsed shape, module label, and
/// the alias slice to emit. Re-exports pass a renamed slice so one emit
/// loop serves own and barrel hosts alike.
pub(super) struct WalkModule<'a> {
    pub(super) path: &'a Path,
    pub(super) module: &'a TraceModule,
    pub(super) rel: &'a str,
    pub(super) aliases: &'a [MemberAlias],
}

/// The origin namespace's aliases renamed to the barrel's export name:
/// `export { Tabs as Accordion }` turns `Tabs.Panel` into
/// `Accordion.Panel`. Order is kept, so the emit loop's last-wins holds.
pub(super) fn remapped_aliases(module: &TraceModule, from: &str, to: &str) -> Vec<MemberAlias> {
    module
        .member_aliases
        .iter()
        .filter(|alias| alias.namespace == from)
        .map(|alias| MemberAlias {
            namespace: to.to_string(),
            prop: alias.prop.clone(),
            target: alias.target.clone(),
        })
        .collect()
}

/// What one alias target name resolves to within its module.
enum TargetStep<'a> {
    /// A local component or factory: trace it.
    Local,
    /// An imported binding: trace the import target.
    Imported { source: &'a str, imported_name: &'a str },
    /// An identifier link: follow it.
    Chain(&'a str),
    /// Nothing to follow: the alias stays silent.
    Dead,
}

/// Resolve one module's member aliases into dotted traced bindings.
/// Each traced target gains one binding plus its owned props under the
/// dotted host; untraced targets stay silent. Reassignments resolve
/// last-wins: only the final target per host emits, matching runtime.
pub(super) fn collect_alias_bindings(
    analyzer: &mut StyleTraceAnalyzer<'_>,
    walk: &WalkModule<'_>,
    bindings: &mut BTreeSet<TracedBinding>,
) -> Result<(), StyleTraceError> {
    let mut seen = FxHashSet::default();
    for alias in walk.aliases.iter().rev() {
        if !seen.insert(alias.host()) {
            continue;
        }
        let traced = alias_target_is_traced(analyzer, walk, &alias.target, &mut Vec::new())?;
        if let Some(owned) = traced {
            let host = alias.host();
            bindings.insert(TracedBinding::new(walk.rel, &host));
            analyzer.record_owned(&host, owned);
        }
    }
    Ok(())
}

/// Outcome of one walk step: follow the next link, or finish with a verdict.
enum WalkAction {
    Follow(String),
    Done(Option<BTreeSet<String>>),
}

/// The target's owned props when it traces to a primitive; `None`
/// otherwise. Identifier links resolve transitively with a visited set,
/// so `const A = B` chains and self-cycles terminate.
fn alias_target_is_traced(
    analyzer: &mut StyleTraceAnalyzer<'_>,
    walk: &WalkModule<'_>,
    target: &str,
    stack: &mut Vec<String>,
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    let mut name = target.to_string();
    let mut seen = FxHashSet::default();
    loop {
        if !seen.insert(name.clone()) {
            return Ok(None);
        }
        match walk_step(analyzer, walk, &name, stack)? {
            WalkAction::Follow(next) => name = next,
            WalkAction::Done(traced) => return Ok(traced),
        }
    }
}

/// One step of the target walk: locals and imports trace to a verdict,
/// identifier links continue the walk, dead ends finish untraced.
fn walk_step(
    analyzer: &mut StyleTraceAnalyzer<'_>,
    walk: &WalkModule<'_>,
    name: &str,
    stack: &mut Vec<String>,
) -> Result<WalkAction, StyleTraceError> {
    match classify_target(walk.module, name) {
        TargetStep::Local => Ok(WalkAction::Done(
            analyzer.component_is_traced(walk.path, name, stack)?,
        )),
        TargetStep::Imported {
            source,
            imported_name,
        } => Ok(WalkAction::Done(
            analyzer.import_target_is_traced(walk.path, source, imported_name, stack)?,
        )),
        TargetStep::Chain(next) => Ok(WalkAction::Follow(next.to_string())),
        TargetStep::Dead => Ok(WalkAction::Done(None)),
    }
}

/// Classify one target name: local component/factory, live import,
/// identifier link, or dead end. Namespace imports are dead ends: no
/// single export backs them.
fn classify_target<'a>(module: &'a TraceModule, name: &str) -> TargetStep<'a> {
    if module.components.contains_key(name) || module.component_factories.contains_key(name) {
        return TargetStep::Local;
    }
    if let Some(import) = module.imports.get(name) {
        if import.is_namespace {
            return TargetStep::Dead;
        }
        return TargetStep::Imported {
            source: &import.source,
            imported_name: &import.imported_name,
        };
    }
    match module.identifier_aliases.get(name) {
        Some(next) => TargetStep::Chain(next),
        None => TargetStep::Dead,
    }
}
