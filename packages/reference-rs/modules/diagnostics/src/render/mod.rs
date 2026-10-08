//! Deterministic code-frame renderer for human presentation of typed diagnostics.
//! Takes a validated [`Diagnostic`] plus the source text it was recorded against and emits a rustc-grade
//! frame: a `severity[CODE]: subject` header, a `file:line:col` arrow, guttered source lines with caret
//! underlines, labeled notes, and `= help:` lines. Rendering is byte-identical per input — the same
//! diagnostic plus the same source always yields the same bytes — and total: anything unresolvable (no file,
//! no spans, dangling offsets) reports `None` so the caller falls back to a one-liner instead of guessing.
//! Columns count UTF-16 code units to match editor carets and the neo resolver; tabs print raw with no
//! expansion so bytes stay deterministic. Consecutive touched lines render back-to-back; each later run of
//! lines opens its own arrow. Labels keep producer order; multi-line underlines note their first row only.

use crate::diagnostic::Diagnostic;

mod emit;

/// Default cap for [`render_batch`]: the first eight diagnostics get full frames while the rest stay
/// one-liners, so a pathological run with thousands of warnings still prints a screenful plus a tight list.
pub const MAX_FRAMES: usize = 8;

/// Render one diagnostic as a full code frame, or `None` when no frame is honest.
/// Needs the file plus at least one span (the primary span or a label), with every offset inside `source`
/// and on a character boundary; anything else falls back to [`render_one_line`].
pub fn render_frame(diagnostic: &Diagnostic, source: &str) -> Option<String> {
    Frame::build(diagnostic, source)?.emit()
}

/// Render `{file}:{line}:{col} {code} {subject}` for one-line display, mirroring the js mirror exactly.
/// Uses the stored line and column only; unlocated diagnostics print just `{code} {subject}`.
pub fn render_one_line(diagnostic: &Diagnostic) -> String {
    let subject = subject(diagnostic);
    match (
        diagnostic.file.as_deref(),
        diagnostic.line,
        diagnostic.column,
    ) {
        (Some(file), Some(line), Some(column)) => {
            format!("{file}:{line}:{column} {} {subject}", diagnostic.code.as_str())
        }
        (Some(file), _, _) => format!("{file} {} {subject}", diagnostic.code.as_str()),
        (None, _, _) => format!("{} {subject}", diagnostic.code.as_str()),
    }
}

/// Render a batch with capped frames: the first `max_frames` frameable diagnostics get full frames while
/// the rest stay one-liners. Reads each presented file lazily through `source_for` and only while frames
/// remain; missing sources and unresolvable spans fall back to one-liners. Blocks join with one newline.
pub fn render_batch(
    diagnostics: &[Diagnostic],
    source_for: &dyn Fn(&str) -> Option<String>,
    max_frames: usize,
) -> String {
    let mut framed = 0;
    let mut blocks = Vec::with_capacity(diagnostics.len());
    for diagnostic in diagnostics {
        blocks.push(render_block(diagnostic, source_for, &mut framed, max_frames));
    }
    blocks.join("\n")
}

/// One batch block: a full frame while frames remain, else the stored-position one-liner.
fn render_block(
    diagnostic: &Diagnostic,
    source_for: &dyn Fn(&str) -> Option<String>,
    framed: &mut usize,
    max_frames: usize,
) -> String {
    if let Some(frame) = try_frame(diagnostic, source_for, framed, max_frames) {
        return frame;
    }
    render_one_line(diagnostic)
}

/// A full frame for one batch row, spending the cap, or `None` for the one-liner fallback.
fn try_frame(
    diagnostic: &Diagnostic,
    source_for: &dyn Fn(&str) -> Option<String>,
    framed: &mut usize,
    max_frames: usize,
) -> Option<String> {
    if *framed >= max_frames {
        return None;
    }
    let file = diagnostic.file.as_deref()?;
    if diagnostic.span.is_none() && diagnostic.labels.is_none() {
        return None;
    }
    let source = source_for(file)?;
    let frame = render_frame(diagnostic, &source)?;
    *framed += 1;
    Some(frame)
}

/// One underline inside a frame: byte range plus the trailing note, if any. The primary span sorts first
/// by position in the collection, never by a flag; labels keep producer order after it.
struct Underline<'a> {
    start: usize,
    end: usize,
    note: Option<&'a str>,
}

/// One caret row placed on a source line: 1-based line and column plus the caret run.
struct CaretRow<'a> {
    line: usize,
    start_col: usize,
    width: usize,
    note: Option<&'a str>,
}

/// A resolved frame ready to emit: the diagnostic, its file, the line table, and every caret row
/// sorted by line with primary-first order kept stable within each line.
struct Frame<'a> {
    diagnostic: &'a Diagnostic,
    file: &'a str,
    starts: Vec<usize>,
    source: &'a str,
    rows: Vec<CaretRow<'a>>,
}

impl<'a> Frame<'a> {
    /// Resolve every underline against `source`, or `None` when no frame is honest.
    fn build(diagnostic: &'a Diagnostic, source: &'a str) -> Option<Self> {
        let file = diagnostic.file.as_deref()?;
        let underlines = collect_underlines(diagnostic, source)?;
        let starts = line_starts(source);
        let mut rows = Vec::new();
        for underline in &underlines {
            place_rows(underline, &starts, source, &mut rows)?;
        }
        rows.sort_by_key(|row| row.line);
        Some(Self {
            diagnostic,
            file,
            starts,
            source,
            rows,
        })
    }

