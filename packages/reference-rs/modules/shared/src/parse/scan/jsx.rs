//! JSX element nesting for `.tsx` and `.jsx` sources.
//! A JSX element is one level from its start tag to its closing tag, and a child's text is raw, so its quotes and brackets
//! are not code. A `<` opens an element only
//! where an expression can start and only when a tag header follows it; a comparison, a TypeScript generic (`foo<T>()`) and
//! an arrow generic (`<T,>(x) => x`, `<T extends U>`) are not tags, and a string or comment that mentions `<` is skipped
//! before any `<` in it is read. JSX attribute strings take no escapes, as JSX attribute strings do.

use super::literals::count_newlines;
use super::{is_identifier_byte, Open, Scan};
use crate::parse::NestingRefusal;

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

/// How far past a `<` a type-argument list may run before it is read as not closing; no real tag comes near this.
const TYPE_ARGS_LOOKAHEAD: usize = 2048;

fn is_name_start(byte: u8) -> bool {
    byte.is_ascii_alphabetic() || byte == b'_' || byte == b'$'
}

/// A JSX tag name also takes `-`, `.` and `:`, as in `my-element`, `motion.div` and `svg:rect`.
fn is_name_byte(byte: u8) -> bool {
    is_name_start(byte) || byte.is_ascii_digit() || matches!(byte, b'-' | b'.' | b':')
}

