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

#[cfg(test)]
mod differential;
mod source;
mod staging;
#[cfg(test)]
mod tests;
mod values;

use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use module_graph::{
    BindingOrigin, BindingWalk, ExtensionPolicy, ModuleGraph, ModuleKey, ModuleRecord,
    SpecifierLadder, TsconfigPolicy,
};
use oxc_allocator::Allocator;
use oxc_ast::ast::Program;

use super::constants::{collect_local_constants, LocalConstants, MutatedBinding};
use super::scope::{self, BindingInit, ImportRef};
use source::{AtomicFs, AtomicLoader};
use staging::StagingPlan;
pub(crate) use staging::{RetainedSource, StreamedSource};
use values::{bag_export, keep_outcome, valued, valued_scalars};

pub(crate) use values::{reason_text, RefusalCtx, ValueRefused};
pub use values::{ResolvedExport, UnfoldableSpread};

/// One origin query: the importing file plus the local binding name.
type OriginQuery = (ModuleKey, String);

/// One origin outcome: the declaring origin, or the refusal as data.
type OriginOutcome = Result<BindingOrigin, module_graph::Refused>;

/// One origin value: the cloned export, or the refusal as data.
type ValueOutcome = Result<ResolvedExport, ValueRefused>;

/// One origin file's refined values: its graph-backed scope table, the
/// residue markers keyed by root name, and its literal bag for table gaps.
struct RefinedFile {
    table: scope::ScopeTable,
    markers: HashMap<String, Vec<UnfoldableSpread>>,
    bag: LocalConstants,
}

