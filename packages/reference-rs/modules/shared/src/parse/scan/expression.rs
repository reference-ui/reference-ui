//! Where an expression can start: whether a `<` opens a JSX element and whether a `/` opens a regex.
//! The test reads the nearest code before a byte: an operator, an opener, a separator, the start of the file or a keyword that
//! takes an operand means an expression starts, and an identifier, a closer or a string means the byte is a comparison, a
//! generic or a division. Two closers need more: a `)` ends an expression unless it closes the head of an `if`, `while`, `for`
//! or `with`, and a `}` starts one unless it closes an object literal, which the opener's own position tells. Whitespace and
//! comments before the byte are skipped, and the scan notes each comment's span and each parenthesis and brace it closes.

use super::{is_identifier_byte, Scan};

/// Keywords after which an expression starts, so a `<` right after one opens a JSX element (`return <div />`) and a `/` opens
/// a regex. `of` is left out because it is an ordinary name outside a `for` head.
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
    b"instanceof",
    b"throw",
    b"default",
];

/// Keywords after which a `{` opens an object literal, not a block: the expression keywords less `do` and `else`.
const OPERAND_KEYWORDS: &[&[u8]] = &[
    b"return",
    b"yield",
    b"await",
    b"typeof",
    b"void",
    b"delete",
    b"case",
    b"in",
    b"instanceof",
    b"throw",
    b"default",
];

/// Keywords whose parenthesised head is followed by a statement, which can start with a regex.
const HEAD_KEYWORDS: &[&[u8]] = &[b"if", b"while", b"for", b"with"];

/// Bytes after which a `{` opens an object literal: operators, openers and separators that take an operand.
const OBJECT_AFTER: &[u8] = b"([,=:?!&|+-*%~^";

/// A bracket the scan closed: where its closer is and where its opener was.
#[derive(Clone, Copy)]
struct Closed {
    at: usize,
    opened: usize,
}

/// What the scan remembers about the code just behind it: the last run of comments (first byte, then end), and the last
/// parenthesis and the last brace it closed.
#[derive(Default)]
pub(super) struct Behind {
    comments: (usize, usize),
    paren: Option<Closed>,
    brace: Option<Closed>,
}

impl Scan<'_> {
    /// Whether an expression can start at `at`, judged by the nearest code before it, comments and whitespace skipped.
    pub(super) fn starts_expression(&self, at: usize) -> bool {
        let end = self.code_end_before(at);
        if end == 0 {
            return true;
        }
        let before = self.src[end - 1];
        if is_identifier_byte(before) {
            return self.word_is_one_of(end, EXPRESSION_KEYWORDS);
        }
        match before {
            b')' => self.closed_a_head(end - 1),
            b'}' => !self.closed_an_object(end - 1),
            b'(' | b'[' | b'{' | b',' | b'=' | b':' | b'?' | b';' | b'!' | b'&' | b'|' | b'+'
            | b'-' | b'*' | b'%' | b'~' | b'^' => true,
            b'>' => self.preceded_by(end - 1, b'='),
            _ => false,
        }
    }

    /// Whether the `)` at `close` ended the head of an `if`, `while`, `for` or `with`, after which a statement starts.
    fn closed_a_head(&self, close: usize) -> bool {
        match self.behind.paren {
            Some(paren) if paren.at == close => self.keyword_before(paren.opened, HEAD_KEYWORDS),
            _ => false,
        }
    }

    /// Whether the `}` at `close` ended an object literal, which is an operand: a division can follow it, not a regex.
    fn closed_an_object(&self, close: usize) -> bool {
        match self.behind.brace {
            Some(brace) if brace.at == close => self.opens_an_object(brace.opened),
            _ => false,
        }
    }

    /// Whether the `{` at `opened` sits where an operand can: after an operator, an opener or a separator, or after a keyword
    /// that takes one. After `)`, `;`, `}`, `{`, `=>` or a name it opens a block.
    fn opens_an_object(&self, opened: usize) -> bool {
        let end = self.code_end_before(opened);
        if end == 0 {
            return false;
        }
        let before = self.src[end - 1];
        if is_identifier_byte(before) {
            return self.word_is_one_of(end, OPERAND_KEYWORDS);
        }
        OBJECT_AFTER.contains(&before)
    }

    /// Whether the identifier just before `pos`, comments and whitespace skipped, is one of `keywords`.
    fn keyword_before(&self, pos: usize, keywords: &[&[u8]]) -> bool {
        let end = self.code_end_before(pos);
        end > 0 && is_identifier_byte(self.src[end - 1]) && self.word_is_one_of(end, keywords)
    }

    /// Whether the identifier that ends at `end` is one of `keywords`. After a `.` it is a property name, not a keyword.
    fn word_is_one_of(&self, end: usize, keywords: &[&[u8]]) -> bool {
        let mut start = end;
        while start > 0 && is_identifier_byte(self.src[start - 1]) {
            start -= 1;
        }
        let after_dot = start > 0 && self.src[start - 1] == b'.';
        !after_dot && keywords.contains(&&self.src[start..end])
    }

    /// The index just past the last code byte before `at`: whitespace is skipped, and so is the run of comments that ends
    /// there, when the scan noted one.
    fn code_end_before(&self, at: usize) -> usize {
        let end = self.space_start_before(at);
        let (first, last) = self.behind.comments;
        if end > 0 && end == last {
            return self.space_start_before(first);
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
        let (first, last) = self.behind.comments;
        let first = if gap > 0 && gap == last { first } else { start };
        self.behind.comments = (first, end);
    }

    /// Notes the `)` at `at`, and where the parenthesis it closed was opened, if it closed one.
    pub(super) fn note_paren(&mut self, at: usize, opened: Option<usize>) {
        self.behind.paren = opened.map(|opened| Closed { at, opened });
    }

    /// Notes the `}` at `at`, and where the brace it closed was opened, if it closed one.
    pub(super) fn note_brace(&mut self, at: usize, opened: Option<usize>) {
        self.behind.brace = opened.map(|opened| Closed { at, opened });
    }

    /// Forgets the comments and closers behind the scan, which a second pass over earlier text must not trust.
    pub(super) fn forget_behind(&mut self) {
        self.behind = Behind::default();
    }
}
