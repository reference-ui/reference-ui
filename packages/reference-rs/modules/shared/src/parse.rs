//! The nesting gate in front of every Oxc parse in reference-rs.
//! A source nested past `MAX_NESTING` is refused before Oxc sees it, because Oxc recurses once per level and a hostile
//! file overflows a native stack. `parse_bounded` takes an allocator, a source and its `SourceType`, and returns Oxc's
//! `ParserReturn`, or a `NestingRefusal` naming the depth and the line where the limit was crossed. `refused_parser_return`
//! gives a caller Oxc's failed-parse shape for a refused source, so each module attaches its own located error. The
//! pre-scan lives in `parse/scan.rs` and the files beside it, and this file is the one place that calls `Parser::new`.
//! Two wider limits back the scan up, so a construct it misreads cannot let a pathological file through: no more than
//! `MAX_OPEN` constructs open at once, and no more than `MAX_RAW` brackets deep in a count that reads every byte as code.

mod scan;

#[cfg(test)]
mod tests;

use oxc_allocator::Allocator;
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;

/// The deepest nesting a source may reach. A survey of 126,840 real sources found none past 36 levels, bar a test fixture built
/// to sit just inside the bound, and Oxc overflows a 2 MiB stack near 1,300 levels, so this bound leaves margin on both sides.
pub const MAX_NESTING: usize = 1024;

/// The most constructs one source may hold open at once, counted or not: a generic or a JSX element that has not closed yet
/// is on the stack without counting toward `MAX_NESTING`, and this bound refuses an unclosed nest of them. It is eight times
/// the nesting limit, far under the tens of thousands of levels the 64 MiB production stacks hold. The same survey, bar that
/// fixture, found none with more than 822 open at once.
const MAX_OPEN: usize = 8 * MAX_NESTING;

/// The deepest raw bracket nesting a source may reach. The raw count reads every `(`, `[` and `{` as a bracket, strings,
/// comments and JSX text included, so it needs no lexing rule to be right. It backs the scan up and is eight times the limit.
const MAX_RAW: usize = 8 * MAX_NESTING;

/// A source the pre-scan refused: the depth it reached and the 1-based line where the limit was crossed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NestingRefusal {
    pub depth: usize,
    pub line: u32,
}

impl NestingRefusal {
    /// The sentence every module reports for a refused source. It names the line and says what to do; the file it
    /// came from locates it.
    pub fn message(&self) -> String {
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

/// The gate's verdict: Ok when `source` is within every bound, the refusal otherwise. It skips the scan for a source with
/// no more than `MAX_NESTING` opener bytes, because every counted level and every frame on the stack comes from one
/// opener byte (`(`, `[`, `{` or `<`), so such a source cannot reach a limit. It gives the same verdict as `scan_nesting`.
pub fn check_nesting(source: &str, source_type: SourceType) -> Result<(), NestingRefusal> {
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
