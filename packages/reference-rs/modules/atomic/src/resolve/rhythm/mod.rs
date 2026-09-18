//! Rhythm calculation engine for resolving Reference UI `r` unit dimensions into absolute or relative CSS values.
//! Translates base grid units and fractional rhythm steps into standard `var(--spacing-root)` and `calc()` expressions.
//! Guarantees vertical rhythm consistency and spatial rhythm alignment across design systems.

use std::borrow::Cow;

fn format_denom_rhythm(num: f64, denom: f64) -> String {
    if (num - 1.0).abs() < f64::EPSILON {
        // 1/3r
        format!("calc(var(--spacing-root) / {denom})")
    } else if (num + 1.0).abs() < f64::EPSILON {
        // -1/3r
        format!("calc(-1 * var(--spacing-root) / {denom})")
    } else {
        // 2/3r
        format!("calc({num} * var(--spacing-root) / {denom})")
    }
}

fn format_single_rhythm(num: f64) -> String {
    if (num - 1.0).abs() < f64::EPSILON {
        // 1r / r / +r
        "var(--spacing-root)".to_string()
    } else if (num + 1.0).abs() < f64::EPSILON {
        // -r
        "calc(-1 * var(--spacing-root))".to_string()
    } else {
        // 2r / -2r / 0.5r
        format!("calc({num} * var(--spacing-root))")
    }
}

/// Resolves a rhythm unit count to a CSS calc or variable expression.
pub fn get_rhythm(num: f64, denom: Option<f64>) -> String {
    // 2r  /  1/3r
    match denom {
        Some(d) => format_denom_rhythm(num, d),
        None => format_single_rhythm(num),
    }
}

/// Resolves a single rhythm token string (e.g. `1r`, `1/3r`, `-2/3r`) to its CSS equivalent.
pub fn resolve_single_rhythm(val: &str) -> Option<String> {
    let raw = val.strip_suffix('r')?;
    if raw.is_empty() || raw == "+" {
        // r  /  +r
        return Some(get_rhythm(1.0, None));
    }
    if raw == "-" {
        // -r
        return Some(get_rhythm(-1.0, None));
    }

    if let Some((num_str, denom_str)) = parse_fraction_parts(raw) {
        // 1/3r  /  -2/3r
        let num: f64 = num_str.parse().ok()?;
        let denom: f64 = denom_str.parse().ok()?;
        if denom == 0.0 {
            return None;
        }
        return Some(get_rhythm(num, Some(denom)));
    }

    // 2r  /  0.5r  /  -2r
    let n: f64 = raw.parse().ok()?;
    Some(get_rhythm(n, None))
}

fn parse_fraction_parts(raw: &str) -> Option<(&str, &str)> {
    // 1/3  /  -2/3
    let slash_idx = raw.find('/')?;
    if slash_idx == 0 || slash_idx != raw.rfind('/')? {
        return None;
    }
    let num_str = &raw[..slash_idx];
    let denom_str = &raw[slash_idx + 1..];
    Some((num_str, denom_str))
}

/// Resolves all rhythm units in an arbitrary CSS value string, passing through non-rhythm tokens.
pub fn resolve_rhythm(val: &str) -> Cow<'_, str> {
    // '2r'  /  '1px solid 1/3r'  /  '10px auto'  /  'calc(1px + 1r)'
    if !val.contains('r') {
        return Cow::Borrowed(val);
    }
    let resolved = resolve_fragments(val);
    if resolved == val {
        Cow::Borrowed(val)
    } else {
        Cow::Owned(resolved)
    }
}

/// Resolve rhythm words outside `var()`/`url()`/`env()`, keeping separators verbatim.
fn resolve_fragments(val: &str) -> String {
    let mut scan = FragmentScan::new(val.len());
    for frag in split_fragments(val) {
        scan.push_fragment(frag);
    }
    scan.finish()
}

/// Scan state tracking function nesting while fragments stream through.
struct FragmentScan<'a> {
    out: String,
    fn_stack: Vec<Option<&'a str>>,
    pending_name: Option<&'a str>,
}

impl<'a> FragmentScan<'a> {
    fn new(capacity: usize) -> Self {
        Self {
            out: String::with_capacity(capacity * 2),
            fn_stack: Vec::new(),
            pending_name: None,
        }
    }

    fn push_fragment(&mut self, frag: &'a str) {
        match frag {
            "(" => self.push_paren(),
            ")" => self.pop_paren(),
            _ if is_word_fragment(frag) => self.push_word(frag),
            _ => self.out.push_str(frag),
        }
    }

    fn push_paren(&mut self) {
        self.fn_stack.push(self.pending_name.take());
        self.out.push('(');
    }

    fn pop_paren(&mut self) {
        self.fn_stack.pop();
        self.out.push(')');
    }

    fn push_word(&mut self, frag: &'a str) {
        self.pending_name = Some(frag);
        resolve_word(frag, &self.fn_stack, &mut self.out);
    }

    fn finish(self) -> String {
        self.out
    }
}

