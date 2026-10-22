//! Regex literals for the pre-scan.
//! A `/` where an expression can start opens a regex literal, which runs to the next `/` on its line that is neither escaped
//! nor inside a `[...]` class. The scan skips it whole, so a quote or a backtick inside it cannot open a string or a template
//! that hides what follows. A slash that finds no closing slash on its line is a division. Reading the body ahead is charged to
//! the scan's lookahead, so a source full of slashes that never close cannot make the scan quadratic.

use super::Scan;

impl Scan<'_> {
    /// The index just past the regex literal that starts at `at`, a `/`, or None when this slash is a division.
    pub(super) fn skip_regex(&self, at: usize) -> Option<usize> {
        if !self.starts_expression(at) {
            return None;
        }
        let allowed = self.lookahead.get();
        let from = at + 1;
        let body = self.src.get(from..)?;
        let body = &body[..body.len().min(allowed)];
        let (end, read) = regex_end(body);
        self.lookahead.set(allowed - read);
        end.map(|offset| from + offset)
    }
}

/// Reads a regex body: the offset just past its closing slash, if it has one, and how many bytes were read. A newline ends
/// the line without a closing slash, even behind a backslash, and a `/` inside a class does not close the regex.
fn regex_end(body: &[u8]) -> (Option<usize>, usize) {
    let mut class = false;
    let mut index = 0;
    while index < body.len() {
        let byte = body[index];
        match byte {
            b'\n' | b'\r' => return (None, index),
            b'\\' if escape_ends_line(body, index) => return (None, index),
            b'\\' => index += 1,
            b'/' if !class => return (Some(index + 1), index + 1),
            _ => class = in_class(class, byte),
        }
        index += 1;
    }
    (None, body.len())
}

/// Whether the backslash at `index` has no byte after it on its line to escape.
fn escape_ends_line(body: &[u8], index: usize) -> bool {
    matches!(body.get(index + 1), None | Some(b'\n' | b'\r'))
}

/// Whether the next byte is inside a `[...]` class, given whether the one before `byte` was and what `byte` is.
fn in_class(was: bool, byte: u8) -> bool {
    match byte {
        b'[' => true,
        b']' => false,
        _ => was,
    }
}
