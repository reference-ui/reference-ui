//! The nesting gate in front of every Oxc parse in reference-rs.
//! A source nested past `MAX_NESTING` is refused before Oxc sees it, because Oxc recurses once per level and a deeply nested
//! file overflows a native stack. `parse_bounded` takes an allocator, a source and its `SourceType`, and returns Oxc's
//! `ParserReturn`, or a `NestingRefusal` naming the depth and the line where the limit was crossed. `refused_parser_return`
//! gives a caller Oxc's failed-parse shape for a refused source, so each module attaches its own located error. The
//! pre-scan lives in `parse/scan.rs` and the files beside it, and this file is the one place that calls `Parser::new`.
//! Two wider limits back the scan up, so a construct it misreads cannot let a pathological file through: no more than
//! `MAX_OPEN` constructs open at once, and no more than `MAX_RAW` brackets deep in a count that reads every byte as code. An
//! unbracketed chain Oxc recurses through (`!!!x`, `a ? b : c ? …`, `a => b => c`, `a = b = c`) is held to `MAX_OPEN` links.
//! `ScreenedSource` holds a source's text with the verdict the gate gave it, so a source read once is screened once: `screen`
//! runs the gate, and `parse_screened` parses the stored text or returns the stored refusal without a second scan.
//! `parse/README.md` says what the gate is for and what it leaves alone, including input crafted to defeat the lexer.

mod scan;

#[cfg(test)]
mod tests;

use std::sync::atomic::{AtomicU64, Ordering};

use oxc_allocator::Allocator;
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;

/// The deepest nesting a source may reach. A survey of 126,840 real sources found none past 36 levels, bar a test fixture built
/// to sit just inside the bound, and Oxc overflows a 2 MiB stack near 1,300 levels, so this bound leaves margin on both sides.
pub const MAX_NESTING: usize = 1024;

/// The most constructs one source may hold open at once, counted or not: a generic or a JSX element that has not closed yet
/// is on the stack without counting toward `MAX_NESTING`, and this bound refuses an unclosed nest of them. It is eight times
/// the nesting limit, far under the tens of thousands of levels the 64 MiB production stacks hold. The same survey, bar that
/// fixture, found none with more than 822 open at once. It also bounds the links of one unbracketed chain, which Oxc passes
/// at this length on 8 MiB or less.
const MAX_OPEN: usize = 8 * MAX_NESTING;

/// The deepest raw bracket nesting a source may reach. The raw count reads every `(`, `[` and `{` as a bracket, strings,
/// comments and JSX text included, so it needs no lexing rule to be right. It backs the scan up and is eight times the limit.
const MAX_RAW: usize = 8 * MAX_NESTING;

/// Every gate run this process has made, read by `gate_runs`. `check_nesting` adds one per call, so `parse_bounded` and
/// `ScreenedSource::screen` both count.
static GATE_RUNS: AtomicU64 = AtomicU64::new(0);

/// The bit that marks a chain refusal in `NestingRefusal::depth`, which keeps the struct's shape for every caller that
/// builds one by hand.
const CHAIN_BIT: usize = !(usize::MAX >> 1);

/// A source the pre-scan refused: the depth it reached and the 1-based line where the limit was crossed. A refusal for an
/// unbracketed chain (`NestingRefusal::chain`) carries its link count in `depth`, marked by the top bit.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NestingRefusal {
    pub depth: usize,
    pub line: u32,
}

impl NestingRefusal {
    /// The refusal for a chain of `links` operators that crossed `MAX_OPEN` on `line`.
    pub(crate) fn chain(links: usize, line: u32) -> Self {
        Self {
            depth: links | CHAIN_BIT,
            line,
        }
    }

    /// Whether this refusal is for an unbracketed chain, whose limit is `MAX_OPEN` links, not `MAX_NESTING` levels.
    pub fn is_chain(&self) -> bool {
        self.depth & CHAIN_BIT != 0
    }

    /// The sentence every module reports for a refused source. It names the line and says what to do; the file it
    /// came from locates it.
    pub fn message(&self) -> String {
        if self.is_chain() {
            return format!(
                "operator chain longer than {MAX_OPEN} links at line {}; split or flatten the long chain of operators",
                self.line
            );
        }
        format!(
            "nesting deeper than {MAX_NESTING} levels at line {}; split or flatten the deeply nested expression",
            self.line
        )
    }
}