impl Scan<'_> {
    /// Whether an expression can start at `at`, judged by the nearest code before it. An operator, an opener, a separator,
    /// the start of the file, or a keyword that takes an operand starts one; an identifier, a closer or a string before
    /// `at` means a comparison or a generic.
    pub(super) fn starts_expression(&self, at: usize) -> bool {
        let end = self.code_end_before(at);
        if end == 0 {
            return true;
        }
        let before = self.src[end - 1];
        if is_identifier_byte(before) {
            return EXPRESSION_KEYWORDS.contains(&self.word_ending_at(end));
        }
        match before {
            b'(' | b'[' | b'{' | b',' | b'=' | b':' | b'?' | b';' | b'!' | b'&' | b'|' | b'+' | b'-' | b'*' | b'%' | b'~'
            | b'^' | b'}' => true,
            b'>' => self.preceded_by(end - 1, b'='),
            _ => false,
        }
    }

    /// The index just past the last non-space byte before `at`.
    fn code_end_before(&self, at: usize) -> usize {
        let mut end = at;
        while end > 0 && self.src[end - 1].is_ascii_whitespace() {
            end -= 1;
        }
        end
    }

    /// The identifier that ends at `end`, possibly empty.
    fn word_ending_at(&self, end: usize) -> &[u8] {
        let mut start = end;
        while start > 0 && is_identifier_byte(self.src[start - 1]) {
            start -= 1;
        }
        &self.src[start..end]
    }

    /// Reads the head of a JSX tag at `at`, a `<`. `<>` is a fragment. `<name` is an element whose attributes begin after
    /// the name and any type arguments. Returns whether it is a fragment and where the attributes begin, or None when the
    /// text is not a tag: a comparison, or a generic such as `<T,>` and `<T extends U>`.
    pub(super) fn element_header(&self, at: usize) -> Option<(bool, usize)> {
        let first = self.byte_at(at + 1)?;
        if first == b'>' {
            return Some((true, at + 2));
        }
        if !is_name_start(first) {
            return None;
        }
        let mut end = self.name_end(at + 1);
        if self.byte_at(end) == Some(b'<') {
            end = self.type_args_end(end)?;
        }
        self.tag_tail_follows(end).then_some((false, end))
    }

    /// Opens the element or fragment that `element_header` read at `at`. `next` is where its attributes begin, past any
    /// type arguments, which may span lines.
    pub(super) fn open_element(&mut self, at: usize, fragment: bool, next: usize) -> Result<usize, NestingRefusal> {
        if fragment {
            return self.open(Open::JsxChildren, next);
        }
        self.line += count_newlines(&self.src[at..next]);
        self.open(Open::JsxTag, next)
    }

    /// One byte inside a start tag: an attribute string, a comment, the `/>` or `>` that ends the tag, an attribute
    /// expression, or an element used as an attribute value. The only other special byte is a newline.
    pub(super) fn jsx_tag(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        match self.src[at] {
            b'>' | b'/' => Ok(self.jsx_tag_end(at)),
            b'"' | b'\'' => Ok(self.skip_jsx_string(at)),
            b'{' => self.open(Open::Brace, at + 1),
            b'<' => self.jsx_child_element(at),
            _ => {
                self.line += 1;
                Ok(at + 1)
            }
        }
    }

    /// `>` ends the start tag, so the element's children open. `/>` ends a self-closing element, which closes with its
    /// tag. `/*` and `//` are comments inside the tag, and a lone `/` is nothing.
    fn jsx_tag_end(&mut self, at: usize) -> usize {
        if self.src[at] == b'>' {
            self.retag_top(Open::JsxChildren);
            return at + 1;
        }
        match self.byte_at(at + 1) {
            Some(b'>') => {
                self.pop();
                at + 2
            }
            Some(b'*') => self.skip_block(at),
            Some(b'/') => self.skip_line(at),
            _ => at + 1,
        }
    }

    /// A JSX attribute string runs to the same quote, with no escapes, and may span lines.
    fn skip_jsx_string(&mut self, at: usize) -> usize {
        let quote = self.src[at];
        let end = self.src[at + 1..]
            .iter()
            .position(|&byte| byte == quote)
            .map_or(self.src.len(), |offset| at + offset + 2);
        self.line += count_newlines(&self.src[at..end]);
        end
    }

    /// Replaces the start tag on top of the stack with the element's children, a change of kind with no change of depth.
    fn retag_top(&mut self, to: Open) {
        if let Some(top) = self.stack.last_mut() {
            let from = *top;
            *top = to;
            self.counts[from.index()] -= 1;
            self.counts[to.index()] += 1;
        }
    }

    /// One byte among JSX children. A `{` opens an expression container, and a `<` either opens a child element or, when
    /// it starts `</`, closes this one. The only other special byte is a newline; every other byte is text.
    pub(super) fn jsx_children(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        match self.src[at] {
            b'{' => self.open(Open::Brace, at + 1),
            b'<' if self.byte_at(at + 1) == Some(b'/') => Ok(self.close_jsx_element(at)),
            b'<' => self.jsx_child_element(at),
            _ => {
                self.line += 1;
                Ok(at + 1)
            }
        }
    }

    /// A `<` that starts an element, as a child or as an attribute value. Anything that is not a tag header is text.
    fn jsx_child_element(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        match self.element_header(at) {
            Some((fragment, next)) => self.open_element(at, fragment, next),
            None => Ok(at + 1),
        }
    }

    /// A closing tag `</name>` or `</>` ends the element whose children are open on top of the stack.
    fn close_jsx_element(&mut self, at: usize) -> usize {
        let end = self.src[at..]
            .iter()
            .position(|&byte| byte == b'>')
            .map_or(self.src.len(), |offset| at + offset + 1);
        self.line += count_newlines(&self.src[at..end]);
        if self.stack.last() == Some(&Open::JsxChildren) {
            self.pop();
        }
        end
    }

    /// The index just past the `>` that closes the type arguments opened at `open`, or None when they do not close within
    /// `TYPE_ARGS_LOOKAHEAD` bytes. An `=>` inside them is a function type, not a closer.
    fn type_args_end(&self, open: usize) -> Option<usize> {
        let limit = (open + TYPE_ARGS_LOOKAHEAD).min(self.src.len());
        let mut depth = 0usize;
        for at in open..limit {
            let byte = self.src[at];
            if byte == b'<' {
                depth += 1;
            } else if byte == b'>' && !self.preceded_by(at, b'=') {
                depth -= 1;
                if depth == 0 {
                    return Some(at + 1);
                }
            }
        }
        None
    }

    /// Whether the text after a tag name can continue a JSX tag: the end of the tag, a spread, a self-closing slash, or
    /// the first attribute.
    fn tag_tail_follows(&self, end: usize) -> bool {
        let at = self.skip_spaces(end);
        match self.byte_at(at) {
            Some(b'>' | b'{') => true,
            Some(b'/') => self.byte_at(at + 1) == Some(b'>'),
            Some(byte) if is_name_start(byte) => self.first_attribute_is_jsx(at),
            _ => false,
        }
    }

    /// The first attribute of a would-be tag rules out a type parameter: `extends` names one, and a `,` after the name
    /// or the attribute, as in `<const T,>`, ends a generic arrow's parameter list.
    fn first_attribute_is_jsx(&self, at: usize) -> bool {
        let end = self.name_end(at);
        if &self.src[at..end] == b"extends" {
            return false;
        }
        let next = self.skip_spaces(end);
        match self.byte_at(next) {
            Some(b',') => false,
            Some(byte) if is_name_start(byte) => &self.src[next..self.name_end(next)] != b"extends",
            _ => true,
        }
    }

    /// The first index at or after `from` that is not a tag-name byte.
    fn name_end(&self, from: usize) -> usize {
        let mut end = from;
        while self.byte_at(end).is_some_and(is_name_byte) {
            end += 1;
        }
        end
    }

    /// The first index at or after `from` that is not whitespace. Lookahead only: the caller consumes nothing here.
    fn skip_spaces(&self, from: usize) -> usize {
        let mut at = from;
        while self.byte_at(at).is_some_and(|byte| byte.is_ascii_whitespace()) {
            at += 1;
        }
        at
    }
}
