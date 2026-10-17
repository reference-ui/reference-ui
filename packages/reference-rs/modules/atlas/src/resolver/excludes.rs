//! Drops tracked components that match the configured `exclude` patterns, after discovery and before usage counts.
//! A `source:Name` pattern removes one named component, a `@scope/...` pattern never matches a local path, and any
//! other pattern is a glob matched against the component's app-relative path. Globs compile to anchored regexes
//! where `*` stays inside one path segment and `**` crosses segments.

use crate::config::AtlasConfig;
use crate::internal::ComponentTemplate;
use regex::Regex;
use std::collections::BTreeMap;
use std::iter::Peekable;
use std::path::Path;
use std::str::Chars;

pub(crate) fn apply_excludes(
    tracked: &mut BTreeMap<String, ComponentTemplate>,
    config: &AtlasConfig,
    app_root: &Path,
) {
    let excludes = config.exclude.clone().unwrap_or_default();
    if excludes.is_empty() {
        return;
    }

    tracked.retain(|_, template| {
        !excludes.iter().any(|pattern| {
            if let Some((source, name)) = pattern.split_once(':') {
                return template.source == source && template.name == name;
            }
            if pattern.starts_with('@') {
                return false;
            }
            let relative = template.app_relative_path.clone().unwrap_or_else(|| {
                template
                    .file_path
                    .strip_prefix(app_root)
                    .ok()
                    .map(|path| path.to_string_lossy().replace('\\', "/"))
                    .unwrap_or_default()
            });
            glob_match(pattern, &relative)
        })
    });
}

fn glob_match(pattern: &str, value: &str) -> bool {
    let anchored = glob_to_regex(pattern);
    Regex::new(&anchored)
        .map(|re| re.is_match(value))
        .unwrap_or(false)
}

fn glob_to_regex(pattern: &str) -> String {
    let mut out = String::from("^");
    let mut chars = pattern.chars().peekable();
    while let Some(ch) = chars.next() {
        push_glob_char(&mut out, ch, &mut chars);
    }
    out.push('$');
    out
}

fn push_glob_char(out: &mut String, ch: char, chars: &mut Peekable<Chars<'_>>) {
    match ch {
        '*' => push_star(out, chars),
        '/' => out.push('/'),
        other => out.push_str(&regex::escape(&other.to_string())),
    }
}

/// A doubled `**` spans segments; a single `*` must not cross a `/`.
fn push_star(out: &mut String, chars: &mut Peekable<Chars<'_>>) {
    if chars.peek() == Some(&'*') {
        chars.next();
        out.push_str(".*");
    } else {
        out.push_str("[^/]*");
    }
}