/// One origin file's resolved and refused imports, filled together.
struct OriginMaps {
    /// Resolved imports by local name, merged into the bake.
    resolved: HashMap<String, ResolvedExport>,
    /// Refused imports by local name, recorded as markers.
    refused: HashMap<String, ValueRefused>,
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
    programs: HashMap<ModuleKey, &'s Program<'s>>,
    streamed: HashSet<ModuleKey>,
    project: &'s LocalConstants,
    origins: HashMap<OriginQuery, OriginOutcome>,
    refined: HashMap<ModuleKey, RefinedFile>,
    refining: HashSet<ModuleKey>,
    valued: HashMap<BindingOrigin, ValueOutcome>,
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
    pub fn new(
        sources: &'s [(String, String)],
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
                .chain(streamed.iter().map(|source| (source.key.clone(), &source.record))),
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
    fn new_with_plan(
        sources: &'s [(String, String)],
        retained: &[RetainedSource<'s>],
        streamed: Vec<StreamedSource>,
        project: &'s LocalConstants,
        plan: StagingPlan,
    ) -> Self {
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
        let mut staged = HashMap::new();
        let mut programs = HashMap::new();
        for (source, (key, record)) in retained.iter().zip(pairs) {
            programs.insert(key.clone(), source.program);
            if plan.stages(&key) {
                let bag =
                    collect_local_constants(source.program, source.path, Some(source.content));
                staged.insert(key, (record, bag));
            }
        }
        let mut streamed_keys = HashSet::new();
        for source in streamed {
            streamed_keys.insert(source.key.clone());
            if plan.stages(&source.key) {
                staged.insert(source.key, (source.record, source.bag));
            }
        }
        let graph = ModuleGraph::new(AtomicLoader::new(Rc::clone(&fs), staged));
        Self {
            fs,
            graph,
            programs,
            streamed: streamed_keys,
            project,
            origins: HashMap::new(),
            refined: HashMap::new(),
            refining: HashSet::new(),
            valued: HashMap::new(),
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
    ) -> HashMap<String, ResolvedExport> {
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
        // Atomic follows tsconfig (SITE-54 alias arm); worlds skip.
        let ladder = SpecifierLadder::new(self.fs.as_ref(), ExtensionPolicy::Source)
            .with_tsconfig(TsconfigPolicy::Follow);
        let mut walk = BindingWalk::new(&mut self.graph, &ladder);
        let outcome = walk.resolve_binding(from, local);
        drop(walk);
        self.origins.insert(query, outcome.clone());
        outcome
    }

    /// Read one origin's value, chasing nested import bindings first.
    /// Completed refinements memoize; cycle refusals are chase-order, so an
    /// inner origin refused mid-chase re-reads its refined file on later use.
    fn value_of(&mut self, origin: &BindingOrigin) -> ValueOutcome {
        if let Some(hit) = self.valued.get(origin) {
            return hit.clone();
        }
        if self.valuing.contains(origin) {
            return Err(self.cycle_refusal(origin));
        }
        self.valuing.push(origin.clone());
        let outcome = self.value_uncached(origin);
        self.valuing.pop();
        if !matches!(outcome, Err(ValueRefused::ValueCycle { .. })) {
            self.valued.insert(origin.clone(), outcome.clone());
        }
        outcome
    }

    /// Read one origin's value: mutated origins refuse with the write, and
    /// refined tables answer sources while literal bags answer externals.
    fn value_uncached(&mut self, origin: &BindingOrigin) -> ValueOutcome {
        if let Some(write) = self.origin_mutation(&origin.file, &origin.name) {
            return Err(ValueRefused::Mutated {
                name: origin.name.clone(),
                binding: write,
            });
        }
        match self.refined_file(&origin.file) {
            RefineState::Ready => Ok(self.table_value(origin)),
            RefineState::External => Ok(self.bag_value(&origin.file, &origin.name)),
            RefineState::Cycling => Err(self.cycle_refusal(origin)),
        }
    }

    /// The cycle refusal for `origin` over the current chase stack.
    fn cycle_refusal(&self, origin: &BindingOrigin) -> ValueRefused {
        let mut stack = self.valuing.clone();
        stack.push(origin.clone());
        ValueRefused::ValueCycle { stack }
    }

    /// The origin file's write to a binding, for precise poison.
    fn origin_mutation(&self, file: &ModuleKey, name: &str) -> Option<MutatedBinding> {
        self.graph.loader().bag(file)?.mutation(name).cloned()
    }

    /// Refine one origin file on first use: sources collect against their
    /// own resolved imports, externals keep literal bags, and a file
    /// mid-refinement up-stack reports the chase as cycling. Streamed files
    /// re-parse transiently; their programs never staged.
    fn refined_file(&mut self, file: &ModuleKey) -> RefineState {
        if self.refined.contains_key(file) {
            return RefineState::Ready;
        }
        if self.refining.contains(file) {
            return RefineState::Cycling;
        }
        if self.streamed.contains(file) {
            return self.refine_streamed(file);
        }
        let (Some(program), Some(content)) =
            (self.programs.get(file).copied(), self.fs.content(file))
        else {
            return RefineState::External;
        };
        self.refining.insert(file.clone());
        let refined = self.collect_origin(file, program, content);
        self.refining.remove(file);
        self.refined.insert(file.clone(), refined);
        RefineState::Ready
    }

    /// Refine one streamed file by transient re-parse of its staged bytes
    /// through the identical on-demand path retained files use. Imported
    /// streamed files are rare (dead utils have no importers), so the
    /// re-parse costs nothing in practice; unimported ones never re-parse.
    /// Bytes parsed clean at staging and parsing is deterministic, so a
    /// panicked re-parse is unreachable; it reads as external regardless.
    fn refine_streamed(&mut self, file: &ModuleKey) -> RefineState {
        let Some(content) = self.fs.content(file) else {
            return RefineState::External;
        };
        let allocator = Allocator::default();
        let ret = crate::parse_source(file.as_str(), content, &allocator);
        if ret.panicked {
            return RefineState::External;
        }
        self.refining.insert(file.clone());
        let refined = self.collect_origin(file, &ret.program, content);
        self.refining.remove(file);
        self.refined.insert(file.clone(), refined);
        RefineState::Ready
    }

    /// Collect one origin file: probe its imports, resolve each through the
    /// graph (recursively valuing their origins first), then bake the table
    /// against the outcomes. Import-free files keep the probe table.
    fn collect_origin(
        &mut self,
        file: &ModuleKey,
        program: &Program<'_>,
        content: &str,
    ) -> RefinedFile {
        let probe = scope::collect(program, self.project);
        let refs = probe.import_refs();
        if refs.is_empty() {
            return self.finish_origin(file, probe, Vec::new());
        }
        let (resolved, refused) = self.resolve_origin_imports(file, &refs);
        let fill = scope::OriginFill {
            file: file.as_str(),
            content,
            resolved: &resolved,
            refused: &refused,
        };
        let (table, residues) = scope::collect_with(program, self.project, &fill);
        self.finish_origin(file, table, residues)
    }

    /// Resolve every import of an origin file, valuing each origin first.
    fn resolve_origin_imports(
        &mut self,
        file: &ModuleKey,
        refs: &[ImportRef],
    ) -> (
        HashMap<String, ResolvedExport>,
        HashMap<String, ValueRefused>,
    ) {
        let mut maps = OriginMaps {
            resolved: HashMap::new(),
            refused: HashMap::new(),
        };
        for imp in refs {
            self.resolve_origin_ref(file, imp, &mut maps);
        }
        (maps.resolved, maps.refused)
    }

    /// Resolve one origin-file import into its outcome map.
    fn resolve_origin_ref(&mut self, file: &ModuleKey, imp: &ImportRef, maps: &mut OriginMaps) {
        let local = imp.local.to_string();
        let outcome = match self.resolve_binding(file, &local) {
            Ok(target) => self.value_of(&target),
            Err(miss) => Err(ValueRefused::Walk(miss)),
        };
        match outcome {
            Ok(export) => {
                maps.resolved.insert(local, export);
            }
            Err(no) => {
                maps.refused.insert(local, no);
            }
        }
    }

    /// Store one origin file's table with its root markers and literal bag.
    fn finish_origin(
        &self,
        file: &ModuleKey,
        table: scope::ScopeTable,
        residues: Vec<scope::SpreadResidue>,
    ) -> RefinedFile {
        let mut markers: HashMap<String, Vec<UnfoldableSpread>> = HashMap::new();
        for residue in residues {
            if residue.scope == scope::ROOT_SCOPE {
                markers
                    .entry(residue.name)
                    .or_default()
                    .push(residue.marker);
            }
        }
        let bag = self.graph.loader().bag(file).cloned().unwrap_or_default();
        RefinedFile {
            table,
            markers,
            bag,
        }
    }

    /// Read one refined origin: the table's root init, its descriptor, or
    /// its own literal bag, with the root's markers riding along.
    fn table_value(&self, origin: &BindingOrigin) -> ResolvedExport {
        let Some(refined) = self.refined.get(&origin.file) else {
            return self.bag_value(&origin.file, &origin.name);
        };
        let mut export = Self::init_export(refined, &origin.name);
        if let Some(markers) = refined.markers.get(&origin.name) {
            export.set_unfoldable(markers.clone());
        }
        export
    }

    /// One refined root init as an export, falling back to the descriptor
    /// and then the file's own literal bag.
    fn init_export(refined: &RefinedFile, name: &str) -> ResolvedExport {
        match refined.table.root_init(name) {
            Some(BindingInit::Scalars { leaves, residue }) => valued_scalars(leaves, residue),
            Some(BindingInit::Object(map)) => valued(Vec::new(), Some(map), None, None),
            Some(BindingInit::Array(elements)) => valued(Vec::new(), None, Some(elements), None),
            Some(BindingInit::PureFn(_)) | None => Self::descriptor_export(refined, name),
        }
    }

    /// One refined root descriptor as an export, else the literal bag's own.
    fn descriptor_export(refined: &RefinedFile, name: &str) -> ResolvedExport {
        match refined.table.root_pure_fn(name) {
            Some(func) => valued(Vec::new(), None, None, Some(func)),
            None => bag_export(&refined.bag, name),
        }
    }

    /// Read one external origin's literal value, without descriptors.
    fn bag_value(&self, file: &ModuleKey, name: &str) -> ResolvedExport {
        match self.graph.loader().bag(file) {
            Some(bag) => bag_export(bag, name),
            None => ResolvedExport::default(),
        }
    }
}
