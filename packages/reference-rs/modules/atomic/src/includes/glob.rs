//! Single-pattern glob tokens and matching for the atomic include scope.
//! Parses one brace-expanded pattern into a token stream where `**` crosses
//! directories while `*`, `?`, and `[...]` stay inside a segment. Matching is a
//! small backtracking walk shared by every candidate path the scope tests.

/// One brace-expanded glob alternative as a token stream.
pub(crate) type Alternative = Vec<Token>;

/// Single glob atom over a candidate path.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum Token {
    /// Literal character, including `/`.
    Literal(char),
    /// `*`: any run inside one segment.
    AnyInSegment,
    /// `**`: any run across segments, wherever it appears.
    AnyAcross,
    /// `**/`: zero or more whole segments.
    AnySegments,
    /// `?`: one character inside one segment.
    OneInSegment,
    /// `[...]`: one character inside one segment, never `/`.
    Class { negated: bool, ranges: Vec<(char, char)> },
}

/// Parse one brace-expanded pattern into match tokens.
pub(crate) fn parse(text: &str) -> Alternative {
    let chars: Vec<char> = text.chars().collect();
    let mut tokens = Vec::new();
    let mut at = 0;
    while at < chars.len() {
        at = push_token(&chars, at, &mut tokens);
    }
    tokens
}

/// Match a candidate against one alternative with star backtracking.
pub(crate) fn matches(alternative: &Alternative, candidate: &str) -> bool {
    let chars: Vec<char> = candidate.chars().collect();
    match_from(alternative, 0, &chars, 0)
}

/// Push the token starting at `at`, returning the next unread index.
fn push_token(chars: &[char], at: usize, tokens: &mut Alternative) -> usize {
    match chars[at] {
        '*' => push_star(chars, at, tokens),
        '[' => push_class(chars, at, tokens),
        '\\' => push_escape(chars, at, tokens),
        '?' => {
            tokens.push(Token::OneInSegment);
            at + 1
        }
        other => {
            tokens.push(Token::Literal(other));
            at + 1
        }
    }
}

/// Push a `*` run: `**/` takes whole segments, other runs stay inline.
fn push_star(chars: &[char], at: usize, tokens: &mut Alternative) -> usize {
    let run = star_run(chars, at);
    if run > 1 && chars.get(at + run) == Some(&'/') {
        tokens.push(Token::AnySegments);
        return at + run + 1;
    }
    if run > 1 {
        tokens.push(Token::AnyAcross);
    } else {
        tokens.push(Token::AnyInSegment);
    }
    at + run
}

/// Push a `[...]` class, or a literal `[` when the bracket never closes.
fn push_class(chars: &[char], at: usize, tokens: &mut Alternative) -> usize {
    match parse_class(chars, at) {
        Some((token, next)) => {
            tokens.push(token);
            next
        }
        None => {
            tokens.push(Token::Literal('['));
            at + 1
        }
    }
}

/// Push a backslash escape: the next character stays literal.
fn push_escape(chars: &[char], at: usize, tokens: &mut Alternative) -> usize {
    match chars.get(at + 1) {
        Some(&next) => {
            tokens.push(Token::Literal(next));
            at + 2
        }
        None => {
            tokens.push(Token::Literal('\\'));
            at + 1
        }
    }
}

/// Length of the `*` run starting at `at`.
fn star_run(chars: &[char], at: usize) -> usize {
    let mut run = 0;
    while chars.get(at + run) == Some(&'*') {
        run += 1;
    }
    run
}

/// Parse a `[...]` class; unclosed brackets fail so `[` stays literal.
fn parse_class(chars: &[char], open: usize) -> Option<(Token, usize)> {
    let mut at = open + 1;
    let mut negated = false;
    if matches!(chars.get(at), Some('!') | Some('^')) {
        negated = true;
        at += 1;
    }
    let mut ranges = Vec::new();
    if chars.get(at) == Some(&']') {
        ranges.push((']', ']'));
        at += 1;
    }
    while chars.get(at).is_some() {
        if chars[at] == ']' {
            return Some((Token::Class { negated, ranges }, at + 1));
        }
        let (range, next) = class_range(chars, at);
        ranges.push(range);
        at = next;
    }
    None
}

/// One class member: an `a-z` range or a literal character.
fn class_range(chars: &[char], at: usize) -> ((char, char), usize) {
    let lo = chars[at];
    if chars.get(at + 1) == Some(&'-') {
        if let Some(&hi) = chars.get(at + 2) {
            if hi != ']' {
                return ((lo.min(hi), lo.max(hi)), at + 3);
            }
        }
    }
    ((lo, lo), at + 1)
}

/// True when the class token admits one character; classes never match `/`.
fn class_hit(token: &Token, hit: char) -> bool {
    let Token::Class { negated, ranges } = token else {
        return false;
    };
    if hit == '/' {
        return false;
    }
    let inside = ranges.iter().any(|&(lo, hi)| lo <= hit && hit <= hi);
    if *negated { !inside } else { inside }
}

