//! Reading a misread JSX element again as code.
//! In TSX the function type `<T>(x: T) => T` first reads as an element, and its text hides whatever it holds from the scan. JSX
//! text cannot hold a `>` or a `}`, so when the scan meets one among an element's children, or the source ends inside the
//! element, the element was never one. It is dropped, and when code surrounds it the text it swallowed is scanned again as code
//! from just past its `<`. The `<` is remembered, so the second pass never reopens it and nested misreads are not scanned again
//! at every level, and the bytes of the second pass are charged to the scan's lookahead.

use super::{Mode, Open, Scan};

impl Scan<'_> {
    /// The element on top proved to be no element at `at`, a stray `>` or `}` or the end of the source. It is dropped, and
    /// the scan goes on from `at`, or from just past the element's `<` when code surrounds it and the lookahead allows
    /// reading its text again.
    pub(super) fn end_misread_element(&mut self, at: usize) -> usize {
        let Some(frame) = self.take_top() else {
            return at;
        };
        let opened = frame.at as usize;
        self.proven.insert(opened);
        let swallowed = at.saturating_sub(opened + 1);
        if self.mode(false) == Mode::Code && self.spend_lookahead(swallowed) {
            self.line = frame.line;
            self.forget_behind();
            return opened + 1;
        }
        self.carry(frame.inner);
        at
    }

    /// At the end of the source, an element still open was never one. Returns where the scan goes on, if it does.
    pub(super) fn misread_at_end(&mut self, template: bool) -> Option<usize> {
        let open = matches!(self.top(), Some(Open::JsxTag | Open::JsxChildren));
        (open && !template).then(|| self.end_misread_element(self.src.len()))
    }

    /// Whether the `<` at `at` was already proven not to open an element.
    pub(super) fn is_proven(&self, at: usize) -> bool {
        !self.proven.is_empty() && self.proven.contains(&at)
    }

    /// Charges `bytes` to the lookahead, if that much is left.
    fn spend_lookahead(&self, bytes: usize) -> bool {
        let left = self.lookahead.get();
        if left < bytes {
            return false;
        }
        self.lookahead.set(left - bytes);
        true
    }
}
