//! Where an expression can start: whether a `<` opens a JSX element and whether a `/` opens a regex.
//! The test reads the nearest code before a byte: an operator, an opener, a separator, the start of the file or a keyword that
//! takes an operand means an expression starts, and an identifier, a closer or a string means the byte is a comparison, a
//! generic or a division. Whitespace and comments before the byte are skipped, and the scan notes each comment's span as it
//! passes it, so a comment between an operator and an element cannot hide the operator.

use super::{is_identifier_byte, Scan};

/// Keywords after which an expression starts, so a `<` right after one opens a JSX element (`return <div />`).
const EXPRESSION_KEYWORDS: &[&[u8]] = &[
    b"return",
    b"yield",
    b"await",
    b"typeof",
    b"void",
    b"delete",
    b"case",
    b"do",
    b"else",
    b"in",
    b"of",
    b"instanceof",
    b"throw",
    b"default",
];

impl Scan<'_> {
    /// Whether an expression can start at `at`, judged by the nearest code before it, comments and whitespace skipped.
    pub(super) fn starts_expression(&self, at: usize) -> bool {
        let end = self.code_end_before(at);
        if end == 0 {
            return true;
        }
        let before = self.src[end - 1];
        if is_identifier_byte(before) {
            return self.ends_with_keyword(end);
        }
        match before {
            b'(' | b'[' | b'{' | b',' | b'=' | b':' | b'?' | b';' | b'!' | b'&' | b'|' | b'+'
            | b'-' | b'*' | b'%' | b'~' | b'^' | b'}' => true,
            b'>' => self.preceded_by(end - 1, b'='),
            _ => false,
        }
    }

    /// The index just past the last code byte before `at`: whitespace is skipped, and so is the run of comments that ends
    /// there, when the scan noted one.
    fn code_end_before(&self, at: usize) -> usize {
        let end = self.space_start_before(at);
        if end > 0 && end == self.trivia.1 {
            return self.space_start_before(self.trivia.0);
        }
        end
    }

    /// The index where the whitespace run that ends at `at` begins.
    fn space_start_before(&self, at: usize) -> usize {
        let mut end = at;
        while end > 0 && self.src[end - 1].is_ascii_whitespace() {
            end -= 1;
        }
        end
    }

    /// Notes the comment that spans `start..end`. A comment that follows another with only whitespace between them extends the
    /// same run, so one jump back skips a chain of comments.
    pub(super) fn note_comment(&mut self, start: usize, end: usize) {
        let gap = self.space_start_before(start);
        let first = if gap > 0 && gap == self.trivia.1 {
            self.trivia.0
        } else {
            start
        };
        self.trivia = (first, end);
    }

    /// Whether the identifier that ends at `end` is a keyword that takes an operand. After a `.` it is a property name.
    fn ends_with_keyword(&self, end: usize) -> bool {
        let mut start = end;
        while start > 0 && is_identifier_byte(self.src[start - 1]) {
            start -= 1;
        }
        let after_dot = start > 0 && self.src[start - 1] == b'.';
        !after_dot && EXPRESSION_KEYWORDS.contains(&&self.src[start..end])
    }
}