/// Match tokens from `at` against characters from `from`.
fn match_from(tokens: &[Token], at: usize, chars: &[char], from: usize) -> bool {
    let Some(token) = tokens.get(at) else {
        return from == chars.len();
    };
    if *token == Token::AnySegments {
        return StarSegments { tokens, chars, at }.run(from);
    }
    if matches!(token, Token::AnyInSegment | Token::AnyAcross) {
        let across = *token == Token::AnyAcross;
        return StarStep {
            tokens,
            chars,
            at,
            across,
        }
        .run(from);
    }
    let Some(&hit) = chars.get(from) else {
        return false;
    };
    single_hit(token, hit) && match_from(tokens, at + 1, chars, from + 1)
}

/// One single-character token against one character.
fn single_hit(token: &Token, hit: char) -> bool {
    match token {
        Token::Literal(want) => hit == *want,
        Token::OneInSegment => hit != '/',
        Token::Class { .. } => class_hit(token, hit),
        Token::AnyInSegment | Token::AnyAcross | Token::AnySegments => false,
    }
}

/// Cursor for growing one star match across a candidate.
struct StarStep<'a> {
    tokens: &'a [Token],
    chars: &'a [char],
    at: usize,
    across: bool,
}

impl StarStep<'_> {
    /// Grow the star until the remaining tokens match or the run is exhausted.
    fn run(&self, from: usize) -> bool {
        let mut end = from;
        while !self.rest_matches(end) {
            if !self.extend(&mut end) {
                return false;
            }
        }
        true
    }

    fn rest_matches(&self, end: usize) -> bool {
        match_from(self.tokens, self.at + 1, self.chars, end)
    }

    fn extend(&self, end: &mut usize) -> bool {
        match self.chars.get(*end) {
            Some(hit) if self.across || *hit != '/' => {
                *end += 1;
                true
            }
            _ => false,
        }
    }
}

/// Cursor for matching zero or more whole `segment/` runs.
struct StarSegments<'a> {
    tokens: &'a [Token],
    chars: &'a [char],
    at: usize,
}

impl StarSegments<'_> {
    /// Retry the remaining tokens after zero segments, then after each `/`.
    fn run(&self, from: usize) -> bool {
        if self.rest_matches(from) {
            return true;
        }
        let mut end = from;
        while let Some(next) = next_segment_end(self.chars, end) {
            end = next;
            if self.rest_matches(end) {
                return true;
            }
        }
        false
    }

    fn rest_matches(&self, end: usize) -> bool {
        match_from(self.tokens, self.at + 1, self.chars, end)
    }
}

/// Index just past the next `/` at or after `from`, if one remains.
fn next_segment_end(chars: &[char], from: usize) -> Option<usize> {
    let mut end = from;
    while let Some(hit) = chars.get(end) {
        end += 1;
        if *hit == '/' {
            return Some(end);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    fn matched(pattern: &str, candidate: &str) -> bool {
        matches(&parse(pattern), candidate)
    }

    #[test]
    fn star_star_crosses_segments() {
        assert!(matched("theme/**", "theme/in.ts"));
        assert!(matched("theme/**", "theme/deep/nested.ts"));
        assert!(!matched("theme/**", "outside/out.ts"));
        assert!(!matched("theme/**", "theme"));
    }

    #[test]
    fn star_star_slash_matches_zero_or_more_dirs() {
        assert!(matched("src/**/*.ts", "src/a.ts"));
        assert!(matched("src/**/*.ts", "src/deep/a.ts"));
        assert!(matched("src/**/*.ts", "src/deep/deeper/a.ts"));
        assert!(!matched("src/**/*.ts", "src/a.mjs"));
        assert!(matched("**/*.ts", "a.ts"));
    }

    #[test]
    fn star_stays_inside_a_segment() {
        assert!(matched("src/*.ts", "src/a.ts"));
        assert!(!matched("src/*.ts", "src/deep/a.ts"));
        assert!(matched("src/?.ts", "src/q.ts"));
        assert!(!matched("src/?.ts", "src/qu.ts"));
    }

    #[test]
    fn classes_match_one_character() {
        assert!(matched("src/[a-c].ts", "src/b.ts"));
        assert!(matched("src/[!a-c].ts", "src/z.ts"));
        assert!(!matched("src/[a-c].ts", "src/z.ts"));
        assert!(!matched("src/[a-c].ts", "src/b.tsx"));
        assert!(!matched("src/[a-c].ts", "src/.ts"));
    }

    #[test]
    fn escapes_quote_magic_characters() {
        assert!(matched("src/\\*.ts", "src/*.ts"));
        assert!(!matched("src/\\*.ts", "src/a.ts"));
    }
}
