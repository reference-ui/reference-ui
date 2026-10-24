//! Brace limits for include patterns, enforced before `braces::expand` builds a single alternative.
//! Takes one include pattern and its body (the pattern without a leading `!`) and emits `IncludeError` when the body
//! nests braces deeper than 64 levels or expands to more than 1,024 globs. The numbers and the counting rule are
//! the ones core's config validation applies (`collect/lib/scan/brace-limits.ts`): the count follows `expand`'s
//! pair, choice and commaless-literal rules exactly, but multiplies and adds instead of building lists, and it
//! walks the characters once with an explicit group stack, so thousands of sequential pairs never recurse.

use std::fmt;

/// The most globs one include pattern's braces may expand to.
pub const MAX_BRACE_ALTERNATIVES: u64 = 1024;

/// The deepest one include pattern's braces may nest.
pub const MAX_BRACE_DEPTH: usize = 64;

/// Which brace limit a pattern broke.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BraceLimit {
    /// The braces expand to more than `MAX_BRACE_ALTERNATIVES` globs.
    Alternatives,
    /// The braces nest deeper than `MAX_BRACE_DEPTH` levels.
    Depth,
}

/// An include pattern refused before compilation, naming the pattern whole (its `!` included) and the limit.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IncludeError {
    pub pattern: String,
    pub limit: BraceLimit,
}

impl fmt::Display for IncludeError {
    /// The wording core's config validation uses, so one broken pattern reads the same from either side.
    fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
        let pattern = &self.pattern;
        match self.limit {
            BraceLimit::Depth => write!(
                out,
                "include pattern '{pattern}' nests braces deeper than {MAX_BRACE_DEPTH} levels"
            ),
            BraceLimit::Alternatives => write!(
                out,
                "include pattern '{pattern}' expands to more than 1,024 globs"
            ),
        }
    }
}

impl std::error::Error for IncludeError {}

/// Refuse a pattern whose body breaks a brace limit; depth is read first, as core reads it.
pub(super) fn check(pattern: &str, body: &str) -> Result<(), IncludeError> {
    let chars: Vec<char> = body.chars().collect();
    let limit = if brace_depth(&chars) > MAX_BRACE_DEPTH {
        Some(BraceLimit::Depth)
    } else if count_alternatives(&chars) > MAX_BRACE_ALTERNATIVES {
        Some(BraceLimit::Alternatives)
    } else {
        None
    };
    match limit {
        Some(limit) => Err(IncludeError {
            pattern: pattern.to_string(),
            limit,
        }),
        None => Ok(()),
    }
}

/// The deepest unescaped `{` nesting; a backslash escapes the next character and a stray `}` never goes below zero.
fn brace_depth(chars: &[char]) -> usize {
    let mut depth = 0usize;
    let mut deepest = 0usize;
    let mut at = 0;
    while at < chars.len() {
        match chars[at] {
            '\\' => at += 1,
            '{' => {
                depth += 1;
                deepest = deepest.max(depth);
            }
            '}' => depth = depth.saturating_sub(1),
            _ => {}
        }
        at += 1;
    }
    deepest
}

/// One open `{` while counting: the alternatives of the choices closed so far, the running product of the choice being
/// read, and how many choices the group has.
struct Group {
    closed_sum: u64,
    product: u64,
    choices: u32,
}

impl Group {
    fn open() -> Self {
        Self {
            closed_sum: 0,
            product: 1,
            choices: 1,
        }
    }

    fn next_choice(&mut self) {
        self.closed_sum = self.closed_sum.saturating_add(self.product);
        self.product = 1;
        self.choices += 1;
    }

    /// What the closed group multiplies its parent by: the sum over its choices, or 1 for a commaless pair, which
    /// stays literal and never expands what is inside it.
    fn factor(&self) -> u64 {
        if self.choices < 2 {
            1
        } else {
            self.closed_sum.saturating_add(self.product)
        }
    }
}

/// Count the globs `braces::expand` builds for `chars`, saturating, without building any. A `{` never closed is
/// left literal with everything after it, so an open group at the end contributes nothing.
fn count_alternatives(chars: &[char]) -> u64 {
    let mut top: u64 = 1;
    let mut open: Vec<Group> = Vec::new();
    let mut at = 0;
    while at < chars.len() {
        match chars[at] {
            '\\' => at += 1,
            '{' => open.push(Group::open()),
            ',' => {
                if let Some(group) = open.last_mut() {
                    group.next_choice();
                }
            }
            '}' => close_group(&mut top, &mut open),
            _ => {}
        }
        at += 1;
    }
    top
}

