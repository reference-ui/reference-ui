//! A single linear pass that tracks the open constructs of one source.
//! It reports the deepest nesting it reaches, or the first point where that nesting passes `MAX_NESTING`. It takes the source bytes, whether the file is TypeScript
//! and whether it is JSX, and emits a depth or a `NestingRefusal` with the line of the opener that crossed the limit.
//! String literals, template text and comments are opaque runs, and a template's `${` opens a counted expression. In
//! TypeScript `<` after an identifier opens a generic, closed by `>` (a `=>` does not close it), and `;` or a closing
//! bracket drops the openers a comparison left behind, so `a < b` never accumulates depth. In `.tsx` and `.jsx` files
//! each JSX element is one level from its start tag to its closing tag, and JSX text is not code. `scan/jsx.rs` holds the
//! JSX rules, `scan/stack.rs` the stack of open constructs, and `scan/literals.rs` the skipped runs. This is a bound, not a
//! lexer: a construct it misreads can shift the count by a level, so the real-code scan checks that no ordinary file comes
//! near the limit.

mod jsx;
mod literals;
mod stack;

use super::NestingRefusal;

/// Bytes that can change the scan's state in code: quotes, comment slashes, escapes, newlines, template backticks,
/// brackets, `<` and `>` (generics, arrows and JSX), and `;`. Every other byte only advances the scan.
const CODE_SPECIAL: [bool; 256] = special_bytes(b"\"'`/\\\n()[]{}<>;");

/// Bytes that can change the scan's state in template text: the backtick, `$` (for `${`), escapes and newlines.
const TEMPLATE_SPECIAL: [bool; 256] = special_bytes(b"`$\\\n");

/// Bytes that can change the state inside a JSX start tag: quotes (attribute strings), slashes (self-closing tags and
/// comments), `>` (the end of the tag), `{` (an attribute expression), `<` (an element used as an attribute value) and
/// newlines.
const JSX_TAG_SPECIAL: [bool; 256] = special_bytes(b"\"'/<>{\n");

/// Bytes that can change the state among JSX children: `<` (a child element or a closing tag), `{` (an expression
/// container) and newlines. Everything else is text, quotes and brackets included.
const JSX_CHILDREN_SPECIAL: [bool; 256] = special_bytes(b"<{\n");

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
        Mode::JsxTag => &JSX_TAG_SPECIAL,
        Mode::JsxChildren => &JSX_CHILDREN_SPECIAL,
    }
}

/// One open construct on the scan stack. `Angle` is a TypeScript generic opener and `TemplateExpr` is the `${` of a
/// template literal. `JsxTag` is a JSX start tag still reading its attributes, and `JsxChildren` is an element or
/// fragment whose children are open; a JSX element is one level from its start tag to its closing tag.
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
/// costs nothing), the current line, and the deepest stack reached so far.
pub(super) struct Scan<'s> {
    src: &'s [u8],
    typescript: bool,
    jsx: bool,
    stack: Vec<Open>,
    counts: [usize; Open::KINDS],
    line: u32,
    deepest: usize,
}

impl<'s> Scan<'s> {
    pub(super) fn new(src: &'s [u8], typescript: bool, jsx: bool) -> Self {
        Self {
            src,
            typescript,
            jsx,
            stack: Vec::new(),
            counts: [0; Open::KINDS],
            line: 1,
            deepest: 0,
        }
    }

    /// Scans the whole source and returns the deepest nesting, or the first refusal. Ordinary bytes take the table
    /// check and move on; only the bytes that can change the state reach the handlers.
    pub(super) fn run(mut self) -> Result<usize, NestingRefusal> {
        let mut template = false;
        let mut at = 0;
        while at < self.src.len() {
            let mode = self.mode(template);
            at = if special(mode)[self.src[at] as usize] {
                self.step(at, mode, &mut template)?
            } else {
                at + 1
            };
        }
        Ok(self.deepest)
    }

    /// The mode is set by the construct on top of the stack, except that template text, which only code can open,
    /// takes precedence while it is open.
    fn mode(&self, template: bool) -> Mode {
        if template {
            return Mode::Template;
        }
        match self.stack.last() {
            Some(Open::JsxTag) => Mode::JsxTag,
            Some(Open::JsxChildren) => Mode::JsxChildren,
            _ => Mode::Code,
        }
    }

    fn step(&mut self, at: usize, mode: Mode, template: &mut bool) -> Result<usize, NestingRefusal> {
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
                self.close_brace_into(template);
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
    fn close_brace_into(&mut self, template: &mut bool) {
        if self.close_brace() {
            *template = true;
        }
    }

    fn code_byte(&mut self, byte: u8, at: usize) -> Result<usize, NestingRefusal> {
        match byte {
            b'(' | b'[' | b'{' => self.open(bracket_kind(byte), at + 1),
            b'<' => self.code_less_than(at),
            _ => {
                self.close_or_drop(byte, at);
                Ok(at + 1)
            }
        }
    }

    /// A `<` in code opens a JSX element where an expression can start, and a TypeScript generic right after an
    /// identifier. Anything else is a comparison, and counts for nothing.
    fn code_less_than(&mut self, at: usize) -> Result<usize, NestingRefusal> {
        if self.jsx && self.starts_expression(at) {
            if let Some((fragment, next)) = self.element_header(at) {
                return self.open_element(at, fragment, next);
            }
        }
        if self.opens_generic(at) {
            return self.open(Open::Angle, at + 1);
        }
        Ok(at + 1)
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

    fn template(&mut self, at: usize, template: &mut bool) -> Result<usize, NestingRefusal> {
        if self.src[at] == b'`' {
            *template = false;
            return Ok(at + 1);
        }
        if self.src[at] == b'$' && self.byte_at(at + 1) == Some(b'{') {
            *template = false;
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
