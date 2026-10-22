//! A single linear pass that tracks which brackets are open in one source.
//! It takes the source bytes and whether the file is TypeScript, and emits the deepest nesting it reaches, or a
//! `NestingRefusal` with the line of the opener that crossed `MAX_NESTING`. String literals, template text and comments
//! are skipped as opaque runs; a template's `${` opens a counted expression. In TypeScript `<` after an identifier opens
//! a generic, closed by `>` (a `=>` does not close it), and `;` or a closing bracket drops the openers a comparison left
//! behind, so `a < b` never accumulates depth. This is a bound, not a lexer: a quote inside JSX text can hide brackets
//! from the count, which is why the native exports also run on a large stack.

use super::{NestingRefusal, MAX_NESTING};

/// Bytes that can change the scan's state in code: quotes, comment slashes, escapes, newlines, template backticks,
/// brackets, `<` and `>` (generics and arrows), and `;`. Every other byte only advances the scan.
const CODE_SPECIAL: [bool; 256] = special_bytes(b"\"'`/\\\n()[]{}<>;");

/// Bytes that can change the scan's state in template text: the backtick, `$` (for `${`), escapes and newlines.
const TEMPLATE_SPECIAL: [bool; 256] = special_bytes(b"`$\\\n");

const fn special_bytes(bytes: &[u8]) -> [bool; 256] {
    let mut table = [false; 256];
    let mut index = 0;
    while index < bytes.len() {
        table[bytes[index] as usize] = true;
        index += 1;
    }
    table
}

fn special(mode: Mode) -> &'static [bool; 256] {
    match mode {
        Mode::Code => &CODE_SPECIAL,
        Mode::Template => &TEMPLATE_SPECIAL,
    }
}

/// One open construct on the scan stack. `Angle` is a TypeScript generic opener and `TemplateExpr` is the `${` of
/// a template literal; the two closers that can end a `TemplateExpr` are `}` and the end of its expression.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Open {
    Paren,
    Bracket,
    Brace,
    TemplateExpr,
    Angle,
}

impl Open {
    const KINDS: usize = 5;

    fn index(self) -> usize {
        self as usize
    }
}

/// Whether the scan is in ordinary code or inside the text of a template literal, where brackets are not nesting.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Mode {
    Code,
    Template,
}

/// The scan's state: the open constructs, how many of each kind are open (so a closer with no opener of its kind
/// costs nothing), the current line, and the deepest stack reached so far.
pub(super) struct Scan<'s> {
    src: &'s [u8],
    typescript: bool,
    stack: Vec<Open>,
    counts: [usize; Open::KINDS],
    line: u32,
    deepest: usize,
}

impl<'s> Scan<'s> {
    pub(super) fn new(src: &'s [u8], typescript: bool) -> Self {
        Self {
            src,
            typescript,
            stack: Vec::new(),
            counts: [0; Open::KINDS],
            line: 1,
            deepest: 0,
        }
    }

    /// Scans the whole source and returns the deepest nesting, or the first refusal. Ordinary bytes take the table
    /// check and move on; only the bytes that can change the state reach the handlers.
    pub(super) fn run(mut self) -> Result<usize, NestingRefusal> {
        let mut mode = Mode::Code;
        let mut at = 0;
        while at < self.src.len() {
            at = if special(mode)[self.src[at] as usize] {
                self.step(at, &mut mode)?
            } else {
                at + 1
            };
        }
        Ok(self.deepest)
    }

    fn step(&mut self, at: usize, mode: &mut Mode) -> Result<usize, NestingRefusal> {
        match mode {
            Mode::Code => self.code(at, mode),
            Mode::Template => self.template(at, mode),
        }
    }

    fn code(&mut self, at: usize, mode: &mut Mode) -> Result<usize, NestingRefusal> {
        match self.skip_literal(at) {
            Some(next) => Ok(next),
            None => self.code_token(at, mode),
        }
    }

    fn code_token(&mut self, at: usize, mode: &mut Mode) -> Result<usize, NestingRefusal> {
        match self.src[at] {
            b'`' => {
                *mode = Mode::Template;
                Ok(at + 1)
            }
            b'}' => {
                self.close_brace_into(mode);
                Ok(at + 1)
            }
            b'\n' => {
                self.line += 1;
                Ok(at + 1)
            }
            byte => self.code_byte(byte, at),
        }
    }

    /// Closes a brace or template expression; a template expression resumes the template's text.
    fn close_brace_into(&mut self, mode: &mut Mode) {
        if self.close_brace() {
            *mode = Mode::Template;
        }
    }