/// Fold the innermost open group into its parent; a `}` with nothing open is a stray and counts for nothing.
fn close_group(top: &mut u64, open: &mut Vec<Group>) {
    let Some(group) = open.pop() else {
        return;
    };
    let factor = group.factor();
    match open.last_mut() {
        Some(parent) => parent.product = parent.product.saturating_mul(factor),
        None => *top = top.saturating_mul(factor),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn chars(text: &str) -> Vec<char> {
        text.chars().collect()
    }

    fn nest(levels: usize) -> String {
        format!("src/{}b{}.ts", "{a,".repeat(levels), "}".repeat(levels))
    }

    fn verdict(pattern: &str) -> Result<(), BraceLimit> {
        let body = pattern.strip_prefix('!').unwrap_or(pattern);
        check(pattern, body).map_err(|error| error.limit)
    }

    #[test]
    fn sequential_groups_multiply_and_nested_groups_add() {
        assert_eq!(count_alternatives(&chars(&"{a,b}".repeat(10))), 1024);
        assert_eq!(verdict(&"{a,b}".repeat(10)), Ok(()));
        assert_eq!(count_alternatives(&chars(&"{a,b}".repeat(11))), 2048);
        assert_eq!(verdict(&"{a,b}".repeat(11)), Err(BraceLimit::Alternatives));
        assert_eq!(count_alternatives(&chars("{a,b}{c,d,e}")), 6);
        assert_eq!(count_alternatives(&chars("src/{a}{b,{c,d}}")), 3);
        let mixed = format!("{}{{a,{{b,c}}}}", "{a,b}".repeat(9));
        assert_eq!(count_alternatives(&chars(&mixed)), 512 * 3);
    }

    #[test]
    fn the_boundary_is_exactly_1024() {
        // 1,024 = 2^10; 1,025 alternatives come from one group of 1,025 choices.
        let choices = |count: usize| format!("{{{}}}", vec!["a"; count].join(","));
        assert_eq!(count_alternatives(&chars(&choices(1024))), 1024);
        assert_eq!(verdict(&choices(1024)), Ok(()));
        assert_eq!(count_alternatives(&chars(&choices(1025))), 1025);
        assert_eq!(verdict(&choices(1025)), Err(BraceLimit::Alternatives));
    }

    #[test]
    fn nesting_64_levels_passes_and_65_is_refused() {
        assert_eq!(brace_depth(&chars(&nest(MAX_BRACE_DEPTH))), 64);
        assert_eq!(verdict(&nest(MAX_BRACE_DEPTH)), Ok(()));
        assert_eq!(brace_depth(&chars(&nest(MAX_BRACE_DEPTH + 1))), 65);
        assert_eq!(verdict(&nest(MAX_BRACE_DEPTH + 1)), Err(BraceLimit::Depth));
    }

    #[test]
    fn thousands_of_sequential_pairs_do_not_recurse() {
        assert_eq!(verdict(&"{x,y}".repeat(5000)), Err(BraceLimit::Alternatives));
        // Commaless pairs stay literal: 5,000 of them are one glob, depth 1.
        assert_eq!(count_alternatives(&chars(&"{x}".repeat(5000))), 1);
        assert_eq!(verdict(&"{x}".repeat(5000)), Ok(()));
    }

    #[test]
    fn escaped_unmatched_and_stray_braces_follow_the_expander() {
        assert_eq!(count_alternatives(&chars(&"\\{a,b\\}".repeat(24))), 1);
        assert_eq!(brace_depth(&chars(&format!("{}a{}", "\\{".repeat(70), "\\}".repeat(70)))), 0);
        assert_eq!(brace_depth(&chars("src/\\{{a,b}\\}")), 1);
        assert_eq!(count_alternatives(&chars("src/{a,b")), 1);
        assert_eq!(count_alternatives(&chars("{a,{b,c}")), 1);
        assert_eq!(count_alternatives(&chars("}}{a,b}{c")), 2);
        assert_eq!(brace_depth(&chars("}}}{")), 1);
    }

    #[test]
    fn a_negated_pattern_reads_by_its_body_and_is_named_whole() {
        let pattern = format!("!{}", "{a,b}".repeat(11));
        let error = check(&pattern, &pattern[1..]).unwrap_err();
        assert_eq!(error.pattern, pattern);
        assert_eq!(
            error.to_string(),
            format!("include pattern '{pattern}' expands to more than 1,024 globs")
        );
        let deep = nest(65);
        let error = check(&deep, &deep).unwrap_err();
        assert_eq!(
            error.to_string(),
            format!("include pattern '{deep}' nests braces deeper than 64 levels")
        );
    }

    #[test]
    fn counting_matches_the_expander_over_every_short_pattern() {
        let alphabet = ['{', '}', ',', 'a', '\\'];
        let mut pattern = String::new();
        agree(&alphabet, &mut pattern, 7);
    }

    fn agree(alphabet: &[char], pattern: &mut String, room: usize) {
        let counted = count_alternatives(&chars(pattern)) as usize;
        assert_eq!(counted, super::super::braces::expand(pattern).len(), "{pattern:?}");
        if room == 0 {
            return;
        }
        for next in alphabet {
            pattern.push(*next);
            agree(alphabet, pattern, room - 1);
            pattern.pop();
        }
    }
}
