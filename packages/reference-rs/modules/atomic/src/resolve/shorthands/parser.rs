//! Tokenizer and CSS property classification helpers for shorthand syntax parsing.
//! Decomposes space-separated shorthand declarations into distinct semantic tokens while respecting parenthesized sub-expressions.
//! Classifies tokens into width, style, color, and global keyword categories to guide atomic expansion passes.

use crate::resolve::lexical;

/// Border-style keywords consulted by the trio classifier.
pub(crate) const BORDER_STYLES: &[&str] = &[
    "none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset",
];

/// The one outline-only style keyword (CSS UI 4 `auto`).
pub(crate) const OUTLINE_STYLE_EXTRA: &str = "auto";

/// Line-width keywords that classify as border widths.
pub(crate) const LINE_WIDTH_KEYWORDS: &[&str] = &["thin", "medium", "thick"];

/// Length units whose numeric prefixes classify as border widths.
pub(crate) const LENGTH_UNITS: &[&str] = &[
    "px", "rem", "em", "r", "%", "vh", "vw", "ch", "vmin", "vmax", "cqw", "cqh", "pt", "pc", "ex",
    "dvh", "lvh", "svh",
];

/// Math functions whose calls classify as border widths.
pub(crate) const MATH_FUNCTIONS: &[&str] = &["calc", "min", "max", "clamp"];

/// CSS-wide cascade keywords that keep shorthand values whole.
pub(crate) const CSS_WIDE_KEYWORDS: &[&str] =
    &["inherit", "initial", "unset", "revert", "revert-layer"];

/// Parsed constituent components extracted from a composite shorthand declaration.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ParsedShorthand {
    pub width: Option<String>,
    pub style: Option<String>,
    pub color: Option<String>,
}

impl ParsedShorthand {
    fn assign_token(&mut self, token: &str, is_outline: bool) {
        // '3px' / 'solid' / 'red'  from  borderBottom: '3px solid red'
        // Classification first, first wins: an extra width or a repeat
        // style drops instead of falling through to color (core parity).
        if is_style_token(token, is_outline) {
            // solid / dashed / none  (+ outline: auto)
            if self.style.is_none() {
                self.style = Some(lexical::ascii_lower(token));
            }
            return;
        }
        if is_length_width(token) {
            // 3px / 1r / thin / calc(1r + 2px)
            if self.width.is_none() {
                self.width = Some(token.to_string());
            }
            return;
        }
        self.assign_color(token);
    }

    fn assign_color(&mut self, token: &str) {
        // red / blue.600 / var(--colors-n300)
        if self.color.is_none() {
            self.color = Some(token.to_string());
        }
    }
}

/// True when the token names a style keyword for this shorthand family.
fn is_style_token(token: &str, is_outline: bool) -> bool {
    if is_outline {
        is_outline_style(token)
    } else {
        is_border_style(token)
    }
}

struct TokenSplitter {
    tokens: Vec<String>,
    current: String,
    depth: usize,
}

impl TokenSplitter {
    fn new() -> Self {
        Self {
            tokens: Vec::new(),
            current: String::new(),
            depth: 0,
        }
    }

    fn push_char(&mut self, ch: char) {
        match ch {
            '(' => self.open_paren(),
            ')' => self.close_paren(),
            ' ' | '\t' | '\n' => self.handle_whitespace(),
            _ => self.current.push(ch),
        }
    }

    fn open_paren(&mut self) {
        // calc(1r + 2px)
        self.depth = self.depth.saturating_add(1);
        self.current.push('(');
    }

    fn close_paren(&mut self) {
        self.depth = self.depth.saturating_sub(1);
        self.current.push(')');
    }

    fn handle_whitespace(&mut self) {
        if self.depth > 0 {
            // keep spaces inside calc(...)
            self.current.push(' ');
        } else if !self.current.is_empty() {
            // '3px solid red' → tokens
            self.tokens.push(std::mem::take(&mut self.current));
        }
    }

    fn finish(mut self) -> Vec<String> {
        if !self.current.is_empty() {
            self.tokens.push(self.current);
        }
        self.tokens
    }
}

