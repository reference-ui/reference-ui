//! Binding-aware import values over the shared module graph (SPEC-V2-76).
//! Answers each file's import bindings with the declared export in THAT
//! file: the ladder finds the target, the walk follows hops and star barrels
//! with a cycle guard, and `value_of` reads the origin's refined values —
//! scalar leaves, style objects with import spreads resolved, const arrays,
//! and lowered pure-helper descriptors. Refinement is demand-driven and
//! memoized: an origin file collects against its own resolved imports only
//! when something imports it, chasing nested bindings through the graph with
//! an in-progress set so cycles refuse instead of recursing. Unresolvable
//! nested spreads leave residue markers the use site diagnoses; refused,
//! default, and namespace imports stay out of the map, and the scope chain
//! falls back to nothing for them — imports never consult the name-wide bag.
//! A const copied from an import answers the import's value (or its write).

#[cfg(test)]
mod differential;
mod refine;
mod source;
mod staging;
#[cfg(test)]
mod tests;
mod values;

/// The loose inputs a value graph is assembled from, grouped so the test-only staging override
/// takes two arguments.
#[cfg(test)]
struct GraphInputs<'s, 'r> {
    sources: &'s [crate::Source],
    retained: &'r [RetainedSource<'s>],
    streamed: Vec<StreamedSource>,
    project: &'s LocalConstants,
}

#[cfg(test)]
impl<'s, 'r> GraphInputs<'s, 'r> {
    fn new(
        sources: &'s [crate::Source],
        retained: &'r [RetainedSource<'s>],
        streamed: Vec<StreamedSource>,
        project: &'s LocalConstants,
    ) -> Self {
        Self {
            sources,
            retained,
            streamed,
            project,
        }
    }
}

use std::rc::Rc;

use rustc_hash::{FxHashMap, FxHashSet};

use module_graph::{
    BindingOrigin, BindingWalk, ExtensionPolicy, ModuleGraph, ModuleKey, ModuleRecord,
    SpecifierLadder, TsconfigPolicy,
};
use oxc_ast::ast::Program;

use super::constants::LocalConstants;
use super::scope::{self, ImportRef};
use source::{AtomicFs, AtomicLoader, StagedBag};
use staging::StagingPlan;
pub(crate) use staging::{RetainedSource, StreamedSource};
use values::keep_outcome;

pub(crate) use values::{reason_text, RefusalCtx, ValueRefused};
pub use values::{ResolvedExport, UnfoldableSpread};

/// One origin query: the importing file plus the local binding name.
type OriginQuery = (ModuleKey, String);

/// One origin outcome: the declaring origin, or the refusal as data.
type OriginOutcome = Result<BindingOrigin, module_graph::Refused>;

/// One origin value: the cloned export, or the refusal as data.
type ValueOutcome = Result<ResolvedExport, ValueRefused>;

/// One origin file's refined values: its graph-backed scope table, the
/// residue markers keyed by root name, its resolved and refused imports for
/// `const copy = imported` aliases, and its literal bag for table gaps.
struct RefinedFile {
    table: scope::ScopeTable,
    markers: FxHashMap<String, Vec<UnfoldableSpread>>,
    imports: OriginMaps,
    bag: LocalConstants,
}

/// One origin file's resolved and refused imports, filled together.
#[derive(Default)]
struct OriginMaps {
    /// Resolved imports by local name, merged into the bake.
    resolved: FxHashMap<String, ResolvedExport>,
    /// Refused imports by local name, recorded as markers.
    refused: FxHashMap<String, ValueRefused>,
}

/// Whether an origin file refined, is external, or is mid-refinement.
enum RefineState {
    /// The file refined; its table answers.
    Ready,
    /// No staged program (an external target); the literal bag answers.
    External,
    /// The file is mid-refinement up-stack; the chase cycles.
    Cycling,
}

/// One graph assembly: compile inputs plus the staging plan deciding
/// which records and bags the loader stages. A struct (not loose args)
/// so the arg-count gate never sees the seven inputs at once.
struct Assembly<'s, 'r> {
    retained: &'r [RetainedSource<'s>],
    pairs: Vec<(ModuleKey, ModuleRecord)>,
    streamed: Vec<StreamedSource>,
    project: &'s LocalConstants,
    fs: Rc<AtomicFs<'s>>,
    plan: StagingPlan,
}

/// The upfront value graph: the shared module graph behind demand-driven
/// origin values. Built once per compile over the single parse; each file's
/// imports resolve against it before extraction walks the file.
pub struct ValueGraph<'s> {
    fs: Rc<AtomicFs<'s>>,
    graph: ModuleGraph<AtomicLoader<'s>>,
    programs: FxHashMap<ModuleKey, &'s Program<'s>>,
    streamed: FxHashSet<ModuleKey>,
    project: &'s LocalConstants,
    origins: FxHashMap<OriginQuery, OriginOutcome>,
    refined: FxHashMap<ModuleKey, RefinedFile>,
    refining: FxHashSet<ModuleKey>,
    valued: FxHashMap<BindingOrigin, ValueOutcome>,
    valuing: Vec<BindingOrigin>,
}

