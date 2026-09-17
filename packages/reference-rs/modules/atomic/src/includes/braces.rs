//! Brace expansion for include globs: `{a,b}` alternations with nesting.
//! Takes one raw pattern and emits every alternative spelling before token parsing.
//! Pairs without a top-level comma stay literal, as do unmatched braces and
//! backslash-escaped marks. Later passes handle `*`, `?`, and `[...]` matching.

/// Expand `{a,b}` alternations; commaless braces stay literal.
pub(crate) fn expand(pattern: &str) -> Vec<String> {
    let chars: Vec<char> = pattern.chars().collect();
    let Some((open, close)) = find_brace_pair(&chars) else {
        return vec![pattern.to_string()];
    };
    let choices = split_choices(&chars[open + 1..close]);
    if choices.len() < 2 {
        return expand_literal_braces(&chars, close);
    }
    let mut expanded = Vec::new();
    for choice in &choices {
        let mut next = String::new();
        next.extend(chars[..open].iter());
        next.push_str(choice);
        next.extend(chars[close + 1..].iter());
        expanded.extend(expand(&next));
    }
    expanded
}

/// Keep a commaless brace pair literal while expanding the text after it.
fn expand_literal_braces(chars: &[char], close: usize) -> Vec<String> {
    let head: String = chars[..=close].iter().collect();
    let tail: String = chars[close + 1..].iter().collect();
    expand(&tail)
        .into_iter()
        .map(|rest| format!("{head}{rest}"))
        .collect()
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
    }
}
