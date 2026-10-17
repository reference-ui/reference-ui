//! The origin chase of the value graph: turns an import binding into the value its declaring file
//! exports. `value_of` memoizes each origin read and refuses cycles, while `refined_file` refines a
//! file on first use by collecting its scope table against its own resolved imports. Streamed files
//! refine by transient re-parse, and the finished table answers exports through `table_value`,
//! `init_export`, and `descriptor_export`, falling back to the file's literal bag for externals.
//! Takes origin keys from the binding walk and emits `ResolvedExport` values; it never writes the
//! name-wide bag.

use rustc_hash::FxHashMap;

use module_graph::{BindingOrigin, ModuleKey};
use oxc_allocator::Allocator;
use oxc_ast::ast::Program;

use super::values::{bag_export, valued, valued_scalars};
use super::{
    OriginMaps, RefineState, RefinedFile, ResolvedExport, UnfoldableSpread, ValueGraph,
    ValueOutcome, ValueRefused,
};
use crate::extract::constants::MutatedBinding;
use crate::extract::scope::{self, BindingInit, ImportRef};

impl<'s> ValueGraph<'s> {
    /// Read one origin's value, chasing nested import bindings first.
    /// Completed refinements memoize; cycle refusals are chase-order, so an
    /// inner origin refused mid-chase re-reads its refined file on later use.
    pub(super) fn value_of(&mut self, origin: &BindingOrigin) -> ValueOutcome {
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
    fn origin_mutation(&mut self, file: &ModuleKey, name: &str) -> Option<MutatedBinding> {
        self.graph
            .loader_mut()
            .bag_mut(file)?
            .mutation(name)
            .cloned()
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
        FxHashMap<String, ResolvedExport>,
        FxHashMap<String, ValueRefused>,
    ) {
        let mut maps = OriginMaps {
            resolved: FxHashMap::default(),
            refused: FxHashMap::default(),
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
        &mut self,
        file: &ModuleKey,
        table: scope::ScopeTable,
        residues: Vec<scope::SpreadResidue>,
    ) -> RefinedFile {
        let mut markers: FxHashMap<String, Vec<UnfoldableSpread>> = FxHashMap::default();
        for residue in residues {
            if residue.scope == scope::ROOT_SCOPE {
                markers
                    .entry(residue.name)
                    .or_default()
                    .push(residue.marker);
            }
        }
        let bag = self
            .graph
            .loader_mut()
            .bag_mut(file)
            .cloned()
            .unwrap_or_default();
        RefinedFile {
            table,
            markers,
            bag,
        }
    }

    /// Read one refined origin: the table's root init, its descriptor, or
    /// its own literal bag, with the root's markers riding along.
    fn table_value(&mut self, origin: &BindingOrigin) -> ResolvedExport {
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
    fn bag_value(&mut self, file: &ModuleKey, name: &str) -> ResolvedExport {
        match self.graph.loader_mut().bag_mut(file) {
            Some(bag) => bag_export(bag, name),
            None => ResolvedExport::default(),
        }
    }
}
