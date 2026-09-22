//! Owned records folded from one worker-local parse.
//!
//! The worker parses into its own allocator, folds constants, the module
//! record, the export map, the harvest pool, and the styletrace module,
//! then drops the tree only after the walk. Nothing here borrows an arena
//! across a thread. Each slot carries a typed state so a mid-record panic
//! can never merge half-filled: the mutex poisons, the state stays partial,
//! and the ordered merge refuses anything but complete.

use std::ops::{Deref, DerefMut};
use std::path::Path;
use std::sync::{Arc, Mutex, MutexGuard};

use oxc_parser::ParserReturn;
use rustc_hash::FxHashMap;

use crate::diagnostics::DiagnosticFact;
use crate::extract::constants::LocalConstants;
use crate::extract::harvest::HarvestPool;
use crate::extract::identity_map::{collect_map, ExportMap};
use crate::extract::resolver::ResolvedExport;
use crate::extract_parallel::FileOut;
use crate::stream;

use module_graph::ModuleRecord;

/// Where `record` stopped: the fold it was about to compute.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RecordStage {
    Errors,
    Constants,
    ModuleRecord,
    ExportMap,
    Harvest,
    Trace,
}

impl RecordStage {
    /// Short name for refused-slot diagnostics; order matches declaration.
    fn name(self) -> &'static str {
        const NAMES: [&str; 6] = ["errors", "constants", "module-record", "export-map", "harvest", "trace"];
        NAMES[self as usize]
    }

    /// Every stage in record order, for the panic-at-each-stage test.
    #[cfg(test)]
    pub(crate) fn all() -> [Self; 6] {
        [Self::Errors, Self::Constants, Self::ModuleRecord, Self::ExportMap, Self::Harvest, Self::Trace]
    }
}

/// Typed lifecycle of one slot. Failed covers parser panic, incomplete
/// record, and recovered poison; all three refuse with a diagnostic.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum SlotState {
    Empty,
    Partial { stage: RecordStage },
    Complete,
    ParserPanicked,
    Incomplete { stage: Option<RecordStage> },
    Poisoned { stage: Option<RecordStage> },
}

impl SlotState {
    /// Only complete slots merge; everything else refuses.
    fn is_mergeable(self) -> bool {
        matches!(self, Self::Complete)
    }

    /// The stage the slot stopped at, when it stopped mid-record.
    fn stopped_stage(self) -> Option<RecordStage> {
        match self {
            Self::Partial { stage } => Some(stage),
            Self::Incomplete { stage } | Self::Poisoned { stage } => stage,
            Self::Empty | Self::Complete | Self::ParserPanicked => None,
        }
    }
}

/// One source's owned products. Invariant: `state` is complete only when
/// every field below committed together; partial or failed never merges.
/// Arena-free by type: no lifetime, so no `Allocator` borrow or `Program`
/// reference can be stored here.
pub(crate) struct OwnedFile {
    pub panicked: bool,
    pub errors: Vec<(String, Option<u32>)>,
    pub constants: LocalConstants,
    pub record: Option<ModuleRecord>,
    pub export_map: Option<Arc<ExportMap>>,
    pub harvest: HarvestPool,
    pub import_refs: Vec<crate::extract::scope::ImportRef>,
    pub values: FxHashMap<String, ResolvedExport>,
    pub extracted: Option<FileOut>,
    pub analysis: Vec<DiagnosticFact>,
    pub trace: Option<styletrace::TraceModule>,
    pub state: SlotState,
}

/// Slots cross threads behind `Mutex`, so the payload must be `Send` and `'static`.
const _: fn() = || {
    fn send<T: Send>() {}
    fn owned<T: 'static>() {}
    send::<OwnedFile>();
    owned::<OwnedFile>();
};

impl OwnedFile {
    /// A blank slot, filled when the worker parses this index.
    pub(crate) fn blank() -> Self {
        Self {
            panicked: false,
            errors: Vec::new(),
            constants: LocalConstants::new(),
            record: None,
            export_map: None,
            harvest: HarvestPool::default(),
            import_refs: Vec::new(),
            values: FxHashMap::default(),
            extracted: None,
            analysis: Vec::new(),
            trace: None,
            state: SlotState::Empty,
        }
    }