/// Parses `source` when its nesting is within `MAX_NESTING`. A deeper source is refused and never handed to Oxc.
pub fn parse_bounded<'a>(
    allocator: &'a Allocator,
    source: &'a str,
    source_type: SourceType,
) -> Result<ParserReturn<'a>, NestingRefusal> {
    check_nesting(source, source_type)?;
    Ok(Parser::new(allocator, source, source_type).parse())
}

/// A source's text with the gate's verdict: `screen` runs the gate once and keeps the verdict beside the text, so every later
/// parse reads the verdict instead of scanning again. `empty` runs no gate, because "" cannot be refused.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScreenedSource {
    text: String,
    source_type: SourceType,
    verdict: Result<(), NestingRefusal>,
}

impl ScreenedSource {
    /// Holds `text` with the verdict of one `check_nesting` run.
    pub fn screen(text: String, source_type: SourceType) -> Self {
        let verdict = check_nesting(&text, source_type);
        Self {
            text,
            source_type,
            verdict,
        }
    }

    /// The empty source, which no bound refuses, so it costs no gate run.
    pub fn empty(source_type: SourceType) -> Self {
        Self {
            text: String::new(),
            source_type,
            verdict: Ok(()),
        }
    }

    pub fn as_str(&self) -> &str {
        &self.text
    }

    pub fn source_type(&self) -> SourceType {
        self.source_type
    }

    /// The refusal the gate gave this source, or `None` when it passed.
    pub fn refusal(&self) -> Option<NestingRefusal> {
        self.verdict.err()
    }
}

impl std::ops::Deref for ScreenedSource {
    type Target = str;

    fn deref(&self) -> &str {
        &self.text
    }
}

/// Oxc's parse of a passed source, or the stored refusal for a refused one. It never scans.
pub fn parse_screened<'a>(
    allocator: &'a Allocator,
    source: &'a ScreenedSource,
) -> Result<ParserReturn<'a>, NestingRefusal> {
    if let Some(refusal) = source.refusal() {
        return Err(refusal);
    }
    Ok(Parser::new(allocator, &source.text, source.source_type).parse())
}

/// The gate runs this process has made, one per `check_nesting` call, read `Relaxed`. A test that compares deltas must be the
/// only gate caller in its process, since other threads' gate runs land in the same window (`shared/tests/gate_runs.rs`).
#[doc(hidden)]
pub fn gate_runs() -> u64 {
    GATE_RUNS.load(Ordering::Relaxed)
}

/// The gate's verdict: Ok when `source` is within every bound, the refusal otherwise. It skips the scan for a source with
/// no more than `MAX_NESTING` opener bytes, because every counted level and every frame on the stack comes from one
/// opener byte (`(`, `[`, `{` or `<`), so such a source cannot reach a limit. It gives the same verdict as `scan_nesting`.
pub fn check_nesting(source: &str, source_type: SourceType) -> Result<(), NestingRefusal> {
    GATE_RUNS.fetch_add(1, Ordering::Relaxed);
    if !scan::can_refuse(source.as_bytes()) {
        return Ok(());
    }
    scan_nesting(source, source_type).map(|_| ())
}

/// Returns the deepest nesting `source` reaches, or the refusal when it passes `MAX_NESTING`, `MAX_OPEN` or `MAX_RAW`.
/// Linear in the source.
pub fn scan_nesting(source: &str, source_type: SourceType) -> Result<usize, NestingRefusal> {
    let bytes = source.as_bytes();
    let deepest =
        scan::Scan::new(bytes, source_type.is_typescript(), source_type.is_jsx()).run()?;
    scan::check_raw(bytes)?;
    Ok(deepest)
}

/// Oxc's failed-parse shape for a refused source: the empty program Oxc gives for empty text, with `panicked` set and
/// no errors. Oxc parses only that empty text, so the refused source is never parsed; the caller attaches its located error.
pub fn refused_parser_return<'a>(
    allocator: &'a Allocator,
    source_type: SourceType,
) -> ParserReturn<'a> {
    let mut parsed = Parser::new(allocator, "", source_type).parse();
    parsed.panicked = true;
    parsed
}

/// Byte offset where the 1-based `line` begins in `source`; line 1 begins at 0.
pub fn line_start(source: &str, line: u32) -> u32 {
    let before = line.saturating_sub(1) as usize;
    source
        .bytes()
        .enumerate()
        .filter(|(_, byte)| *byte == b'\n')
        .map(|(index, _)| index as u32 + 1)
        .take(before)
        .last()
        .unwrap_or(0)
}
