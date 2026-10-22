//! The pre-scan's stack of open constructs. Each entry is one level, JSX elements included, and a refusal is raised the
//! moment the stack passes `MAX_NESTING`. A closer pops down to its own kind, and a comparison's leftover generic is
//! dropped at `;` and at a closing bracket; a `>` that is part of `=>` does not close a generic.

use super::{NestingRefusal, Open, Scan};
use crate::parse::MAX_NESTING;

impl Scan<'_> {
    /// Pushes one open construct; the refusal names the line where the stack first passes `MAX_NESTING`.
    pub(super) fn open(&mut self, open: Open, next: usize) -> Result<usize, NestingRefusal> {
        self.stack.push(open);
        self.counts[open.index()] += 1;
        self.deepest = self.deepest.max(self.stack.len());
        if self.stack.len() > MAX_NESTING {
            return Err(NestingRefusal {
                depth: self.stack.len(),
                line: self.line,
            });
        }
        Ok(next)
    }

    /// Pops down to and including the topmost opener of `open`'s kind; a closer with no such opener is ignored.
    pub(super) fn close(&mut self, open: Open) {
        if self.counts[open.index()] == 0 {
            return;
        }
        if let Some(pos) = self.stack.iter().rposition(|top| *top == open) {
            self.truncate_to(pos);
        }
    }

    /// Closes the topmost brace or template expression. Returns true when that was a template expression, so the
    /// caller resumes the template's text.
    pub(super) fn close_brace(&mut self) -> bool {
        let braces = self.counts[Open::Brace.index()] + self.counts[Open::TemplateExpr.index()];
        if braces == 0 {
            return false;
        }
        let Some(pos) = self
            .stack
            .iter()
            .rposition(|top| matches!(top, Open::Brace | Open::TemplateExpr))
        else {
            return false;
        };
        let template = self.stack[pos] == Open::TemplateExpr;
        self.truncate_to(pos);
        template
    }

    fn truncate_to(&mut self, pos: usize) {
        for open in self.stack.drain(pos..) {
            self.counts[open.index()] -= 1;
        }
    }

    /// Removes the top construct. The caller has checked that the stack is not empty.
    pub(super) fn pop(&mut self) {
        if let Some(open) = self.stack.pop() {
            self.counts[open.index()] -= 1;
        }
    }

    /// A `>` closes the generic it sits in only when that generic is the innermost open construct.
    fn drop_angle(&mut self) {
        if self.stack.last() == Some(&Open::Angle) {
            self.pop();
        }
    }

    /// A `>` closes a generic unless it is the `>` of an arrow (`=>`), which a generic's function type may contain.
    pub(super) fn drop_angle_unless_arrow(&mut self, at: usize) {
        if !self.preceded_by(at, b'=') {
            self.drop_angle();
        }
    }

    /// A `;` cannot sit inside a generic, so any generic still open is a comparison that never closed.
    pub(super) fn drop_angles(&mut self) {
        while self.stack.last() == Some(&Open::Angle) {
            self.pop();
        }
    }
}
