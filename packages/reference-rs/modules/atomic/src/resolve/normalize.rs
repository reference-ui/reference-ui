//! Value whitespace canonicalization (SPEC-V2-14).
//!
//! Structural whitespace runs in authored values collapse to one space, so
//! spaced twins (`'1px  solid red'`, multiline backtick grids) mint one atom,
//! one class, and one declaration instead of two. Runs inside quoted
//! substrings stay verbatim: `content` strings and quoted font names keep
//! their spacing. Resolve applies the collapse to every string want;
//! template joins trim first at the fold, so Panda's collapse-plus-trim rule
//! holds end to end. Numeric canonicalization stays in `unit`, beside this.

/// Collapse each run of structural whitespace to one space, leaving quoted
/// substrings (`'...'` / `"..."`) byte-identical. Verbatim port of Panda's
/// `collapse_whitespace` (`literal.rs`), including its plain quote toggle:
/// quotes nest by alternation only, with no escape handling.
pub fn collapse_whitespace(value: &str) -> String {
    let mut collapse = Collapse::with_capacity(value.len());
    for ch in value.chars() {
        collapse.push(ch);
    }
    collapse.finish()
}

/// Borrowed fast path: without structural whitespace, quotes, or non-ASCII
/// bytes the collapse is the identity, so borrow the input. Byte-exact:
/// ASCII structural whitespace is only `0x09-0x0D` + space (lexical L1 —
/// every other member is above U+7F, i.e. bytes `>= 0x80` in UTF-8).
pub fn collapse_whitespace_cow(value: &str) -> std::borrow::Cow<'_, str> {
    let plain = !value
        .bytes()
        .any(|b| b >= 0x80 || b == b'"' || b == b'\'' || matches!(b, 0x09..=0x0d | 0x20));
    if plain {
        std::borrow::Cow::Borrowed(value)
    } else {
        std::borrow::Cow::Owned(collapse_whitespace(value))
    }
}

/// Collapse an owned box, reusing its buffer when the value is already
/// plain. The hot string path calls this instead of copy-then-collapse.
pub fn collapse_boxed(value: Box<str>) -> Box<str> {
    match collapse_whitespace_cow(&value) {
        std::borrow::Cow::Borrowed(_) => value,
        std::borrow::Cow::Owned(o) => o.into_boxed_str(),
    }
}

/// One collapse pass: the output plus the currently open quote, if any.
struct Collapse {
    out: String,
    quote: Option<char>,
}

impl Collapse {
    fn with_capacity(cap: usize) -> Self {
        Self {
            out: String::with_capacity(cap),
            quote: None,
        }
    }

    /// Push one char: quoted text verbatim, else one space per run.
    fn push(&mut self, ch: char) {
        if self.quote.is_some() {
            self.push_quoted(ch);
        } else if is_quote(ch) {
            self.quote = Some(ch);
            self.out.push(ch);
        } else {
            self.push_bare(ch);
        }
    }

    /// Push one char inside quotes; the matching quote closes the run.
    fn push_quoted(&mut self, ch: char) {
        self.out.push(ch);
        if Some(ch) == self.quote {
            self.quote = None;
        }
    }

    /// Push one unquoted char: text verbatim, one space per whitespace run.
    fn push_bare(&mut self, ch: char) {
        if !super::lexical::is_structural_whitespace(ch) {
            self.out.push(ch);
        } else if !self.out.ends_with(' ') {
            self.out.push(' ');
        }
    }

    fn finish(self) -> String {
        self.out
    }
}

/// True for a quote that opens or closes a preserved substring.
fn is_quote(ch: char) -> bool {
    ch == '"' || ch == '\''
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn interior_runs_collapse_to_one_space() {
        assert_eq!(collapse_whitespace("1px  solid   red"), "1px solid red");
    }

    #[test]
    fn tabs_and_newlines_collapse_like_spaces() {
        assert_eq!(collapse_whitespace("a\tb\nc"), "a b c");
    }

    #[test]
    fn double_quoted_runs_survive_verbatim() {
        assert_eq!(collapse_whitespace("\"a  b\""), "\"a  b\"");
    }

    #[test]
    fn single_quoted_runs_survive_verbatim() {
        assert_eq!(
            collapse_whitespace("'Fira  Code', monospace"),
            "'Fira  Code', monospace"
        );
    }

    #[test]
    fn grid_template_collapses_between_quoted_rows() {
        let raw = "\n    \"preview name delete\" \n    \"preview size delete\"";
        assert_eq!(
            collapse_whitespace(raw).trim(),
            "\"preview name delete\" \"preview size delete\""
        );
    }

    #[test]
    fn collapse_is_idempotent() {
        let once = collapse_whitespace("1px  solid   red");
        assert_eq!(collapse_whitespace(&once), once);
    }

    #[test]
    fn empty_and_plain_values_pass_through() {
        assert_eq!(collapse_whitespace(""), "");
        assert_eq!(collapse_whitespace("red"), "red");
    }

    #[test]
    fn cow_fast_path_agrees_with_slow_path() {
        let corpus = [
            "",
            "red",
            "1px  solid   red",
            "a\tb\nc",
            "\"a  b\"",
            "'Fira  Code', monospace",
            "a\u{0b}b",
            "a\u{85}b",
            "a\u{a0}b",
            "a\u{3000}b",
            "pre  \"q  q\"  post",
        ];
        for raw in corpus {
            assert_eq!(
                collapse_whitespace_cow(raw).as_ref(),
                collapse_whitespace(raw),
                "{raw:?}"
            );
        }
        assert!(matches!(
            collapse_whitespace_cow("red"),
            std::borrow::Cow::Borrowed(_)
        ));
        assert!(matches!(
            collapse_whitespace_cow("a  b"),
            std::borrow::Cow::Owned(_)
        ));
        assert!(matches!(
            collapse_whitespace_cow("a\u{a0}b"),
            std::borrow::Cow::Owned(_)
        ));
    }
}
