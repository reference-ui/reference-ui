//! Frame emission: resolved caret rows become guttered text. Takes a built [`Frame`] plus its gutter
//! width and emits the `severity[CODE]: subject` header, one arrowed gutter block per run of touched
//! lines, and the trailing `= help:` lines as a single newline-joined frame. Consecutive lines render
//! back-to-back under one arrow; each later run opens its own arrow at its first caret.

use super::{line_text, severity_word, subject, CaretRow, Frame};

/// Emit one resolved frame as newline-joined text, or `None` when a line goes missing.
pub(super) fn emit_frame(frame: &Frame, width: usize) -> Option<String> {
    let mut emitter = BlockEmitter {
        frame,
        width,
        pad: " ".repeat(width),
        lines: vec![header(frame)],
        previous: None,
    };
    emitter.emit_blocks()?;
    emitter.emit_help();
    Some(emitter.lines.join("\n"))
}

/// The `severity[CODE]: subject` first line.
fn header(frame: &Frame) -> String {
    format!(
        "{}[{}]: {}",
        severity_word(frame.diagnostic),
        frame.diagnostic.code.as_str(),
        subject(frame.diagnostic)
    )
}

/// One frame's line cursor: the gutter width, the lines emitted so far, and the previous block's line.
struct BlockEmitter<'a> {
    frame: &'a Frame<'a>,
    width: usize,
    pad: String,
    lines: Vec<String>,
    previous: Option<usize>,
}

impl BlockEmitter<'_> {
    /// Emit every gutter block in line order, grouping caret rows by their line.
    fn emit_blocks(&mut self) -> Option<()> {
        let frame = self.frame;
        let mut index = 0;
        while index < frame.rows.len() {
            let line = frame.rows[index].line;
            let count = frame.rows[index..]
                .iter()
                .take_while(|row| row.line == line)
                .count();
            self.emit_block(line, &frame.rows[index..index + count])?;
            self.previous = Some(line);
            index += count;
        }
        Some(())
    }

    /// Emit one gutter block: the run arrow unless consecutive, the source line, then caret rows.
    fn emit_block(&mut self, line: usize, group: &[CaretRow<'_>]) -> Option<()> {
        if let Some((arrow_line, arrow_col)) = arrow_for(line, group, self.previous) {
            self.lines
                .push(format!("  --> {}:{arrow_line}:{arrow_col}", self.frame.file));
        }
        let text = line_text(&self.frame.starts, self.frame.source, line)?;
        let width = self.width;
        self.lines.push(format!("{line:>width$} | {text}"));
        for row in group {
            self.lines.push(self.caret_row(row));
        }
        Some(())
    }

    /// One caret row: the gutter, the spaced carets, and the label note when present.
    fn caret_row(&self, row: &CaretRow<'_>) -> String {
        let mut caret = format!(
            "{} | {}{}",
            self.pad,
            " ".repeat(row.start_col - 1),
            "^".repeat(row.width)
        );
        if let Some(note) = row.note {
            caret.push(' ');
            caret.push_str(note);
        }
        caret
    }

    /// The trailing `= help:` lines, if any.
    fn emit_help(&mut self) {
        if let Some(help) = &self.frame.diagnostic.help {
            for line in help {
                self.lines.push(format!("{} = help: {line}", self.pad));
            }
        }
    }
}

/// The arrow position for a line block: the run's first caret for the first block and each later
/// non-consecutive run, and none for consecutive continuations of the current run.
fn arrow_for(line: usize, group: &[CaretRow<'_>], previous: Option<usize>) -> Option<(usize, usize)> {
    match previous {
        Some(prev) if line == prev + 1 => None,
        _ => Some((line, group.first()?.start_col)),
    }
}
