//! JSX element nesting for `.tsx` and `.jsx` sources.
//! A JSX element is one level once its closing tag or its `/>` is seen, and a child's text is raw, so its quotes and brackets
//! are not code. A `<` opens an element only where an expression can start and only when a tag header follows it; a
//! comparison, a TypeScript generic (`foo<T>()`) and an arrow generic (`<T,>(x) => x`, `<T extends U>`) are not tags, and a
//! string or comment that mentions `<` is skipped before any `<` in it is read. JSX text cannot hold a `>` or a `}`, so an
//! element that meets one was never an element, as in the function type `<T>(x: T) => T`: `scan/rescan.rs` drops it and reads
//! its text again as code. JSX attribute strings take no escapes, as JSX attribute strings do.

use super::literals::count_newlines;
use super::{Open, Scan};
use crate::parse::NestingRefusal;

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
    /// type arguments, which may span lines. The element opened on the line of its `<`.
    pub(super) fn open_element(
        &mut self,
        at: usize,
        fragment: bool,
        next: usize,
    ) -> Result<usize, NestingRefusal> {
        let kind = if fragment {
            Open::JsxChildren
        } else {
            Open::JsxTag
        };
        let opened = self.open_soft(kind, at, next);
        self.line += count_newlines(&self.src[at..next]);
        opened
    }

    /// One byte inside a start tag: an attribute string, a comment, the `/>` or `>` that ends the tag, an attribute
    /// expression, or an element used as an attribute value. The only other special byte is a newline.
    pub(super) fn jsx_tag(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        match self.src[at] {
            b'>' | b'/' => self.jsx_tag_end(at),
            b'"' | b'\'' => Ok(self.skip_jsx_string(at)),
            b'{' => self.open_hard(Open::Brace, at + 1),
            b'<' => self.jsx_child_element(at),
            _ => {
                self.line += 1;
                Ok(at + 1)
            }
        }
    }

    /// `>` ends the start tag, so the element's children open. `/>` ends a self-closing element, which closes with its
    /// tag. `/*` and `//` are comments inside the tag, and a lone `/` is nothing.
    fn jsx_tag_end(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        if self.src[at] == b'>' {
            self.retag_top(Open::JsxChildren);
            return Ok(at + 1);
        }
        match self.byte_at(at + 1) {
            Some(b'>') => {
                self.confirm_top()?;
                Ok(at + 2)
            }
            Some(b'*') => Ok(self.skip_block(at)),
            Some(b'/') => Ok(self.skip_line(at)),
            _ => Ok(at + 1),
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

    /// One byte among JSX children. A `{` opens an expression container, and a `<` either opens a child element or, when
    /// it starts `</`, closes this one. A `}` or a `>` cannot be JSX text, so it proves the element was never one, and the
    /// scan reads it again, as code when code surrounds the element. The only other special byte is a newline; every
    /// other byte is text.
    pub(super) fn jsx_children(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        match self.src[at] {
            b'{' => self.open_hard(Open::Brace, at + 1),
            b'}' | b'>' => Ok(self.end_misread_element(at)),
            b'<' if self.byte_at(at + 1) == Some(b'/') => self.close_jsx_element(at),
            b'<' => self.jsx_child_element(at),
            _ => {
                self.line += 1;
                Ok(at + 1)
            }
        }
    }

    /// A `<` that starts an element, as a child or as an attribute value. Anything that is not a tag header is text.
    fn jsx_child_element(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        if self.is_proven(at) {
            return Ok(at + 1);
        }
        match self.element_header(at) {
            Some((fragment, next)) => self.open_element(at, fragment, next),
            None => Ok(at + 1),
        }
    }

    /// A closing tag `</name>` or `</>` ends the element whose children are open on top of the stack, and the element
    /// counts from here.
    fn close_jsx_element(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        let end = self.src[at..]
            .iter()
            .position(|&byte| byte == b'>')
            .map_or(self.src.len(), |offset| at + offset + 1);
        self.line += count_newlines(&self.src[at..end]);
        if self.top() == Some(Open::JsxChildren) {
            self.confirm_top()?;
        }
        Ok(end)
    }

    /// The index just past the `>` that closes the type arguments opened at `open`, or None when they do not close within
    /// `TYPE_ARGS_LOOKAHEAD` bytes or the scan's lookahead. An `=>` inside them is a function type, not a closer.
    fn type_args_end(&self, open: usize) -> Option<usize> {
        let allowed = self.lookahead.get();
        let limit = (open + TYPE_ARGS_LOOKAHEAD)
            .min(self.src.len())
            .min(open.saturating_add(allowed));
        let mut depth = 0usize;
        for at in open..limit {
            let byte = self.src[at];
            if byte == b'<' {
                depth += 1;
            } else if byte == b'>' && !self.preceded_by(at, b'=') {
                depth -= 1;
                if depth == 0 {
                    self.lookahead.set(allowed - (at + 1 - open));
                    return Some(at + 1);
                }
            }
        }
        self.lookahead.set(allowed - limit.saturating_sub(open));
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
        while self
            .byte_at(at)
            .is_some_and(|byte| byte.is_ascii_whitespace())
        {
            at += 1;
        }
        at
    }
}
