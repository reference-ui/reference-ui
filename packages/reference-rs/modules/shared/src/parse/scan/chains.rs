//! The unbracketed chains Oxc recurses through: prefix operators, `?:`, `=>` and assignment.
//! Oxc recurses once per link of `!!!!x`, `typeof typeof x`, `keyof keyof T`, `<T><T>x`, `a ? b : c ? d : e`, `a => b => c` and
//! `a = b = c`, and none of them opens a bracket the bracket count could see. The scan counts the links per bracket level and
//! refuses a level that passes `MAX_OPEN` with `NestingRefusal::chain`. A prefix run is the operators that follow one another
//! with only whitespace and comments between them, counted only where an expression can start. The `?`, `=>` and `=` links run
//! across operands and end at `;`, at `,`, when the bracket closes, and at a newline that does not continue the expression.

use super::{is_identifier_byte, NestingRefusal, Scan};
use crate::parse::MAX_OPEN;

/// The prefix operators that are words: the expression operators and the type operators `keyof` and `readonly`, and `new`.
const PREFIX_WORDS: &[&[u8]] = &[
    b"typeof",
    b"void",
    b"delete",
    b"await",
    b"keyof",
    b"readonly",
    b"new",
];

/// The counters of one bracket level: the right-recursive links since the run began, the prefix operators in the current
/// run, where that run's last operator ends, and whether the run is a TypeScript non-null `!` chain (`a!!!`), which is postfix
/// and recurses nowhere. A bracket level starts with fresh counters, and its closer restores the
/// counters of the level around it.
#[derive(Clone, Copy, Default)]
pub(super) struct Chains {
    right: u32,
    prefix: u32,
    prefix_end: u32,
    postfix: bool,
}

impl Chains {
    fn reset(&mut self) {
        *self = Chains::default();
    }

    /// A `!` that follows an operand is a non-null assertion; the `!` operators right after it are too.
    fn start_postfix(&mut self, end: usize) {
        self.prefix = 0;
        self.prefix_end = end as u32;
        self.postfix = true;
    }
}

