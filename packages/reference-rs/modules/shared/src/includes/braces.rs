//! Brace expansion for include globs: `{a,b}` alternations with nesting.
//! Takes one raw pattern and emits every alternative spelling before token parsing.
//! Pairs without a top-level comma stay literal, as do unmatched braces and
//! backslash-escaped marks. Later passes handle `*`, `?`, and `[...]` matching.

/// Expand `{a,b}` alternations; commaless braces stay literal. Commaless pairs are skipped in a loop, so a
/// pattern of thousands of them never recurses; recursion follows only real alternations, which the limits in
/// `limits.rs` keep shallow.
pub(crate) fn expand(pattern: &str) -> Vec<String> {
    let chars: Vec<char> = pattern.chars().collect();
    let mut head = String::new();
    let mut rest: &[char] = &chars;
    while let Some((open, close)) = find_brace_pair(rest) {
        let choices = split_choices(&rest[open + 1..close]);
        if choices.len() < 2 {
            head.extend(rest[..=close].iter());
            rest = &rest[close + 1..];
            continue;
        }
        let mut expanded = Vec::new();
        for choice in &choices {
            let mut next = String::new();
            next.extend(rest[..open].iter());
            next.push_str(choice);
            next.extend(rest[close + 1..].iter());
            expanded.extend(expand(&next).into_iter().map(|tail| format!("{head}{tail}")));
        }
        return expanded;
    }
    vec![format!("{head}{}", rest.iter().collect::<String>())]
}

/// First `{` with its depth-zero mate, skipping escaped characters.
fn find_brace_pair(chars: &[char]) -> Option<(usize, usize)> {
    let open = find_unescaped(chars, 0, '{')?;
    find_mate(chars, open).map(|close| (open, close))
}

/// First unescaped occurrence of `want` at or after `from`.
fn find_unescaped(chars: &[char], from: usize, want: char) -> Option<usize> {
    let mut at = from;
    while at < chars.len() {
        if chars[at] == '\\' {
            at += 2;
            continue;
        }
        if chars[at] == want {
            return Some(at);
        }
        at += 1;
    }
    None
}

/// Depth-zero `}` mate for the `{` at `open`.
fn find_mate(chars: &[char], open: usize) -> Option<usize> {
    let mut depth = 0;
    let mut at = open;
    while at < chars.len() {
        if chars[at] == '\\' {
            at += 2;
            continue;
        }
        depth = track_brace(chars[at], depth);
        if depth == 0 {
            return Some(at);
        }
        at += 1;
    }
    None
}

/// Fold one character into the brace depth.
fn track_brace(hit: char, depth: i32) -> i32 {
    if hit == '{' {
        depth + 1
    } else if hit == '}' {
        depth - 1
    } else {
        depth
    }
}

/// Split brace innards on top-level commas, honoring nesting and escapes.
fn split_choices(chars: &[char]) -> Vec<String> {
    let mut choices = Vec::new();
    let mut current = String::new();
    let mut depth = 0;
    for part in split_unescaped_commas(chars) {
        if !current.is_empty() {
            current.push(',');
        }
        current.push_str(&part);
        depth += brace_delta(&part);
        if depth == 0 {
            choices.push(std::mem::take(&mut current));
        }
    }
    if !current.is_empty() {
        choices.push(current);
    }
    choices
}

/// Split on every unescaped comma, keeping escapes intact for later passes.
fn split_unescaped_commas(chars: &[char]) -> Vec<String> {
    let mut parts = Vec::new();
    let mut current = String::new();
    let mut at = 0;
    while at < chars.len() {
        if chars[at] == '\\' && at + 1 < chars.len() {
            current.push(chars[at]);
            current.push(chars[at + 1]);
            at += 2;
            continue;
        }
        if chars[at] == ',' {
            parts.push(std::mem::take(&mut current));
        } else {
            current.push(chars[at]);
        }
        at += 1;
    }
    parts.push(current);
    parts
}

/// Net unescaped `{` minus `}` depth of one comma-separated part.
fn brace_delta(part: &str) -> i32 {
    let mut delta = 0;
    let mut escaped = false;
    for hit in part.chars() {
        escaped = delta_step(hit, escaped, &mut delta);
    }
    delta
}

/// Fold one character into the delta, returning the next escape flag.
fn delta_step(hit: char, escaped: bool, delta: &mut i32) -> bool {
    if escaped {
        return false;
    }
    match hit {
        '\\' => true,
        '{' => {
            *delta += 1;
            false
        }
        '}' => {
            *delta -= 1;
            false
        }
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The recursive expander the loop replaced, kept as the oracle for short patterns.
    fn expand_reference(pattern: &str) -> Vec<String> {
        let chars: Vec<char> = pattern.chars().collect();
        let Some((open, close)) = find_brace_pair(&chars) else {
            return vec![pattern.to_string()];
        };
        let choices = split_choices(&chars[open + 1..close]);
        if choices.len() < 2 {
            let head: String = chars[..=close].iter().collect();
            let tail: String = chars[close + 1..].iter().collect();
            return expand_reference(&tail)
                .into_iter()
                .map(|rest| format!("{head}{rest}"))
                .collect();
        }
        let mut expanded = Vec::new();
        for choice in &choices {
            let mut next = String::new();
            next.extend(chars[..open].iter());
            next.push_str(choice);
            next.extend(chars[close + 1..].iter());
            expanded.extend(expand_reference(&next));
        }
        expanded
    }

    #[test]
    fn alternations_expand() {
        assert_eq!(expand("src/*.{ts,tsx}"), vec!["src/*.ts", "src/*.tsx"]);
        assert_eq!(expand("{a,b}/{c,d}"), vec!["a/c", "a/d", "b/c", "b/d"]);
    }

    #[test]
    fn nested_alternations_expand() {
        assert_eq!(expand("{a,{b,c}}"), vec!["a", "b", "c"]);
    }

    #[test]
    fn commaless_braces_stay_literal() {
        assert_eq!(expand("src/{a}.ts"), vec!["src/{a}.ts"]);
        assert_eq!(expand("src/{a"), vec!["src/{a"]);
        assert_eq!(expand("{a}{b,c}{d}"), vec!["{a}b{d}", "{a}c{d}"]);
    }

    #[test]
    fn thousands_of_commaless_pairs_expand_without_recursing() {
        let pattern = format!("src/{}.ts", "{x}".repeat(5000));
        assert_eq!(expand(&pattern), vec![pattern.clone()]);
    }

    #[test]
    fn the_loop_agrees_with_the_recursive_expander_over_every_short_pattern() {
        let alphabet = ['{', '}', ',', 'a', '\\'];
        let mut pattern = String::new();
        compare(&alphabet, &mut pattern, 7);
    }

    fn compare(alphabet: &[char], pattern: &mut String, room: usize) {
        assert_eq!(expand(pattern), expand_reference(pattern), "{pattern:?}");
        if room == 0 {
            return;
        }
        for next in alphabet {
            pattern.push(*next);
            compare(alphabet, pattern, room - 1);
            pattern.pop();
        }
    }
}