    /// Only complete, unpanicked slots merge into the ordered project.
    pub(crate) fn is_mergeable(&self) -> bool {
        !self.panicked && self.state.is_mergeable()
    }

    /// Refuse anything but complete with one synthetic error behind.
    pub(crate) fn ensure_mergeable(&mut self) {
        if self.is_mergeable() {
            return;
        }
        if !matches!(self.state, SlotState::Empty | SlotState::Partial { .. }) {
            self.panicked = true;
            return;
        }
        let stage = self.state.stopped_stage();
        self.state = SlotState::Incomplete { stage };
        self.panicked = true;
        self.push_refused_error("incomplete", stage);
    }

    /// Record that `record` reached this fold.
    fn mark_partial(&mut self, stage: RecordStage) {
        self.state = SlotState::Partial { stage };
    }

    /// Commit a parser-panicked parse: errors kept, nothing else folded.
    fn commit_panicked(&mut self, errors: Vec<(String, Option<u32>)>) {
        self.panicked = true;
        self.errors = errors;
        self.state = SlotState::ParserPanicked;
    }

    /// Commit a fully folded record in one step.
    fn commit_fold(&mut self, fold: RecordedFold) {
        self.panicked = false;
        self.errors = fold.errors;
        self.constants = fold.constants;
        self.record = Some(fold.record);
        self.export_map = Some(fold.export_map);
        if let Some(pool) = fold.harvest {
            self.harvest = pool;
        }
        self.trace = fold.trace;
        self.state = SlotState::Complete;
    }

    /// Mark a recovered-poison guard failed; idempotent for repeat locks.
    fn mark_poisoned(&mut self) {
        if !matches!(self.state, SlotState::Empty | SlotState::Partial { .. } | SlotState::Complete) {
            self.panicked = true;
            return;
        }
        let stage = self.state.stopped_stage();
        self.state = SlotState::Poisoned { stage };
        self.panicked = true;
        self.push_refused_error("poisoned", stage);
    }

    /// One synthetic replay error so `commit_outputs` reports the refusal.
    fn push_refused_error(&mut self, reason: &str, stage: Option<RecordStage>) {
        let at = stage.map_or("empty".to_string(), |s| s.name().to_string());
        self.errors.push((format!("parallel slot {reason} at {at}; treated as failed"), None));
    }
}

/// All products of one record, built locally then committed atomically.
struct RecordedFold {
    errors: Vec<(String, Option<u32>)>,
    constants: LocalConstants,
    record: ModuleRecord,
    export_map: Arc<ExportMap>,
    harvest: Option<HarvestPool>,
    trace: Option<styletrace::TraceModule>,
}

/// The parse a worker just produced, plus whether this file feeds harvest.
/// Lane-local only: it borrows the lane's parse, so it never crosses threads.
pub(crate) struct RecordIn<'a> {
    pub path: &'a str,
    pub content: &'a str,
    pub parsed: &'a ParserReturn<'a>,
    pub harvest: bool,
    pub trace_root: Option<&'a Path>,
    pub surface: &'a styletrace::StyleSurface,
}

/// Fold one parse into the slot. Each fold builds locally; the slot commits
/// once, so a mid-record panic leaves state partial with data untouched.
pub(crate) fn record(file: &mut OwnedFile, input: &RecordIn<'_>) {
    file.mark_partial(RecordStage::Errors);
    check_test_panic(RecordStage::Errors);
    let errors = fold_errors(input);
    if input.parsed.panicked {
        file.commit_panicked(errors);
        return;
    }
    let program = &input.parsed.program;
    file.mark_partial(RecordStage::Constants);
    check_test_panic(RecordStage::Constants);
    let constants = fold_constants(input, program);
    file.mark_partial(RecordStage::ModuleRecord);
    check_test_panic(RecordStage::ModuleRecord);
    let record = fold_module_record(program);
    file.mark_partial(RecordStage::ExportMap);
    check_test_panic(RecordStage::ExportMap);
    let export_map = fold_export_map(program);
    file.mark_partial(RecordStage::Harvest);
    check_test_panic(RecordStage::Harvest);
    let harvest = fold_harvest(input, program);
    file.mark_partial(RecordStage::Trace);
    check_test_panic(RecordStage::Trace);
    let trace = fold_trace(input, program);
    file.commit_fold(RecordedFold { errors, constants, record, export_map, harvest, trace });
}