impl Scan<'_> {
    /// The links of one bracket level restart: a `;` or a `,` ends the expression, and a bracket level starts empty.
    pub(super) fn end_chain_run(&mut self) {
        self.chains.reset();
    }

    /// A newline ends the run of right-recursive links unless the line ends in an operator that continues the expression.
    pub(super) fn newline_in_chain(&mut self, at: usize) {
        if self.chains.right != 0 && !self.line_continues(at) {
            self.chains.right = 0;
        }
    }

    /// Whether the code before the newline at `at` ends in an operator that continues the expression onto the next line:
    /// `=`, `?`, `:`, `=>`, a binary operator, or a prefix operator. `++` and `--` end an expression.
    fn line_continues(&self, at: usize) -> bool {
        let end = self.code_end_before(at);
        if end == 0 {
            return false;
        }
        let last = self.src[end - 1];
        let before = end.checked_sub(2).map(|index| self.src[index]);
        match last {
            b'=' | b'?' | b':' | b'!' | b'~' | b'&' | b'|' | b'^' | b'%' | b'*' => true,
            b'+' | b'-' => before != Some(last),
            b'>' => before == Some(b'='),
            _ => false,
        }
    }

    /// A `!`, `~`, `-` or `+` in code: a prefix operator where an expression can start, nothing otherwise. A `!=`, `+=` or `-=`
    /// is an operator that takes a left operand.
    pub(super) fn symbol_operator(&mut self, byte: u8, at: usize) -> Result<usize, NestingRefusal> {
        if self.byte_at(at + 1) == Some(b'=') {
            return Ok(at + 1);
        }
        let joined = self.joins_prefix_run(at);
        if joined && self.chains.postfix && byte == b'!' {
            self.chains.prefix_end = (at + 1) as u32;
        } else if !joined && !self.starts_expression(at) {
            if byte == b'!' {
                self.chains.start_postfix(at + 1);
            }
        } else {
            self.note_prefix(at, 1)?;
        }
        Ok(at + 1)
    }

    /// A `?` in code: a ternary link, unless it is `?.` (not before a digit), `??`, or the optional marker of a TypeScript
    /// member or parameter, which a `:`, `)`, `,`, `;`, `=` or `}` follows at once.
    pub(super) fn question_mark(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        match self.byte_at(at + 1) {
            Some(b'?') => Ok(at + 2),
            Some(b'.')
                if !self
                    .byte_at(at + 2)
                    .is_some_and(|byte| byte.is_ascii_digit()) =>
            {
                Ok(at + 1)
            }
            Some(b':' | b')' | b',' | b';' | b'=' | b'}') => Ok(at + 1),
            _ => self.right_link(at + 1),
        }
    }

    /// An `=` in code: an assignment link, or the `=>` of an arrow. A comparison (`==`, `===`, `!=`, `<=`, `>=`) is neither.
    pub(super) fn equals(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        let comparison = self.byte_at(at + 1) == Some(b'=')
            || (at > 0 && matches!(self.src[at - 1], b'=' | b'!' | b'<' | b'>'));
        if comparison {
            return Ok(at + 1);
        }
        self.right_link(at + 1)
    }

    fn right_link(&mut self, next: usize) -> Result<usize, NestingRefusal> {
        self.chains.right += 1;
        self.check_chains(next)
    }

    /// A letter that may start a keyword operator (`typeof`, `void`, `delete`, `await`), met only when the source holds enough
    /// keyword letters for a run. It reads the word whole and counts it as a prefix operator where an expression can start.
    pub(super) fn word(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        let mut end = at;
        while end < self.src.len() && is_identifier_byte(self.src[end]) {
            end += 1;
        }
        if self.is_word_start(at)
            && PREFIX_WORDS.contains(&&self.src[at..end])
            && self.prefix_start(at)
        {
            self.note_prefix(at, end - at)?;
        }
        Ok(end.max(at + 1))
    }

    /// Whether the letter at `at` begins a word: a byte before it that can belong to a name or a property access means it
    /// does not.
    fn is_word_start(&self, at: usize) -> bool {
        at == 0
            || !(is_identifier_byte(self.src[at - 1])
                || matches!(self.src[at - 1], b'.' | 0x80..=0xff))
    }

    /// A `<T>` in a TypeScript file that is not TSX, where an expression starts: a type assertion, which is a prefix operator
    /// as long as its type is a plain name. A longer type is not counted.
    pub(super) fn assertion(&mut self, at: usize) -> Result<(), NestingRefusal> {
        let src = self.src;
        let mut end = at + 1;
        while end < src.len() && (is_identifier_byte(src[end]) || matches!(src[end], b'.' | b' ')) {
            end += 1;
        }
        if end > at + 1 && src.get(end) == Some(&b'>') && self.prefix_start(at) {
            self.note_prefix(at, end + 1 - at)?;
        }
        Ok(())
    }

    /// Whether the operator at `at` is a prefix: it follows the previous prefix operator, or an expression can start there.
    fn prefix_start(&self, at: usize) -> bool {
        self.joins_prefix_run(at) || self.starts_expression(at)
    }

    fn joins_prefix_run(&self, at: usize) -> bool {
        let end = self.chains.prefix_end as usize;
        end != 0 && self.code_end_before(at) == end
    }

    /// Counts the prefix operator of `len` bytes at `at` into its run.
    fn note_prefix(&mut self, at: usize, len: usize) -> Result<(), NestingRefusal> {
        let joined = self.joins_prefix_run(at) && !self.chains.postfix;
        self.chains.prefix = if joined { self.chains.prefix + 1 } else { 1 };
        self.chains.prefix_end = (at + len) as u32;
        self.chains.postfix = false;
        self.check_chains(at + len).map(|_| ())
    }

    /// Refuses a bracket level whose chain links pass `MAX_OPEN`, naming the line the run crossed it on.
    fn check_chains(&self, next: usize) -> Result<usize, NestingRefusal> {
        let links = self.chains.right.max(self.chains.prefix) as usize;
        if links > MAX_OPEN {
            return Err(NestingRefusal::chain(links, self.line));
        }
        Ok(next)
    }
}
