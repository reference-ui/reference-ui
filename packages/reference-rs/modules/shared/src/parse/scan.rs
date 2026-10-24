//! A single linear pass that tracks the open constructs of one source.
//! It reports the deepest nesting it reaches, or the first point where that nesting passes `MAX_NESTING`. It takes the
//! source bytes, whether the file is TypeScript and whether it is JSX, and emits a depth or a `NestingRefusal` with the line
//! of the construct whose nesting crossed the limit. A bracket or a template `${` counts the moment it opens. A TypeScript
//! generic `<` and a JSX element are guesses, so they count only once their closer is seen, and a comparison, a shift or a
//! misread tag that never closes counts for nothing. Strings, regex literals, template text and comments are opaque runs.
//! `scan/stack.rs` holds the stack and that rule, `scan/jsx.rs` the element rules, `scan/rescan.rs` the second pass over text a
//! misread element swallowed, `scan/expression.rs` the test for where an expression starts, `scan/chains.rs` the counters for
//! the chains that open no bracket (`!!!x`, `a ? b : c ? d : e`, `a => b => c`, `a = b = c`), `scan/literals.rs` and
//! `scan/regex.rs` the skipped runs, and `scan/raw.rs` the bracket count that backs the scan up. This is a bound, not a lexer:
//! a real-code survey checks that no ordinary file comes near the limit, and the two wider limits catch what a misreading
//! lets through.

use std::cell::Cell;
use std::collections::HashSet;

mod chains;
mod expression;
mod jsx;
mod literals;
mod raw;
mod regex;
mod rescan;
mod stack;

use chains::Chains;
use expression::Behind;
#[cfg(test)]
pub(super) use raw::peak as raw_peak;
pub(super) use raw::{can_refuse, check_raw, may_hold_keyword_run};
use stack::Frame;

use super::NestingRefusal;

/// Bytes that can change the scan's state in code: quotes, comment and regex slashes, escapes, newlines, template backticks,
/// brackets, `<` and `>` (generics, arrows and JSX), `;` and `,` (which end a chain), and the chain operators `! ~ - + ? =`.
/// Every other byte only advances the scan.
const CODE_SPECIAL: [bool; 256] = special_bytes(b"\"'`/\\\n()[]{}<>;,!~-+?=");

/// `CODE_SPECIAL` plus the first letters of the keyword operators `typeof`, `void`, `delete` and `await`, for a source with
/// enough keyword letters to hold a run of them.
const CODE_SPECIAL_WORDS: [bool; 256] = special_bytes(b"\"'`/\\\n()[]{}<>;,!~-+?=tvda");

/// Bytes that can change the scan's state in template text: the backtick, `$` (for `${`), escapes and newlines.
const TEMPLATE_SPECIAL: [bool; 256] = special_bytes(b"`$\\\n");

/// Bytes that can change the state inside a JSX start tag: quotes (attribute strings), slashes (self-closing tags and
/// comments), `>` (the end of the tag), `{` (an attribute expression), `<` (an element used as an attribute value) and
/// newlines.
const JSX_TAG_SPECIAL: [bool; 256] = special_bytes(b"\"'/<>{\n");

/// Bytes that can change the state among JSX children: `<` (a child element or a closing tag), `{` (an expression
/// container) and newlines, plus `>` and `}`, which JSX text cannot hold, so one means the element was never an element.
/// Everything else is text, quotes and brackets included.
const JSX_CHILDREN_SPECIAL: [bool; 256] = special_bytes(b"<>{}\n");

/// The bytes a lookahead may read per source byte before the scan stops looking ahead. A real source spends a small
/// fraction of it, and a hostile one cannot make the scan quadratic.
const LOOKAHEAD_PER_BYTE: usize = 8;

/// The lookahead a source gets however short it is.
const LOOKAHEAD_FLOOR: usize = 4096;

const fn special_bytes(bytes: &[u8]) -> [bool; 256] {
    let mut table = [false; 256];
    let mut index = 0;
    while index < bytes.len() {
        table[bytes[index] as usize] = true;
        index += 1;
    }
    table
}

fn special(mode: Mode, words: bool) -> &'static [bool; 256] {
    match mode {
        Mode::Code if words => &CODE_SPECIAL_WORDS,
        Mode::Code => &CODE_SPECIAL,
        Mode::Template => &TEMPLATE_SPECIAL,
        Mode::JsxTag => &JSX_TAG_SPECIAL,
        Mode::JsxChildren => &JSX_CHILDREN_SPECIAL,
    }
}