/// Replay the parser errors for the ordered reporter.
fn fold_errors(input: &RecordIn<'_>) -> Vec<(String, Option<u32>)> {
    input.parsed.errors.iter().map(stream::replay_parse_error).collect()
}

/// Collect this file's constants while its program is still alive.
fn fold_constants(input: &RecordIn<'_>, program: &oxc_ast::ast::Program<'_>) -> LocalConstants {
    crate::extract::constants::collect_local_constants(program, input.path, Some(input.content))
}

/// Collect this file's module record for the ordered value graph.
fn fold_module_record(program: &oxc_ast::ast::Program<'_>) -> ModuleRecord {
    ModuleRecord::collect(program)
}

/// Collect this file's export surface for the ordered identity graph.
fn fold_export_map(program: &oxc_ast::ast::Program<'_>) -> Arc<ExportMap> {
    Arc::new(collect_map(program))
}

/// Collect this file's harvest pool, or nothing for streamed files.
fn fold_harvest(input: &RecordIn<'_>, program: &oxc_ast::ast::Program<'_>) -> Option<HarvestPool> {
    if input.harvest {
        Some(crate::extract::harvest::pool_for_program(program))
    } else {
        None
    }
}

/// Fold the trace module while the program is still alive.
fn fold_trace(input: &RecordIn<'_>, program: &oxc_ast::ast::Program<'_>) -> Option<styletrace::TraceModule> {
    let root = input.trace_root?;
    if !input.parsed.errors.is_empty() || crate::hosts::trace_skip(input.content) {
        return None;
    }
    let path = Path::new(input.path);
    styletrace::fold_trace_module(path, root, input.content, program, input.surface).ok()
}

/// Guard that remembers whether its mutex was poisoned.
pub(crate) struct SlotGuard<'a> {
    guard: MutexGuard<'a, OwnedFile>,
    recovered: bool,
}

impl SlotGuard<'_> {
    /// True when this lock reclaimed a poisoned slot.
    pub(crate) fn recovered(&self) -> bool {
        self.recovered
    }
}

impl Deref for SlotGuard<'_> {
    type Target = OwnedFile;
    fn deref(&self) -> &Self::Target {
        &self.guard
    }
}

impl DerefMut for SlotGuard<'_> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.guard
    }
}

/// Lock a slot, marking it failed when reclaiming a poisoned guard.
pub(crate) fn lock(mutex: &Mutex<OwnedFile>) -> SlotGuard<'_> {
    match mutex.lock() {
        Ok(guard) => SlotGuard { guard, recovered: false },
        Err(poison) => {
            let mut guard = poison.into_inner();
            guard.mark_poisoned();
            SlotGuard { guard, recovered: true }
        }
    }
}

/// Test hook: panic at one record stage to prove partial stays visible.
#[cfg(test)]
fn check_test_panic(stage: RecordStage) {
    if PANIC_AT_STAGE.with(|flag| flag.get() == Some(stage)) {
        panic!("injected record panic at {}", stage.name());
    }
}

/// Production has no injected panics.
#[cfg(not(test))]
fn check_test_panic(_stage: RecordStage) {}

/// Test hook setter so cross-module tests can inject one panic stage.
#[cfg(test)]
pub(crate) fn set_panic_at_stage(stage: Option<RecordStage>) {
    PANIC_AT_STAGE.with(|flag| flag.set(stage));
}

#[cfg(test)]
use std::cell::Cell;

#[cfg(test)]
std::thread_local! {
    static PANIC_AT_STAGE: Cell<Option<RecordStage>> = const { Cell::new(None) };
}
