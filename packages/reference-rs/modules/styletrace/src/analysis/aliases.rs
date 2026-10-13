//! Resolves compound-member aliases (`Tabs.Panel = TabPanel`) to dotted style hosts.
//! Takes one module's member assignments, or a re-exported namespace's remapped ones, and follows each
//! alias target through local components, factories, identifier chains, and imports back to Reference primitives.
//! Emits one dotted name (`Tabs.Panel`) plus its owned props per traced target, for the exposure walk to label.
//! Aliases onto untraced targets emit nothing; cycles resolve to untraced, reassigned hosts last-wins.

use std::collections::BTreeSet;
use std::path::Path;

use rustc_hash::FxHashSet;

use super::analyzer::StyleTraceAnalyzer;
use super::model::{MemberAlias, TraceModule};
use crate::resolver::StyleTraceError;

/// One module under alias walk: its path, parsed shape, and the alias slice to emit. Re-exports pass
/// a renamed slice so one emit loop serves own and barrel hosts alike.
pub(super) struct WalkModule<'a> {
    pub(super) path: &'a Path,
    pub(super) module: &'a TraceModule,
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

/// The traced dotted names among one slice of member aliases, each with the owned props of its
/// target. Reassignments resolve last-wins: only the final target per host emits, matching runtime.
pub(super) fn alias_exposures(
    analyzer: &mut StyleTraceAnalyzer<'_>,
    walk: &WalkModule<'_>,
) -> Result<Vec<(String, BTreeSet<String>)>, StyleTraceError> {
    let mut seen = FxHashSet::default();
    let mut exposures = Vec::new();
    for alias in walk.aliases.iter().rev() {
        if !seen.insert(alias.host()) {
            continue;
        }
        if let Some(owned) = alias_target_is_traced(analyzer, walk, &alias.target, &mut Vec::new())? {
            exposures.push((alias.host(), owned));
        }
    }
    Ok(exposures)
}

/// The owned props when a plain ident alias target traces: follows one
/// `const Alias = Target` chain through locals, imports, and primitives
/// with the member walk's cycle guard. Plain JSX edges (`<IconShell>`)
/// resolve through this; member hosts keep their emit loop above.
pub(super) fn ident_alias_target_is_traced(
    analyzer: &mut StyleTraceAnalyzer<'_>,
    path: &Path,
    module: &TraceModule,
    target: &str,
    stack: &mut Vec<String>,
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    let walk = WalkModule {
        path,
        module,
        aliases: &[],
    };
    alias_target_is_traced(analyzer, &walk, target, stack)
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
