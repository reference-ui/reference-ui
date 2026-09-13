//! Tokenizer and CSS property classification helpers for shorthand syntax parsing.
//! Decomposes space-separated shorthand declarations into distinct semantic tokens while respecting parenthesized sub-expressions.
//! Classifies tokens into width, style, color, and global keyword categories to guide atomic expansion passes.

/// Parsed constituent components extracted from a composite shorthand declaration.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ParsedShorthand {
    pub width: Option<String>,
    pub style: Option<String>,
    pub color: Option<String>,
}

impl ParsedShorthand {
    fn assign_token(&mut self, token: &str, is_outline: bool) {
        if self.try_assign_style(token, is_outline) {
            return;
        }
        if self.try_assign_width(token) {
            return;
        }
        self.assign_color(token);
    }

    fn try_assign_style(&mut self, token: &str, is_outline: bool) -> bool {
        if self.style.is_some() {
            return false;
        }
        let matched = if is_outline {
            is_outline_style(token)
        } else {
            is_border_style(token)
        };
        if matched {
            self.style = Some(token.to_ascii_lowercase());
            true
        } else {
            false
        }
    }

    fn try_assign_width(&mut self, token: &str) -> bool {
        if self.width.is_some() {
            return false;
        }
        if is_length_width(token) {
            self.width = Some(token.to_string());
            true
        } else {
            false
        }
    }

    fn assign_color(&mut self, token: &str) {
        if self.color.is_none() {
            self.color = Some(token.to_string());
        }
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
        self.depth = self.depth.saturating_add(1);
        self.current.push('(');
    }

    fn close_paren(&mut self) {
        self.depth = self.depth.saturating_sub(1);
        self.current.push(')');
    }

    fn handle_whitespace(&mut self) {
        if self.depth > 0 {
            self.current.push(' ');
        } else if !self.current.is_empty() {
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
    let mut splitter = TokenSplitter::new();
    for ch in val.chars() {
        splitter.push_char(ch);
    }
    splitter.finish()
}

/// Check if string matches a standard CSS border-style keyword.
pub fn is_border_style(val: &str) -> bool {
    matches!(
        val.trim().to_ascii_lowercase().as_str(),
        "none"
            | "hidden"
            | "dotted"
            | "dashed"
            | "solid"
            | "double"
            | "groove"
            | "ridge"
            | "inset"
            | "outset"
    )
}

/// Check if string matches an outline-style keyword, including CSS UI 4 'auto'.
pub fn is_outline_style(val: &str) -> bool {
    let lower = val.trim().to_ascii_lowercase();
    lower == "auto" || is_border_style(&lower)
}

/// Check if string matches a CSS global cascade keyword.
pub fn is_global_keyword(val: &str) -> bool {
    matches!(
        val.trim().to_ascii_lowercase().as_str(),
        "inherit" | "initial" | "unset" | "revert" | "revert-layer"
    )
}

/// Check if string matches a CSS length, line-width keyword, or math function.
pub fn is_length_width(val: &str) -> bool {
    let s = val.trim().to_ascii_lowercase();
    if s == "r" || s == "+r" || s == "-r" {
        return true;
    }
    if matches!(s.as_str(), "thin" | "medium" | "thick") {
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
    (s.starts_with("calc(")
        || s.starts_with("min(")
        || s.starts_with("max(")
        || s.starts_with("clamp("))
        && s.ends_with(')')
}

fn is_number_or_dimension(s: &str) -> bool {
    let units = [
        "px", "rem", "em", "r", "%", "vh", "vw", "ch", "vmin", "vmax", "cqw", "cqh", "pt", "pc",
        "ex", "dvh", "lvh", "svh",
    ];

    for unit in units {
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
    let rest = s.strip_prefix('+').or_else(|| s.strip_prefix('-')).unwrap_or(s);
    if rest.is_empty() {
        return false;
    }
    rest.parse::<f64>().is_ok()
}

fn is_rhythm_fraction(s: &str) -> bool {
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
    let mut parsed = ParsedShorthand::default();
    for token in tokens {
        parsed.assign_token(token, is_outline);
    }
    parsed
}