    /// Emit the header, the arrowed gutter blocks, and the help lines as one newline-joined frame.
    fn emit(&self) -> Option<String> {
        let width = self.rows.iter().map(|row| digits(row.line)).max()?;
        emit::emit_frame(self, width)
    }
}

/// Collect the primary span plus every label as byte underlines, refusing dangling offsets. Empty and
/// missing spans both report `None`: without an underline there is no frame to draw.
fn collect_underlines<'a>(diagnostic: &'a Diagnostic, source: &str) -> Option<Vec<Underline<'a>>> {
    let mut underlines = Vec::new();
    if let Some(span) = diagnostic.span {
        underlines.push(Underline {
            start: span.start as usize,
            end: span.end as usize,
            note: None,
        });
    }
    if let Some(labels) = &diagnostic.labels {
        for label in labels {
            underlines.push(Underline {
                start: label.span.start as usize,
                end: label.span.end as usize,
                note: Some(label.message.as_str()),
            });
        }
    }
    for underline in &underlines {
        if underline.end > source.len()
            || !source.is_char_boundary(underline.start)
            || !source.is_char_boundary(underline.end)
        {
            return None;
        }
    }
    (!underlines.is_empty()).then_some(underlines)
}

/// One underline plus its resolved line range: the site caret rows are placed from.
/// The underline reference and line table borrow the transient build state (`'u`) while caret notes
/// borrow the diagnostic itself (`'n`), so placed rows outlive the build that placed them.
struct RowSite<'u, 'n> {
    underline: &'u Underline<'n>,
    starts: &'u [usize],
    source: &'u str,
    first: usize,
    last: usize,
}

impl<'u, 'n> RowSite<'u, 'n> {
    /// One caret row for a touched line: the covered columns, or the covered portion of a multi-line
    /// underline. Empty portions still draw one caret; the note rides the underline's first row only.
    fn caret_row(&self, line: usize) -> Option<CaretRow<'n>> {
        let start_col = if line == self.first {
            resolve(self.starts, self.source, self.underline.start)?.1
        } else {
            1
        };
        let end_col = if line == self.last {
            resolve(self.starts, self.source, self.underline.end)?.1
        } else {
            content_width(self.starts, self.source, line)? + 1
        };
        Some(CaretRow {
            line,
            start_col,
            width: end_col.saturating_sub(start_col).max(1),
            note: if line == self.first {
                self.underline.note
            } else {
                None
            },
        })
    }
}

/// Place one caret row per touched line of an underline.
fn place_rows<'u, 'n>(
    underline: &'u Underline<'n>,
    starts: &'u [usize],
    source: &'u str,
    rows: &mut Vec<CaretRow<'n>>,
) -> Option<()> {
    let (first, _) = resolve(starts, source, underline.start)?;
    let site = RowSite {
        underline,
        starts,
        source,
        first,
        last: last_touched_line(underline, starts, source, first)?,
    };
    for line in site.first..=site.last {
        rows.push(site.caret_row(line)?);
    }
    Some(())
}

/// The last line an underline touches: its own line for points, else the end line, pulled back one when
/// the exclusive end lands exactly on a line start (which that line never covers).
fn last_touched_line(
    underline: &Underline<'_>,
    starts: &[usize],
    source: &str,
    first_line: usize,
) -> Option<usize> {
    if underline.end == underline.start {
        return Some(first_line);
    }
    let (end_line, _) = resolve(starts, source, underline.end)?;
    if underline.end == starts[end_line - 1] {
        Some((end_line - 1).max(first_line))
    } else {
        Some(end_line)
    }
}

/// Byte offsets of every line start: zero plus the byte after each newline, in one pass.
fn line_starts(source: &str) -> Vec<usize> {
    let mut starts = vec![0];
    for (index, byte) in source.bytes().enumerate() {
        if byte == b'\n' {
            starts.push(index + 1);
        }
    }
    starts
}

/// The 1-based line and UTF-16 column for a byte offset, or `None` past the end or mid-character.
fn resolve(starts: &[usize], source: &str, offset: usize) -> Option<(usize, usize)> {
    if offset > source.len() || !source.is_char_boundary(offset) {
        return None;
    }
    let line = starts.partition_point(|&start| start <= offset);
    let prefix = source.get(starts[line - 1]..offset)?;
    let column = prefix.chars().map(|c| c.len_utf16()).sum::<usize>() + 1;
    Some((line, column))
}

/// One source line without its newline and carriage return, or `None` for an unknown line.
fn line_text<'a>(starts: &[usize], source: &'a str, line: usize) -> Option<&'a str> {
    let start = *starts.get(line - 1)?;
    let end = starts.get(line).map_or(source.len(), |next| next - 1);
    let text = source.get(start..end)?;
    Some(text.strip_suffix('\r').unwrap_or(text))
}

/// The UTF-16 width of one source line's content, for full-line middle portions of multi-line spans.
fn content_width(starts: &[usize], source: &str, line: usize) -> Option<usize> {
    let text = line_text(starts, source, line)?;
    Some(text.chars().map(|c| c.len_utf16()).sum())
}

/// The message's first line: the complete subject the header and one-liners print.
fn subject(diagnostic: &Diagnostic) -> &str {
    diagnostic.message.lines().next().unwrap_or("")
}

/// The lowercase severity word the frame header prints.
fn severity_word(diagnostic: &Diagnostic) -> &'static str {
    match diagnostic.severity {
        crate::diagnostic::Severity::Warning => "warning",
        crate::diagnostic::Severity::Error => "error",
    }
}

/// Decimal digits of a line number, for the gutter width.
fn digits(value: usize) -> usize {
    value.to_string().len()
}