impl<'s> ValueGraph<'s> {
    /// Build the graph over retained programs plus staged streamed files.
    /// Files carrying outgoing edges stage their record and literal bag, as
    /// do the files edges reach; everything else unstages, and the loader's
    /// miss path serves it bit-identically if a walk ever reaches it. Scope
    /// tables refine on demand when something imports the file, re-parsing
    /// streamed bytes through the identical path. Unparseable sources stay
    /// out, so imports targeting them refuse like any unresolvable specifier.
    pub(crate) fn new(
        sources: &'s [crate::Source],
        retained: &[RetainedSource<'s>],
        streamed: Vec<StreamedSource>,
        project: &'s LocalConstants,
    ) -> Self {
        let fs = Rc::new(AtomicFs::new(sources));
        let pairs = Self::retained_pairs(retained);
        let plan = StagingPlan::census(
            pairs
                .iter()
                .map(|(key, record)| (key.clone(), record))
                .chain(
                    streamed
                        .iter()
                        .map(|source| (source.key.clone(), &source.record)),
                ),
            &|key| fs.content(key).is_some(),
        );
        Self::from_plan(Assembly {
            retained,
            pairs,
            streamed,
            project,
            fs,
            plan,
        })
    }

    /// Test-only staging override for the force-unstage differential: the
    /// given plan decides inserts, so tests can stage nothing or everything.
    #[cfg(test)]
    fn new_with_plan(inputs: GraphInputs<'s, '_>, plan: StagingPlan) -> Self {
        let GraphInputs {
            sources,
            retained,
            streamed,
            project,
        } = inputs;
        let fs = Rc::new(AtomicFs::new(sources));
        let pairs = Self::retained_pairs(retained);
        Self::from_plan(Assembly {
            retained,
            pairs,
            streamed,
            project,
            fs,
            plan,
        })
    }

    /// One key plus record per retained file: the census input and the
    /// staged-insert material, collected once up front.
    fn retained_pairs(retained: &[RetainedSource<'_>]) -> Vec<(ModuleKey, ModuleRecord)> {
        retained
            .iter()
            .map(|source| {
                (
                    ModuleKey::new(source.path),
                    ModuleRecord::collect(source.program),
                )
            })
            .collect()
    }

    /// Assemble over a staging plan: programs for every retained file, and
    /// records plus literal bags only where the plan stages. Retained bags
    /// collect after the census, so unstaged files never pay for them;
    /// streamed bags arrive staged-or-dropped with their records.
    fn from_plan(assembly: Assembly<'s, '_>) -> Self {
        let Assembly {
            retained,
            pairs,
            streamed,
            project,
            fs,
            plan,
        } = assembly;
        let mut staged = FxHashMap::default();
        let mut programs = FxHashMap::default();
        for (source, (key, record)) in retained.iter().zip(pairs) {
            programs.insert(key.clone(), source.program);
            if plan.stages(&key) {
                let bag = StagedBag::deferred(source.program, source.path, source.content);
                staged.insert(key, (record, bag));
            }
        }
        let mut streamed_keys = FxHashSet::default();
        for source in streamed {
            streamed_keys.insert(source.key.clone());
            if plan.stages(&source.key) {
                staged.insert(source.key, (source.record, StagedBag::ready(source.bag)));
            }
        }
        let graph = ModuleGraph::new(AtomicLoader::new(Rc::clone(&fs), staged));
        Self {
            fs,
            graph,
            programs,
            streamed: streamed_keys,
            project,
            origins: FxHashMap::default(),
            refined: FxHashMap::default(),
            refining: FxHashSet::default(),
            valued: FxHashMap::default(),
            valuing: Vec::new(),
        }
    }

    /// Resolve one file's import bindings to cloned origins, keyed by local
    /// name. Refused, namespace, and default imports stay out; mutated
    /// origins enter value-empty with the origin write, so uses name it.
    pub fn resolve_file_imports(
        &mut self,
        path: &str,
        imports: &[ImportRef],
    ) -> FxHashMap<String, ResolvedExport> {
        let from = ModuleKey::new(path);
        imports
            .iter()
            .filter_map(|imp| self.resolve_one_import(&from, imp))
            .collect()
    }

    /// Resolve one import binding: its origin value when it folds, a
    /// mutation entry when the origin was written, else nothing.
    fn resolve_one_import(
        &mut self,
        from: &ModuleKey,
        imp: &ImportRef,
    ) -> Option<(String, ResolvedExport)> {
        let local = imp.local.as_ref();
        let resolved = match self.resolve_binding(from, local) {
            Ok(origin) => self.value_of(&origin),
            Err(miss) => Err(ValueRefused::Walk(miss)),
        };
        keep_outcome(local, resolved)
    }

    /// Resolve one binding used in `from` to its declaring origin, memoized.
    fn resolve_binding(&mut self, from: &ModuleKey, local: &str) -> OriginOutcome {
        let query = (from.clone(), local.to_string());
        if let Some(hit) = self.origins.get(&query) {
            return hit.clone();
        }
        // Atomic follows tsconfig (SITE-54 alias arm); worlds skip. Package
        // roots are source-first, so a `types` declaration never shadows the
        // `exports` source that carries a style value (ATM-SITE-91).
        let ladder = SpecifierLadder::new(self.fs.as_ref(), ExtensionPolicy::Source)
            .with_tsconfig(TsconfigPolicy::Follow);
        let mut walk = BindingWalk::new(&mut self.graph, &ladder);
        let outcome = walk.resolve_binding(from, local);
        drop(walk);
        self.origins.insert(query, outcome.clone());
        outcome
    }
}
