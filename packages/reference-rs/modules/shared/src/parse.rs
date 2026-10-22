//! The nesting gate in front of every Oxc parse in reference-rs.
//! A source nested past `MAX_NESTING` is refused before Oxc sees it, because Oxc recurses once per level and a hostile
//! file overflows a native stack. `parse_bounded` takes an allocator, a source and its `SourceType`, and returns Oxc's
//! `ParserReturn`, or a `NestingRefusal` naming the depth and the line where the limit was crossed. `refused_parser_return`
//! gives a caller Oxc's failed-parse shape for a refused source, so each module attaches its own located error. The
//! pre-scan lives in `parse/scan.rs`, and this file is the one place that calls `Parser::new`.

mod scan;

#[cfg(test)]
mod tests;

use oxc_allocator::Allocator;
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;

/// The deepest bracket nesting a source may reach. Real sources nest at most 131 levels (prettier's bundle), and Oxc
/// overflows a 2 MiB stack near 1,300 levels, so this bound leaves margin on both sides.
pub const MAX_NESTING: usize = 1024;

/// A source the pre-scan refused: the depth it reached and the 1-based line where the limit was crossed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NestingRefusal {
    pub depth: usize,
    pub line: u32,
}

impl NestingRefusal {
    /// The sentence every module reports for a refused source; the file it came from locates it.
    pub fn message(&self) -> String {
        format!("nesting deeper than {MAX_NESTING} levels at line {}", self.line)
    }
}

/// Parses `source` when its nesting is within `MAX_NESTING`. A deeper source is refused and never handed to Oxc.
pub fn parse_bounded<'a>(
    allocator: &'a Allocator,
    source: &'a str,
    source_type: SourceType,
) -> Result<ParserReturn<'a>, NestingRefusal> {
    scan_nesting(source, source_type)?;
    Ok(Parser::new(allocator, source, source_type).parse())
}

/// Returns the deepest nesting `source` reaches, or the refusal when it passes `MAX_NESTING`. Linear in the source.
pub fn scan_nesting(source: &str, source_type: SourceType) -> Result<usize, NestingRefusal> {
    scan::Scan::new(source.as_bytes(), source_type.is_typescript()).run()
}

/// Oxc's failed-parse shape for a refused source: the empty program Oxc gives for empty text, with `panicked` set and
/// no errors. Oxc parses only that empty text, so the refused source is never parsed; the caller attaches its located error.
pub fn refused_parser_return<'a>(allocator: &'a Allocator, source_type: SourceType) -> ParserReturn<'a> {
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
