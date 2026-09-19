//! `tsconfig.json` `paths` and `baseUrl` for bare-specifier resolution.
//! A `paths` entry maps one prefix (with at most one `*`) to ordered target
//! bases; each target joins under `baseUrl` (or the tsconfig dir when no
//! base URL is set) and the specifier layer probes extensions from there.
//! Only the first `*` splits; targets without a star match exact specifiers.
//! `extends` chains stay unread — the nearest tsconfig wins, verbatim.

use std::path::{Path, PathBuf};

/// One parsed `paths` entry: the pattern halves plus ordered targets.
#[derive(Debug, Clone)]
struct PathEntry {
    prefix: String,
    suffix: String,
    has_star: bool,
    targets: Vec<String>,
}

/// Parsed compiler options for specifier mapping.
#[derive(Debug, Clone)]
pub struct Tsconfig {
    base_url: PathBuf,
    entries: Vec<PathEntry>,
}

impl Tsconfig {
    /// Candidate bases for a bare specifier, unprobed, in entry order.
    pub(crate) fn candidates(&self, specifier: &str) -> Vec<PathBuf> {
        let mut out = Vec::new();
        for entry in &self.entries {
            if let Some(star) = match_entry(entry, specifier) {
                for target in &entry.targets {
                    out.push(join_target(&self.base_url, target, star));
                }
            }
        }
        out
    }
}

/// Parse tsconfig text from a config living in `dir`, with comments stripped.
pub(crate) fn parse_text(text: &str, dir: &str) -> Option<Tsconfig> {
    parse(text, &PathBuf::from(dir))
}

/// Parse tsconfig text with `//` and `/* */` comments stripped.
fn parse(text: &str, dir: &PathBuf) -> Option<Tsconfig> {
    let stripped = strip_comments(text);
    let json: serde_json::Value = serde_json::from_str(&stripped).ok()?;
    let options = json.get("compilerOptions")?;
    let base_url = options
        .get("baseUrl")
        .and_then(serde_json::Value::as_str)
        .map_or_else(|| dir.clone(), |base| dir.join(base));
    let mut entries = Vec::new();
    if let Some(paths) = options.get("paths").and_then(serde_json::Value::as_object) {
        for (pattern, targets) in paths {
            entries.push(parse_entry(pattern, targets));
        }
    }
    Some(Tsconfig { base_url, entries })
}

/// One `paths` row: split the pattern at its first star, keep string targets.
fn parse_entry(pattern: &str, targets: &serde_json::Value) -> PathEntry {
    let (prefix, suffix, has_star) = match pattern.split_once('*') {
        Some((before, after)) => (before.to_string(), after.to_string(), true),
        None => (pattern.to_string(), String::new(), false),
    };
    let mut kept = Vec::new();
    if let Some(list) = targets.as_array() {
        for target in list {
            if let Some(text) = target.as_str() {
                kept.push(text.to_string());
            }
        }
    }
    PathEntry {
        prefix,
        suffix,
        has_star,
        targets: kept,
    }
}

/// The star span when a specifier matches an entry, else None.
fn match_entry<'a>(entry: &PathEntry, specifier: &'a str) -> Option<Option<&'a str>> {
    if !entry.has_star {
        return exact_match(entry, specifier);
    }
    let rest = specifier.strip_prefix(entry.prefix.as_str())?;
    if entry.suffix.is_empty() {
        return Some(Some(rest));
    }
    let star = rest.strip_suffix(entry.suffix.as_str())?;
    Some(Some(star))
}

/// Exact-pattern match: the whole specifier must equal the prefix.
fn exact_match<'a>(entry: &PathEntry, specifier: &'a str) -> Option<Option<&'a str>> {
    if specifier == entry.prefix {
        Some(None)
    } else {
        None
    }
}

/// Join one target under the base URL, substituting the star span.
fn join_target(base_url: &Path, target: &str, star: Option<&str>) -> PathBuf {
    match target.split_once('*') {
        Some((before, after)) => base_url.join(format!("{before}{}{after}", star.unwrap_or(""))),
        None => base_url.join(target),
    }
}

/// A peekable char stream over tsconfig text.
type CharStream<'a> = std::iter::Peekable<std::str::Chars<'a>>;

/// Strip `//` line and `/* */` block comments, keeping string literals intact.
fn strip_comments(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();
    let mut string: Option<char> = None;
    while let Some(ch) = chars.next() {
        if string.is_some() {
            string = push_string_char(&mut chars, &mut out, ch, string);
        } else if ch == '"' || ch == '\'' {
            string = Some(ch);
            out.push(ch);
        } else if !skip_comment(&mut chars, &mut out, ch) {
            out.push(ch);
        }
    }
    out
}

/// Push one char inside a string literal; the still-open quote, if any.
fn push_string_char(
    chars: &mut CharStream<'_>,
    out: &mut String,
    ch: char,
    string: Option<char>,
) -> Option<char> {
    let quote = string?;
    out.push(ch);
    if ch == '\\' {
        if let Some(escaped) = chars.next() {
            out.push(escaped);
        }
        return Some(quote);
    }
    if ch == quote {
        None
    } else {
        Some(quote)
    }
}

/// Skip a comment opening at `ch`; true when one was skipped.
fn skip_comment(chars: &mut CharStream<'_>, out: &mut String, ch: char) -> bool {
    if ch != '/' {
        return false;
    }
    match chars.peek() {
        Some('/') => {
            skip_line(chars, out);
            true
        }
        Some('*') => {
            chars.next();
            skip_block(chars);
            true
        }
        _ => false,
    }
}

/// Skip a `//` line comment, keeping its newline.
fn skip_line(chars: &mut CharStream<'_>, out: &mut String) {
    for ch in chars.by_ref() {
        if ch == '\n' {
            out.push('\n');
            break;
        }
    }
}

/// Skip a `/* */` block comment through its closer.
fn skip_block(chars: &mut CharStream<'_>) {
    let mut prev = '\0';
    for ch in chars.by_ref() {
        if prev == '*' && ch == '/' {
            break;
        }
        prev = ch;
    }
}

/// Read one `paths` map in tests without touching the filesystem.
#[cfg(test)]
fn parse_test(text: &str) -> Option<Tsconfig> {
    parse(text, &PathBuf::from("/root"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn star_entry_maps_prefix_to_targets() {
        let ts = parse_test(
            r#"{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}"#,
        )
        .unwrap();
        assert_eq!(
            ts.candidates("@/tokens"),
            vec![PathBuf::from("/root/./src/tokens")]
        );
        assert!(ts.candidates("./tokens").is_empty());
    }

    #[test]
    fn exact_entry_matches_whole_specifier() {
        let ts = parse_test(
            r#"{"compilerOptions":{"paths":{"theme":["./src/theme.ts"]}}}"#,
        )
        .unwrap();
        assert_eq!(ts.candidates("theme").len(), 1);
        assert!(ts.candidates("theme/sub").is_empty());
    }

    #[test]
    fn comments_strip_before_parse() {
        let ts = parse_test(
            "// lead\n{\"compilerOptions\": { /* mid */ \"baseUrl\": \".\", \"paths\": {\"@/*\": [\"src/*\"]}}}",
        )
        .unwrap();
        assert_eq!(ts.candidates("@/x").len(), 1);
    }

    #[test]
    fn missing_options_yield_no_entries() {
        let ts = parse_test(r#"{"compilerOptions":{}}"#).unwrap();
        assert!(ts.candidates("@/x").is_empty());
        assert!(parse_test(r#"{"nope": true}"#).is_none());
        assert!(parse_test(r#"not json"#).is_none());
    }
}