/// Resolve one word unless a `var()`/`url()`/`env()` ancestor protects it.
fn resolve_word(frag: &str, fn_stack: &[Option<&str>], out: &mut String) {
    if fn_stack.iter().any(|f| f.is_some_and(is_protected_name)) {
        // var(--spacing-y, 1r)  — fallback stays literal (core parity)
        out.push_str(frag);
    } else if let Some(resolved) = resolve_single_rhythm(frag) {
        // 2r  /  1/3r
        out.push_str(&resolved);
    } else {
        out.push_str(frag);
    }
}

/// True for the function bodies core never resolves rhythm inside.
fn is_protected_name(name: &str) -> bool {
    name.eq_ignore_ascii_case("var")
        || name.eq_ignore_ascii_case("url")
        || name.eq_ignore_ascii_case("env")
}

/// Split a value into word and delimiter fragments, keeping every separator.
fn split_fragments(val: &str) -> Vec<&str> {
    // 'calc(1px + 1r)'  →  ['calc', '(', '1px', ' ', '+', ' ', '1r', ')']
    let mut frags = Vec::new();
    let mut start = 0;
    let mut word_open = false;
    for (idx, ch) in val.char_indices() {
        if is_fragment_delimiter(ch) {
            if word_open {
                frags.push(&val[start..idx]);
                word_open = false;
            }
            frags.push(&val[idx..idx + ch.len_utf8()]);
        } else if !word_open {
            start = idx;
            word_open = true;
        }
    }
    if word_open {
        frags.push(&val[start..]);
    }
    frags
}

/// True for fragment boundaries: whitespace, parens, commas, and `*`.
/// `/` stays in words so fractions (`1/3r`) survive; signs stay for `-2r`.
fn is_fragment_delimiter(ch: char) -> bool {
    ch.is_whitespace() || matches!(ch, '(' | ')' | ',' | '*')
}

/// True when the fragment opens with a word character rather than a delimiter.
fn is_word_fragment(frag: &str) -> bool {
    frag.chars()
        .next()
        .is_some_and(|ch| !is_fragment_delimiter(ch))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_rhythm() {
        assert_eq!(resolve_rhythm("r"), "var(--spacing-root)");
        assert_eq!(resolve_rhythm("+r"), "var(--spacing-root)");
        assert_eq!(resolve_rhythm("1r"), "var(--spacing-root)");
        assert_eq!(resolve_rhythm("-r"), "calc(-1 * var(--spacing-root))");
    }

    #[test]
    fn test_multipliers_and_decimals() {
        assert_eq!(resolve_rhythm("2r"), "calc(2 * var(--spacing-root))");
        assert_eq!(resolve_rhythm("0.5r"), "calc(0.5 * var(--spacing-root))");
        assert_eq!(resolve_rhythm("1.5r"), "calc(1.5 * var(--spacing-root))");
        assert_eq!(resolve_rhythm("-2r"), "calc(-2 * var(--spacing-root))");
    }

    #[test]
    fn test_fractions() {
        assert_eq!(resolve_rhythm("1/3r"), "calc(var(--spacing-root) / 3)");
        assert_eq!(resolve_rhythm("2/3r"), "calc(2 * var(--spacing-root) / 3)");
        assert_eq!(
            resolve_rhythm("-1/3r"),
            "calc(-1 * var(--spacing-root) / 3)"
        );
        assert_eq!(
            resolve_rhythm("-2/3r"),
            "calc(-2 * var(--spacing-root) / 3)"
        );
    }

    #[test]
    fn test_multi_value_pass_through() {
        assert_eq!(
            resolve_rhythm("1r 2r"),
            "var(--spacing-root) calc(2 * var(--spacing-root))"
        );
        assert_eq!(
            resolve_rhythm("1px solid 1/3r"),
            "1px solid calc(var(--spacing-root) / 3)"
        );
        assert_eq!(resolve_rhythm("10px auto"), "10px auto");
    }

    #[test]
    fn test_math_function_bodies_resolve() {
        // Core battery: rhythm inside calc/min/max/clamp resolves.
        assert_eq!(
            resolve_rhythm("calc(1px + 1r)"),
            "calc(1px + var(--spacing-root))"
        );
        assert_eq!(
            resolve_rhythm("min(1r, 10px)"),
            "min(var(--spacing-root), 10px)"
        );
        assert_eq!(
            resolve_rhythm("calc(min(1r, 10px) + 2r)"),
            "calc(min(var(--spacing-root), 10px) + calc(2 * var(--spacing-root)))"
        );
    }

    #[test]
    fn test_var_url_env_bodies_stay_literal() {
        // Core parity: var/url/env subtrees never resolve.
        assert_eq!(resolve_rhythm("var(--spacing-y, 1r)"), "var(--spacing-y, 1r)");
        assert_eq!(resolve_rhythm("var(--x)"), "var(--x)");
        assert_eq!(resolve_rhythm("url(1r.png)"), "url(1r.png)");
        assert_eq!(
            resolve_rhythm("env(safe-area-inset-top)"),
            "env(safe-area-inset-top)"
        );
    }
}