/// One open construct on the scan stack. `Angle` is a TypeScript generic opener and `TemplateExpr` is the `${` of a
/// template literal. `JsxTag` is a JSX start tag still reading its attributes, and `JsxChildren` is an element or
/// fragment whose children are open. The first four count the moment they open; `Angle`, `JsxTag` and `JsxChildren` are soft
/// and count only once their closer is seen.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Open {
    Paren,
    Bracket,
    Brace,
    TemplateExpr,
    Angle,
    JsxTag,
    JsxChildren,
}

impl Open {
    const KINDS: usize = 7;

    fn index(self) -> usize {
        self as usize
    }

    /// A generic or an element: it counts only once its closer is seen, so a misread one costs nothing.
    fn is_soft(self) -> bool {
        matches!(self, Open::Angle | Open::JsxTag | Open::JsxChildren)
    }
}

/// What the next byte means: ordinary code, template text, the attributes of a JSX start tag, or JSX children.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Mode {
    Code,
    Template,
    JsxTag,
    JsxChildren,
}

/// The scan's state: the open constructs, how many of each kind are open (so a closer with no opener of its kind
/// costs nothing), the chain counters of the bracket level, the current line, the deepest counted nesting so far, what lies just behind the scan, the `<` offsets
/// already proven not to open an element, and the lookahead still allowed.
pub(super) struct Scan<'s> {
    src: &'s [u8],
    typescript: bool,
    jsx: bool,
    words: bool,
    stack: Vec<Frame>,
    counts: [usize; Open::KINDS],
    chains: Chains,
    line: u32,
    deepest: usize,
    #[cfg(test)]
    peak: usize,
    behind: Behind,
    proven: HashSet<usize>,
    lookahead: Cell<usize>,
}

impl<'s> Scan<'s> {
    pub(super) fn new(src: &'s [u8], typescript: bool, jsx: bool) -> Self {
        Self {
            src,
            typescript,
            jsx,
            words: may_hold_keyword_run(src),
            stack: Vec::new(),
            counts: [0; Open::KINDS],
            chains: Chains::default(),
            line: 1,
            deepest: 0,
            #[cfg(test)]
            peak: 0,
            behind: Behind::default(),
            proven: HashSet::new(),
            lookahead: Cell::new(src.len().saturating_mul(LOOKAHEAD_PER_BYTE) + LOOKAHEAD_FLOOR),
        }
    }

    /// Scans the whole source and returns the deepest nesting, or the first refusal. The mode is read once per special
    /// byte; the bytes between two special bytes take one table check each and move on. An element still open at the end
    /// was never one, so its text is scanned again as code before the scan finishes.
    pub(super) fn run(&mut self) -> Result<usize, NestingRefusal> {
        let src = self.src;
        let mut template = false;
        let mut at = 0;
        loop {
            while at < src.len() {
                let mode = self.mode(template);
                let table = special(mode, self.words);
                while at < src.len() && !table[src[at] as usize] {
                    at += 1;
                }
                if at < src.len() {
                    at = self.step(at, mode, &mut template)?;
                }
            }
            match self.misread_at_end(template) {
                Some(resume) => at = resume,
                None => return Ok(self.deepest),
            }
        }
    }

    /// The most constructs the stack held at once, counted or not; the survey reports it beside the depth.
    #[cfg(test)]
    pub(super) fn peak_open(&self) -> usize {
        self.peak
    }

    /// The mode is set by the construct on top of the stack, except that template text, which only code can open,
    /// takes precedence while it is open.
    fn mode(&self, template: bool) -> Mode {
        if template {
            return Mode::Template;
        }
        match self.top() {
            Some(Open::JsxTag) => Mode::JsxTag,
            Some(Open::JsxChildren) => Mode::JsxChildren,
            _ => Mode::Code,
        }
    }

    fn step(
        &mut self,
        at: usize,
        mode: Mode,
        template: &mut bool,
    ) -> Result<usize, NestingRefusal> {
        match mode {
            Mode::Code => self.code(at, template),
            Mode::Template => self.template(at, template),
            Mode::JsxTag => self.jsx_tag(at),
            Mode::JsxChildren => self.jsx_children(at),
        }
    }