    /// Comments, string literals and backslash escapes are opaque to the count; returns the index past them.
    fn skip_literal(&mut self, at: usize) -> Option<usize> {
        match self.src[at] {
            b'/' => self.skip_comment(at),
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

    fn code_byte(&mut self, byte: u8, at: usize) -> Result<usize, NestingRefusal> {
        match byte {
            b'(' | b'[' | b'{' => self.open(bracket_kind(byte), at + 1),
            b'<' if self.opens_generic(at) => self.open(Open::Angle, at + 1),
            _ => {
                self.close_or_drop(byte, at);
                Ok(at + 1)
            }
        }
    }

    /// Closers pop their opener, and `>` and `;` drop the generics a comparison left open; none of these can refuse.
    fn close_or_drop(&mut self, byte: u8, at: usize) {
        match byte {
            b')' | b']' => self.close(bracket_kind(byte)),
            b'>' => self.drop_angle_unless_arrow(at),
            b';' => self.drop_angles(),
            _ => {}
        }
    }

    /// In TypeScript `<` opens a generic only directly after an identifier, as in `Array<`.
    fn opens_generic(&self, at: usize) -> bool {
        self.typescript && self.follows_identifier(at)
    }

    fn template(&mut self, at: usize, mode: &mut Mode) -> Result<usize, NestingRefusal> {
        if self.src[at] == b'`' {
            *mode = Mode::Code;
            return Ok(at + 1);
        }
        if self.src[at] == b'$' && self.byte_at(at + 1) == Some(b'{') {
            *mode = Mode::Code;
            return self.open(Open::TemplateExpr, at + 2);
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

    fn open(&mut self, open: Open, next: usize) -> Result<usize, NestingRefusal> {
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
    fn close(&mut self, open: Open) {
        if self.counts[open.index()] == 0 {
            return;
        }
        if let Some(pos) = self.stack.iter().rposition(|top| *top == open) {
            self.truncate_to(pos);
        }
    }

    /// Closes the topmost brace or template expression. Returns true when that was a template expression, so the
    /// caller resumes the template's text.
    fn close_brace(&mut self) -> bool {
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

    /// A `>` closes the generic it sits in only when that generic is the innermost open construct.
    fn drop_angle(&mut self) {
        if self.stack.last() == Some(&Open::Angle) {
            self.truncate_to(self.stack.len() - 1);
        }
    }

    /// A `>` closes a generic unless it is the `>` of an arrow (`=>`), which a generic's function type may contain.
    fn drop_angle_unless_arrow(&mut self, at: usize) {
        if !self.preceded_by(at, b'=') {
            self.drop_angle();
        }
    }

    /// A `;` cannot sit inside a generic, so any generic still open is a comparison that never closed.
    fn drop_angles(&mut self) {
        while self.stack.last() == Some(&Open::Angle) {
            self.truncate_to(self.stack.len() - 1);
        }
    }

    /// A backslash hides the byte after it, except a newline, which the caller must still count.
    fn skip_escape(&self, at: usize) -> usize {
        if self.byte_at(at + 1) == Some(b'\n') {
            at + 1
        } else {
            at + 2
        }
    }

    /// Ends on the newline, which the main loop counts.
    fn skip_line(&self, at: usize) -> usize {
        self.src[at..]
            .iter()
            .position(|byte| *byte == b'\n')
            .map_or(self.src.len(), |offset| at + offset)
    }

    fn skip_block(&mut self, at: usize) -> usize {
        let end = block_close(self.src, at + 2).map_or(self.src.len(), |found| found + 2);
        self.line += count_newlines(&self.src[at..end]);
        end
    }

    /// Ends after the closing quote, or before a newline: an unterminated string never runs past its line.
    fn skip_string(&mut self, at: usize, quote: u8) -> usize {
        let end = string_end(self.src, at + 1, quote).min(self.src.len());
        self.line += count_newlines(&self.src[at..end]);
        end
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

/// Which opener a bracket byte belongs to, for `(` and `)`, `[` and `]`, and `{` (any other byte is a brace).
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

/// Index of the `*/` that closes a block comment, searching from `from`.
fn block_close(src: &[u8], from: usize) -> Option<usize> {
    src.get(from..)?
        .windows(2)
        .position(|pair| pair[0] == b'*' && pair[1] == b'/')
        .map(|offset| from + offset)
}

fn count_newlines(bytes: &[u8]) -> u32 {
    bytes.iter().filter(|byte| **byte == b'\n').count() as u32
}
