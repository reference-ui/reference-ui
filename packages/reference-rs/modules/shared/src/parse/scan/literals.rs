//! The literals and comments the pre-scan reads past as opaque runs.
//! The runs are string literals, which end at their line when they never close, regex literals, block and line comments, and
//! backslash escapes. Each skip reports the newlines it covers, so a refusal names the line it is on, and no quote or
//! bracket inside a skipped run reaches the scan's state. Each comment's span is noted for the test of where an expression
//! starts.

use super::Scan;

impl Scan<'_> {
    /// Comments, string literals, regex literals and backslash escapes are opaque to the count; returns the index past them.
    pub(super) fn skip_literal(&mut self, at: usize) -> Option<usize> {
        match self.src[at] {
            b'/' => self.skip_comment(at).or_else(|| self.skip_regex(at)),
            quote @ (b'\'' | b'"') => Some(self.skip_string(at, quote)),
            b'\\' => Some(self.skip_escape(at)),
            _ => None,
        }
    }

    fn skip_comment(&mut self, at: usize) -> Option<usize> {
        match self.byte_at(at + 1) {
            Some(b'/') => Some(self.skip_line(at)),
            Some(b'*') => Some(self.skip_block(at)),
            _ => None,
        }
    }

    /// A backslash hides the byte after it, except a newline, which the caller must still count.
    pub(super) fn skip_escape(&self, at: usize) -> usize {
        if self.byte_at(at + 1) == Some(b'\n') {
            at + 1
        } else {
            at + 2
        }
    }

    /// Ends on the newline, which the main loop counts.
    pub(super) fn skip_line(&mut self, at: usize) -> usize {
        let end = self.src[at..]
            .iter()
            .position(|byte| *byte == b'\n')
            .map_or(self.src.len(), |offset| at + offset);
        self.note_comment(at, end);
        end
    }

    pub(super) fn skip_block(&mut self, at: usize) -> usize {
        let end = block_close(self.src, at + 2).map_or(self.src.len(), |found| found + 2);
        self.line += count_newlines(&self.src[at..end]);
        self.note_comment(at, end);
        end
    }

    /// Ends after the closing quote, or before a newline: an unterminated string never runs past its line.
    fn skip_string(&mut self, at: usize, quote: u8) -> usize {
        let end = string_end(self.src, at + 1, quote).min(self.src.len());
        self.line += count_newlines(&self.src[at..end]);
        end
    }
}

/// Counts the newlines in `bytes`, so the scan keeps its line through a skipped run.
pub(super) fn count_newlines(bytes: &[u8]) -> u32 {
    bytes.iter().filter(|byte| **byte == b'\n').count() as u32
}

/// Index just past the closing quote of a string whose body starts at `start`, or of the newline that ends it unterminated.
fn string_end(src: &[u8], start: usize, quote: u8) -> usize {
    let mut end = start;
    while end < src.len() {
        let byte = src[end];
        if byte == b'\n' {
            return end;
        }
        end += 1;
        if byte == b'\\' {
            end += 1;
        } else if byte == quote {
            return end;
        }
    }
    end
}

/// Index of the `*/` that closes a block comment, searching from `from`.
fn block_close(src: &[u8], from: usize) -> Option<usize> {
    src.get(from..)?
        .windows(2)
        .position(|pair| pair[0] == b'*' && pair[1] == b'/')
        .map(|offset| from + offset)
}