    fn code(&mut self, at: usize, template: &mut bool) -> Result<usize, NestingRefusal> {
        match self.skip_literal(at) {
            Some(next) => Ok(next),
            None => self.code_token(at, template),
        }
    }

    fn code_token(&mut self, at: usize, template: &mut bool) -> Result<usize, NestingRefusal> {
        match self.src[at] {
            b'`' => {
                *template = true;
                Ok(at + 1)
            }
            b'}' => {
                self.close_brace_into(template, at);
                Ok(at + 1)
            }
            b'\n' => {
                self.line += 1;
                self.newline_in_chain(at);
                Ok(at + 1)
            }
            byte => self.code_byte(byte, at),
        }
    }

    /// Closes a brace or template expression with the `}` at `at`; a template expression resumes the template's text.
    fn close_brace_into(&mut self, template: &mut bool, at: usize) {
        if self.close_brace(at) {
            *template = true;
        }
    }

    fn code_byte(&mut self, byte: u8, at: usize) -> Result<usize, NestingRefusal> {
        match byte {
            b'(' | b'[' | b'{' => self.open_hard(bracket_kind(byte), at + 1),
            b'<' => self.code_less_than(at),
            b'!' | b'~' | b'-' | b'+' => self.symbol_operator(byte, at),
            b'?' => self.question_mark(at),
            b'=' => self.equals(at),
            b't' | b'v' | b'd' | b'a' => self.word(at),
            _ => self.close_or_drop(byte, at),
        }
    }

    /// A `<` in code opens a JSX element where an expression can start, and a TypeScript generic right after an
    /// identifier. Anything else is a comparison, and counts for nothing. Either one is only a guess until it closes.
    fn code_less_than(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        if self.jsx && self.starts_expression(at) && !self.is_proven(at) {
            if let Some((fragment, next)) = self.element_header(at) {
                return self.open_element(at, fragment, next);
            }
        }
        if self.opens_generic(at) {
            return self.open_soft(Open::Angle, at, at + 1);
        }
        Ok(at + 1)
    }

    /// Closers pop their opener. A `>` closes the generic on top unless it is part of `=>`, and `;` drops the generics a
    /// comparison left open.
    fn close_or_drop(&mut self, byte: u8, at: usize) -> Result<usize, NestingRefusal> {
        match byte {
            b')' => {
                let opened = self.close(Open::Paren);
                self.note_paren(at, opened);
            }
            b']' => {
                self.close(Open::Bracket);
            }
            b'>' => self.close_angle_unless_arrow(at)?,
            b';' => {
                self.drop_angles();
                self.end_chain_run();
            }
            b',' => self.end_chain_run(),
            _ => {}
        }
        Ok(at + 1)
    }

    /// In TypeScript `<` opens a generic only directly after an identifier, as in `Array<`.
    fn opens_generic(&self, at: usize) -> bool {
        self.typescript && self.follows_identifier(at)
    }

    fn template(&mut self, at: usize, template: &mut bool) -> Result<usize, NestingRefusal> {
        if self.src[at] == b'`' {
            *template = false;
            return Ok(at + 1);
        }
        if self.src[at] == b'$' && self.byte_at(at + 1) == Some(b'{') {
            *template = false;
            return self.open_hard(Open::TemplateExpr, at + 2);
        }
        Ok(self.skip_text(at))
    }

    /// Template text: an escape hides the next byte, and a newline still counts.
    fn skip_text(&mut self, at: usize) -> usize {
        match self.src[at] {
            b'\\' => self.skip_escape(at),
            b'\n' => {
                self.line += 1;
                at + 1
            }
            _ => at + 1,
        }
    }

    fn follows_identifier(&self, at: usize) -> bool {
        at > 0 && is_identifier_byte(self.src[at - 1])
    }

    fn preceded_by(&self, at: usize, byte: u8) -> bool {
        at > 0 && self.src[at - 1] == byte
    }

    fn byte_at(&self, at: usize) -> Option<u8> {
        self.src.get(at).copied()
    }
}

/// Which opener a bracket byte belongs to: `(` and `)`, `[` and `]`, and any other byte is a brace.
fn bracket_kind(byte: u8) -> Open {
    match byte {
        b'(' | b')' => Open::Paren,
        b'[' | b']' => Open::Bracket,
        _ => Open::Brace,
    }
}

fn is_identifier_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'$'
}