/// Tokenize shorthand string by whitespace, preserving nested parenthesized expressions.
pub fn split_tokens(val: &str) -> Vec<String> {
    // '3px solid red'  /  '1px solid calc(1r + 2px)'
    let mut splitter = TokenSplitter::new();
    for ch in val.chars() {
        splitter.push_char(ch);
    }
    splitter.finish()
}

/// Check if string matches a standard CSS border-style keyword.
pub fn is_border_style(val: &str) -> bool {
    // solid / dashed / none
    let lower = lexical::ascii_lower(lexical::trim_structural(val));
    BORDER_STYLES.contains(&lower.as_str())
}

/// Check if string matches an outline-style keyword, including CSS UI 4 'auto'.
pub fn is_outline_style(val: &str) -> bool {
    // outline: 'auto'  /  outline: 'solid'
    let lower = lexical::ascii_lower(lexical::trim_structural(val));
    lower == OUTLINE_STYLE_EXTRA || is_border_style(&lower)
}

/// Check if string matches a CSS global cascade keyword.
pub fn is_global_keyword(val: &str) -> bool {
    // padding: 'inherit'
    let lower = lexical::ascii_lower(lexical::trim_structural(val));
    CSS_WIDE_KEYWORDS.contains(&lower.as_str())
}

/// Check if string matches a CSS length, line-width keyword, or math function.
pub fn is_length_width(val: &str) -> bool {
    // 3px / 1r / thin / calc(1r + 2px) / 1/3r
    let s = lexical::ascii_lower(lexical::trim_structural(val));
    if s == "r" || s == "+r" || s == "-r" {
        return true;
    }
    if LINE_WIDTH_KEYWORDS.contains(&s.as_str()) {
        return true;
    }
    if is_math_function(&s) {
        return true;
    }
    if is_number_or_dimension(&s) {
        return true;
    }
    is_rhythm_fraction(&s)
}

fn is_math_function(s: &str) -> bool {
    // calc(1r + 2px) / min(1r, 10px)
    s.ends_with(')')
        && MATH_FUNCTIONS.iter().any(|name| {
            s.strip_prefix(name)
                .is_some_and(|rest| rest.starts_with('('))
        })
}

fn is_number_or_dimension(s: &str) -> bool {
    // 3px / 2r / 10% / 1.5
    for unit in LENGTH_UNITS {
        if let Some(prefix) = s.strip_suffix(unit) {
            if is_valid_numeric_str(prefix) {
                return true;
            }
        }
    }
    is_valid_numeric_str(s)
}

fn is_valid_numeric_str(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }
    let rest = s
        .strip_prefix('+')
        .or_else(|| s.strip_prefix('-'))
        .unwrap_or(s);
    if rest.is_empty() {
        return false;
    }
    // Ungated entry: non-finite parses classify as widths here.
    lexical::parse_decimal(rest).is_some()
}

fn is_rhythm_fraction(s: &str) -> bool {
    // 1/3r
    let Some(inner) = s.strip_suffix('r') else {
        return false;
    };
    let mut parts = inner.split('/');
    let (Some(num), Some(denom), None) = (parts.next(), parts.next(), parts.next()) else {
        return false;
    };
    is_valid_numeric_str(num) && is_valid_numeric_str(denom)
}

/// Parse space-separated tokens into width, style, and color components.
pub fn parse_shorthand_tokens(tokens: &[String], is_outline: bool) -> ParsedShorthand {
    // ['3px', 'solid', 'red']
    let mut parsed = ParsedShorthand::default();
    for token in tokens {
        parsed.assign_token(token, is_outline);
    }
    parsed
}

#[cfg(test)]
mod tests {
    use super::split_tokens;

    #[test]
    fn calc_function_does_not_glue_following_token() {
        // Before the depth fix this was one token: "calc(1px + 1px) solid".
        let tokens = split_tokens("calc(1px + 1px) solid");
        assert_eq!(tokens.as_slice(), ["calc(1px + 1px)", "solid"]);
    }
}
