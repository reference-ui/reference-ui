//! Transient streaming for byte-gated files: ordered constants, error
//! replay, and parse slots. Takes the gathered sources plus the retained
//! parse and emits staged streamed records, per-source parse errors, and
//! the merged project constants. Retained files merge from the shared
//! parse; streamed files parse transiently and drop program+allocator
//! after staging, so arenas are never co-resident for streamed files.

use oxc_allocator::Allocator;
use oxc_diagnostics::OxcDiagnostic;
use oxc_parser::ParserReturn;

use crate::diagnostics::{Diagnostic, DiagnosticCode};
use crate::extract::constants::{self, LocalConstants};
use crate::extract::resolver::{RetainedSource, StreamedSource};
use crate::parse_source;

/// Per-source parse slot: retained programs index the shared parse vec,
/// streamed files carry only flags (programs never co-resident).
pub(crate) struct SourceSlot {
    /// Position in the retained parse vec (retained files only).
    pub(crate) parsed: Option<usize>,
    /// True when the file streams (bytes gate).
    pub(crate) streamed: bool,
    /// True when the file's parse panicked (mirrored for streamed).
    pub(crate) panicked: bool,
}

impl SourceSlot {
    /// A fresh slot: unparsed, with the stream gate decided.
    pub(crate) fn new(streamed: bool) -> Self {
        Self {
            parsed: None,
            streamed,
            panicked: false,
        }
    }
}

/// Transient outcomes of the ordered constants pass: staged streamed
/// records+bags plus per-source parse errors (message + label offset).
pub(crate) struct TransientOut {
    pub(crate) staged: Vec<StreamedSource>,
    pub(crate) errors: Vec<Vec<(String, Option<u32>)>>,
}

/// Merge project constants in source order, staging streamed files along
/// the way: each streamed file parses transiently, records its errors,
/// merges its constants at its position, and stages its record+bag before
/// its program+allocator drop. Retained files merge from the shared parse.
pub(crate) fn merge_constants_ordered(
    sources: &[(String, String)],
    parsed: &[ParserReturn<'_>],
    slots: &mut [SourceSlot],
    project: &mut LocalConstants,
) -> TransientOut {
    let mut walk = ConstantsWalk {
        sources,
        parsed,
        slots,
        project,
        staged: Vec::new(),
        errors: vec![Vec::new(); sources.len()],
    };
    walk.run();
    TransientOut {
        staged: walk.staged,
        errors: walk.errors,
    }
}

/// One parse error as replay data: the rendered message plus the first
/// label offset, the only inputs the reporter reads.
pub(crate) fn replay_parse_error(err: &OxcDiagnostic) -> (String, Option<u32>) {
    let offset = err
        .labels
        .as_ref()
        .and_then(|labels| labels.first())
        .map(|label| label.offset() as u32);
    (err.to_string(), offset)
}

/// Context for the ordered constants walk: shared inputs plus accumulators.
struct ConstantsWalk<'a> {
    sources: &'a [(String, String)],
    parsed: &'a [ParserReturn<'a>],
    slots: &'a mut [SourceSlot],
    project: &'a mut LocalConstants,
    staged: Vec<StreamedSource>,
    errors: Vec<Vec<(String, Option<u32>)>>,
}

impl ConstantsWalk<'_> {
    /// Walk every source in order, merging retained constants and staging
    /// streamed files; errors record for retained and streamed alike.
    fn run(&mut self) {
        for index in 0..self.sources.len() {
            if self.slots[index].streamed {
                self.stage_streamed(index);
            } else {
                self.merge_retained(index);
            }
        }
    }

    /// Merge one retained file's constants from the shared parse, if it
    /// parsed; its errors record whether or not it panicked.
    fn merge_retained(&mut self, index: usize) {
        let Some(position) = self.slots[index].parsed else {
            return;
        };
        let (path, content) = &self.sources[index];
        self.errors[index] = self.parsed[position]
            .errors
            .iter()
            .map(replay_parse_error)
            .collect();
        if self.slots[index].panicked {
            return;
        }
        let file_constants = constants::collect_local_constants(
            &self.parsed[position].program,
            path,
            Some(content.as_str()),
        );
        self.project.merge(&file_constants);
    }

    /// Parse one streamed file transiently: record its errors, mirror its
    /// panicked flag, and (when it parsed) merge its constants plus stage
    /// its record+bag before program+allocator drop.
    fn stage_streamed(&mut self, index: usize) {
        let (path, content) = &self.sources[index];
        let allocator = Allocator::default();
        let ret = parse_source(path, content, &allocator);
        self.slots[index].panicked = ret.panicked;
        self.errors[index] = ret.errors.iter().map(replay_parse_error).collect();
        if ret.panicked {
            return;
        }
        let bag =
            constants::collect_local_constants(&ret.program, path, Some(content.as_str()));
        self.project.merge(&bag);
        self.staged
            .push(StreamedSource::with_bag(&ret.program, path, bag));
    }
}

/// Borrowed parses of the unpanicked retained files for graph staging.
/// Panicked files stay out, so imports targeting them refuse like any
/// unresolvable specifier.
pub(crate) fn live_retained_sources<'a>(
    sources: &'a [(String, String)],
    parsed: &'a [ParserReturn<'a>],
    retained: &[usize],
    slots: &[SourceSlot],
) -> Vec<RetainedSource<'a>> {
    retained
        .iter()
        .filter(|&&i| !slots[i].panicked)
        .filter_map(|&i| {
            slots[i].parsed.map(|position| RetainedSource {
                path: sources[i].0.as_str(),
                content: sources[i].1.as_str(),
                program: &parsed[position].program,
            })
        })
        .collect()
}

/// Source indexes that parsed, in input order: the partition catalog and
/// the analysis entry order agree on exactly this sequence.
pub(crate) fn unpanicked_index(slots: &[SourceSlot]) -> Vec<usize> {
    slots
        .iter()
        .enumerate()
        .filter(|(_, slot)| !slot.panicked)
        .map(|(index, _)| index)
        .collect()
}

/// Report every source's parse errors, in source order, from the replayed
/// pairs the constants pass recorded for retained and streamed alike.
pub(crate) fn report_parse_errors(
    sources: &[(String, String)],
    errors: &[Vec<(String, Option<u32>)>],
    diagnostics: &mut Vec<Diagnostic>,
) {
    for ((path, content), file_errors) in sources.iter().zip(errors.iter()) {
        for replay in file_errors {
            push_parse_error(diagnostics, path, content, replay);
        }
    }
}

/// Push one located parse error diagnostic from its replayed pair.
fn push_parse_error(
    diagnostics: &mut Vec<Diagnostic>,
    path: &str,
    content: &str,
    replay: &(String, Option<u32>),
) {
    let (message, offset) = replay;
    let (line, column) = offset
        .and_then(|start| crate::diagnostics::line_col(content, start))
        .unzip();
    diagnostics.push(
        Diagnostic::error(DiagnosticCode::ParseError, message.to_string())
            .with_location(path, line, column),
    );
}
