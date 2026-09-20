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
}
