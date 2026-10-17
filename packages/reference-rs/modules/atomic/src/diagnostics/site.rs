//! Source and site identity for compiler diagnostics, plus owned locations.
//!
//! A [`SourceSite`] names one author position (source id, span, surface,
//! property, conditions) without borrowing AST or phase state, so facts can
//! outlive the pass that reported them. [`DiagnosticLocation`] is the owned
//! file/line/column form rendered on the wire; [`line_col`] resolves byte
//! offsets to 1-based UTF-16 positions matching editor carets.

use oxc_span::Span;
use serde::{Deserialize, Serialize};

use super::{Diagnostic, DiagnosticCode};
use diagnostics::ByteSpan;

/// Opaque identity for one compile input within a [`DiagnosticsSession`](super::DiagnosticsSession).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SourceId(pub u32);

/// The authored surface a diagnostic site belongs to. Policy needs the site,
/// not just the code: one legacy code can be userspace on one surface and
/// compiler-only on another (ledger "one code, two verdicts").
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StyleSurfaceKind {
    /// Imported `css()` style objects.
    Css,
    /// Traced JSX style props and JSX `css` objects.
    JsxStyle,
    /// `BaseSystem.static_css` entries.
    StaticCss,
    /// `BaseSystem.global_css` fragments.
    GlobalCss,
    /// `recipe()` tables (spec or extracted).
    Recipe,
    /// StyleTrace host discovery.
    Host,
}

/// One author location that can carry facts. Owns its data (`SourceId` plus a
/// copyable span); it never retains an Oxc node or borrows a phase context.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceSite {
    pub source: SourceId,
    pub span: Span,
    pub surface: StyleSurfaceKind,
    pub prop: Box<str>,
    pub when: Vec<Box<str>>,
}

/// Index from analysis [`SourceId`] back to path and text, so the
/// compiler channel can locate analysis facts that proof left unplaced.
/// Positions resolve against the compile's collected sources in `SourceId`
/// order; the catalog borrows them and outlives nothing.
pub struct SourceCatalog<'a> {
    sources: Vec<(&'a str, &'a str)>,
}

impl<'a> SourceCatalog<'a> {
    /// One `(path, content)` pair per [`SourceId`] index, in compile order.
    pub fn new(sources: Vec<(&'a str, &'a str)>) -> Self {
        Self { sources }
    }

    /// The file position of one analysis span: file plus 1-based line/column
    /// of the span start plus the byte offsets themselves. Unknown ids and
    /// unresolvable offsets fall back to an honest unlocated position; the
    /// line is never skipped.
    pub fn locate(&self, source: SourceId, span: Span) -> DiagnosticLocation {
        let Some((path, content)) = self.sources.get(source.0 as usize) else {
            return DiagnosticLocation::default();
        };
        let Some((line, column)) = line_col(content, span.start) else {
            return DiagnosticLocation::default();
        };
        DiagnosticLocation {
            file: Some((*path).to_string()),
            line: Some(line),
            column: Some(column),
            span: Some(byte_span(span)),
        }
    }
}

/// File/line/column plus byte offsets carried from extract to resolve for located diagnostics.
/// Extract populates it from literal spans; resolve attaches it to warnings
/// and errors. Empty when the want was synthesized rather than authored in
/// source (harvest, static CSS, plan rebuilds), in which case the diagnostic
/// stays unlocated exactly as before.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct DiagnosticLocation {
    pub file: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub span: Option<ByteSpan>,
}

impl DiagnosticLocation {
    /// Build an error diagnostic carrying this location, when known.
    pub fn error(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        self.with_severity(Diagnostic::error(code, message))
    }

    /// Build a warning diagnostic carrying this location, when known.
    pub fn warning(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        self.with_severity(Diagnostic::warning(code, message))
    }

    /// Build an info diagnostic carrying this location, when known.
    pub fn info(&self, code: DiagnosticCode, message: impl Into<String>) -> Diagnostic {
        self.with_severity(Diagnostic::info(code, message))
    }

    fn with_severity(&self, mut diagnostic: Diagnostic) -> Diagnostic {
        if let Some(file) = &self.file {
            diagnostic.file = Some(file.clone());
            diagnostic.line = self.line;
            diagnostic.column = self.column;
            diagnostic.span = self.span;
        }
        diagnostic
    }
}

/// The template span for one Oxc span: byte offsets copied verbatim, no line math.
/// Oxc spans are ordered by construction, so the literal is infallible; reversed
/// ranges from anywhere else still refuse at the template's wire boundary.
pub fn byte_span(span: Span) -> ByteSpan {
    ByteSpan {
        start: span.start,
        end: span.end,
    }
}

/// 1-based (line, column) for a byte offset, or None past the end.
/// Columns count UTF-16 code units so positions match editor carets.
pub fn line_col(source: &str, offset: u32) -> Option<(u32, u32)> {
    let prefix = source.get(..offset as usize)?;
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count() as u32 + 1;
    let tail = prefix.rsplit('\n').next().unwrap_or(prefix);
    let column = tail.chars().map(|ch| ch.len_utf16() as u32).sum::<u32>() + 1;
    Some((line, column))
}

/// Line-start table for one file: the byte offset where each line begins.
/// One O(file) build replaces one O(offset) scan per lookup, so per-want
/// positions drop to a binary search plus the UTF-16 tail walk. Results
/// are identical to [`line_col`]; the fuzz below pins offset-for-offset
/// equivalence, including past-end and mid-character offsets.
#[derive(Debug, Clone)]
pub struct LineIndex {
    starts: Vec<u32>,
}

impl LineIndex {
    /// Record the byte after every newline in a single pass.
    pub fn for_source(source: &str) -> Self {
        let mut starts = vec![0u32];
        for (index, byte) in source.bytes().enumerate() {
            if byte == b'\n' {
                starts.push(index as u32 + 1);
            }
        }
        Self { starts }
    }

    /// 1-based (line, column) for a byte offset, or None past the end.
    /// The binary search finds the line; the tail walk counts UTF-16
    /// units exactly as [`line_col`]; non-boundary offsets reject.
    /// ASCII tails skip the walk: every byte is one UTF-16 unit, so the
    /// column is the tail length. The word scan is exact; anything with a
    /// high bit falls through to the walk unchanged.
    pub fn line_col(&self, source: &str, offset: u32) -> Option<(u32, u32)> {
        let end = offset as usize;
        if end > source.len() || !source.is_char_boundary(end) {
            return None;
        }
        let line = self.starts.partition_point(|start| *start <= offset);
        let start = self.starts[line - 1] as usize;
        if tail_is_ascii(&source.as_bytes()[start..end]) {
            return Some((line as u32, (end - start) as u32 + 1));
        }
        let tail = source.get(start..end)?;
        let column = tail.chars().map(|ch| ch.len_utf16() as u32).sum::<u32>() + 1;
        Some((line as u32, column))
    }
}

/// True when no byte has the high bit: one AND per 8-byte word plus the
/// scalar remainder. Early-exits on the first non-ASCII word; the copy
/// keeps the word load alignment-safe and optimizes to one unaligned read.
fn tail_is_ascii(tail: &[u8]) -> bool {
    const HIGH_BITS: u64 = 0x8080_8080_8080_8080;
    let mut chunks = tail.chunks_exact(8);
    for chunk in &mut chunks {
        let mut word = [0u8; 8];
        word.copy_from_slice(chunk);
        if u64::from_ne_bytes(word) & HIGH_BITS != 0 {
            return false;
        }
    }
    chunks.remainder().iter().all(|byte| *byte < 0x80)
}

#[cfg(test)]
mod tests;
