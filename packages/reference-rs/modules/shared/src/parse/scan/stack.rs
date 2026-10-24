//! The pre-scan's stack of open constructs and the rule that counts them.
//! A bracket or a template `${` is one level the moment it opens, and the scan refuses once those levels pass `MAX_NESTING`.
//! A generic `<` and a JSX element are guesses until their closer is seen, so they sit on the stack without counting. Each frame
//! keeps the deepest nesting that closed inside it, and a generic or element that closes counts one level over that, so a
//! comparison or a misread tag that never closes costs nothing and a nest that does close is counted whole. The stack is capped
//! at `MAX_OPEN` frames, so an unclosed nest is refused too. A closer pops down to its own kind, and a frame it pops without
//! having closed it counts for itself only if it is a bracket.

use super::chains::Chains;
use super::{NestingRefusal, Open, Scan};
use crate::parse::{MAX_NESTING, MAX_OPEN};

/// One open construct: its kind, the line and byte offset it opened at, the deepest nesting that has closed inside it so far,
/// and the chain counters of the bracket level around it, which its closer restores.
#[derive(Clone, Copy)]
pub(super) struct Frame {
    pub(super) open: Open,
    pub(super) line: u32,
    pub(super) at: u32,
    pub(super) inner: u32,
    pub(super) saved: Chains,
}

impl Scan<'_> {
    pub(super) fn top(&self) -> Option<Open> {
        self.stack.last().map(|frame| frame.open)
    }

    /// How many brackets and template expressions are open: the levels that count before their closer.
    fn hard(&self) -> usize {
        [Open::Paren, Open::Bracket, Open::Brace, Open::TemplateExpr]
            .iter()
            .map(|open| self.counts[open.index()])
            .sum()
    }

    /// Opens a bracket or a template expression, which ends at `next`. It counts at once, and the refusal names the line it
    /// opened on.
    pub(super) fn open_hard(&mut self, open: Open, next: usize) -> Result<usize, NestingRefusal> {
        let width = if open == Open::TemplateExpr { 2 } else { 1 };
        self.push(open, next - width)?;
        let levels = self.hard();
        self.deepest = self.deepest.max(levels);
        if levels > MAX_NESTING {
            return Err(NestingRefusal {
                depth: levels,
                line: self.line,
            });
        }
        Ok(next)
    }

    /// Opens a generic or a JSX element whose `<` is at `at`. It counts only if its closer is seen.
    pub(super) fn open_soft(
        &mut self,
        open: Open,
        at: usize,
        next: usize,
    ) -> Result<usize, NestingRefusal> {
        self.push(open, at)?;
        Ok(next)
    }

    /// Pushes a frame for the construct that starts at `at`, on the current line.
    fn push(&mut self, open: Open, at: usize) -> Result<(), NestingRefusal> {
        let line = self.line;
        self.stack.push(Frame {
            open,
            line,
            at: at as u32,
            inner: 0,
            saved: self.chains,
        });
        if !open.is_soft() {
            self.end_chain_run();
        }
        self.counts[open.index()] += 1;
        #[cfg(test)]
        {
            self.peak = self.peak.max(self.stack.len());
        }
        if self.stack.len() > MAX_OPEN {
            return Err(NestingRefusal {
                depth: self.stack.len(),
                line,
            });
        }
        Ok(())
    }

    /// Removes the top frame, keeping the counts exact.
    pub(super) fn take_top(&mut self) -> Option<Frame> {
        let frame = self.stack.pop()?;
        self.counts[frame.open.index()] -= 1;
        if !frame.open.is_soft() {
            self.chains = frame.saved;
        }
        Some(frame)
    }

    /// Hands the nesting that closed inside a frame to the frame beneath it.
    pub(super) fn carry(&mut self, depth: u32) {
        if let Some(parent) = self.stack.last_mut() {
            parent.inner = parent.inner.max(depth);
        }
    }

    /// The closer of the generic or element on top was seen. It counts one level over the deepest nesting inside it, on top of
    /// the brackets open around it, and the refusal names the line it opened on.
    pub(super) fn confirm_top(&mut self) -> Result<(), NestingRefusal> {
        let Some(frame) = self.take_top() else {
            return Ok(());
        };
        let levels = self.hard() + 1 + frame.inner as usize;
        self.deepest = self.deepest.max(levels);
        if levels > MAX_NESTING {
            return Err(NestingRefusal {
                depth: levels,
                line: frame.line,
            });
        }
        self.carry(frame.inner + 1);
        Ok(())
    }

    /// Drops the generic or element on top without having seen its closer: it counts for nothing, but what closed inside
    /// it still counts.
    pub(super) fn drop_top(&mut self) {
        if let Some(frame) = self.take_top() {
            self.carry(frame.inner);
        }
    }

    /// Pops every frame above `pos` and the frame at `pos`. A bracket counts one level over what closed inside it, and a
    /// generic or element popped this way never closed, so it counts nothing.
    fn truncate_to(&mut self, pos: usize) {
        while self.stack.len() > pos {
            if let Some(frame) = self.take_top() {
                self.carry(frame.inner + u32::from(!frame.open.is_soft()));
            }
        }
    }

    /// Pops down to and including the topmost opener of `open`'s kind and returns where that opener was; a closer with no
    /// such opener is ignored.
    pub(super) fn close(&mut self, open: Open) -> Option<usize> {
        if self.counts[open.index()] == 0 {
            return None;
        }
        let pos = self.stack.iter().rposition(|frame| frame.open == open)?;
        let opened = self.stack[pos].at as usize;
        self.truncate_to(pos);
        Some(opened)
    }

    /// The position of the topmost brace or template expression on the stack, if there is one.
    fn topmost_brace(&self) -> Option<usize> {
        let braces = self.counts[Open::Brace.index()] + self.counts[Open::TemplateExpr.index()];
        if braces == 0 {
            return None;
        }
        self.stack
            .iter()
            .rposition(|frame| matches!(frame.open, Open::Brace | Open::TemplateExpr))
    }

    /// Closes the topmost brace or template expression with the `}` at `at`. Returns true when that was a template
    /// expression, so the caller resumes the template's text.
    pub(super) fn close_brace(&mut self, at: usize) -> bool {
        let Some(pos) = self.topmost_brace() else {
            self.note_brace(at, None);
            return false;
        };
        let frame = self.stack[pos];
        self.truncate_to(pos);
        self.note_brace(at, (frame.open == Open::Brace).then_some(frame.at as usize));
        frame.open == Open::TemplateExpr
    }

    /// Changes the kind of the frame on top, a change of kind with no change of depth.
    pub(super) fn retag_top(&mut self, to: Open) {
        if let Some(top) = self.stack.last_mut() {
            self.counts[top.open.index()] -= 1;
            self.counts[to.index()] += 1;
            top.open = to;
        }
    }

    /// A `>` closes the generic on top unless it is the `>` of an arrow (`=>`), which a generic's function type may contain.
    /// With no generic on top it closes an open type assertion instead.
    pub(super) fn close_angle_unless_arrow(&mut self, at: usize) -> Result<(), NestingRefusal> {
        if self.preceded_by(at, b'=') {
            return Ok(());
        }
        if self.top() == Some(Open::Angle) {
            return self.confirm_top();
        }
        self.close_assertion(at);
        Ok(())
    }

    /// A `;` cannot sit inside a generic, so any generic still open is a comparison that never closed.
    pub(super) fn drop_angles(&mut self) {
        while self.top() == Some(Open::Angle) {
            self.drop_top();
        }
    }
}
