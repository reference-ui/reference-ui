//! Selector-template application for atomic utilities.
//! Takes an `&` wrap (`&:is(:hover, [data-hover])`, `[data-color-mode=dark] &`, or a raw `css()`
//! key) plus the escaped class selector. Emits the CSS selector the stylesheet
//! prints. Does not own the `_` catalog — that is `pseudoprops`. `@media` /
//! `@container` strings are at-rules, not selector templates.

#[derive(Default)]
struct SelectorQuoteState {
    in_single: bool,
    in_double: bool,
    escaped: bool,
}

enum Action {
    Keep,
    Substitute,
}

impl SelectorQuoteState {
    fn step(&mut self, ch: char) -> Action {
        if self.escaped {
            self.escaped = false;
            return Action::Keep;
        }
        if ch == '\\' {
            self.escaped = true;
            return Action::Keep;
        }
        if ch == '\'' && !self.in_double {
            self.in_single = !self.in_single;
            return Action::Keep;
        }
        if ch == '"' && !self.in_single {
            self.in_double = !self.in_double;
            return Action::Keep;
        }
        if ch == '&' && !self.in_single && !self.in_double {
            return Action::Substitute;
        }
        Action::Keep
    }
}

/// Substitute `&` in a template with the utility class selector, preserving literal `&` in quotes.
pub fn apply(template: &str, class_selector: &str) -> String {
    if !template.contains('&') {
        return format!("{class_selector}{template}");
    }
    let mut out = String::with_capacity(template.len() + class_selector.len());
    let mut state = SelectorQuoteState::default();
    for ch in template.chars() {
        match state.step(ch) {
            Action::Keep => out.push(ch),
            Action::Substitute => out.push_str(class_selector),
        }
    }
    out
}

/// Scanner for top-level selector structure. Tracks quotes, escapes, and
/// paren/bracket depth so commas and combinators inside functional pseudos,
/// attributes, and strings are never treated as selector structure.
struct SelectorScan {
    quote: Option<char>,
    escaped: bool,
    depth: usize,
}

impl SelectorScan {
    fn new() -> Self {
        Self {
            quote: None,
            escaped: false,
            depth: 0,
        }
    }

    fn step(&mut self, ch: char) {
        if self.escaped {
            self.escaped = false;
            return;
        }
        if ch == '\\' {
            self.escaped = true;
            return;
        }
        if self.quote.is_some() {
            self.step_quoted(ch);
        } else {
            self.step_bare(ch);
        }
    }

    /// Inside a string only the matching quote matters.
    fn step_quoted(&mut self, ch: char) {
        if Some(ch) == self.quote {
            self.quote = None;
        }
    }

    /// Outside strings, quotes open and brackets nest.
    fn step_bare(&mut self, ch: char) {
        match ch {
            '\'' | '"' => self.quote = Some(ch),
            '(' | '[' => self.depth += 1,
            ')' | ']' => self.depth = self.depth.saturating_sub(1),
            _ => {}
        }
    }

    fn top_level(&self) -> bool {
        self.quote.is_none() && self.depth == 0
    }
}

/// Split a selector list on top-level commas, ignoring commas inside
/// quotes, parens, and brackets. Members are trimmed; empties are dropped.
fn split_selector_list(selector: &str) -> Vec<&str> {
    let mut members = Vec::new();
    let mut scan = SelectorScan::new();
    let mut start = 0;
    for (idx, ch) in selector.char_indices() {
        scan.step(ch);
        if ch == ',' && scan.top_level() {
            members.push(selector[start..idx].trim());
            start = idx + ch.len_utf8();
        }
    }
    members.push(selector[start..].trim());
    members.retain(|member| !member.is_empty());
    members
}

/// True when a comma member needs `:is()` armour: it carries a top-level
/// combinator (`>`, `+`, `~`, or descendant space) that reparsing would
/// reattach to the surrounding selector.
fn member_needs_is_wrap(member: &str) -> bool {
    let member = member.trim();
    if member.is_empty() {
        return false;
    }
    let mut scan = SelectorScan::new();
    for ch in member.chars() {
        scan.step(ch);
        if !scan.top_level() {
            continue;
        }
        if ch == '>' || ch == '+' || ch == '~' || ch.is_whitespace() {
            return true;
        }
    }
    false
}

/// Substitute `&` with a parent selector list, distributing over comma
/// members and wrapping combinator members in `:is()`.
///
/// The global walker nests author keys under author selectors, which may be
/// comma lists whose members contain combinators. Textual substitution
/// mis-scopes those (`a, b` under `& ~ &` prints `a, b ~ a, b`, matching
/// bare `a`); per-member substitution with `:is()` armour keeps the author's
/// grouping. Members without a top-level combinator substitute bare, and a
/// single plain parent behaves exactly like [`apply`].
pub fn apply_distributed(template: &str, parent: &str) -> String {
    let members = split_selector_list(parent);
    let single_plain =
        matches!(members.as_slice(), [only] if !member_needs_is_wrap(only));
    if single_plain || members.is_empty() {
        return apply(template, parent);
    }
    members
        .iter()
        .map(|member| {
            let armoured = if member_needs_is_wrap(member) {
                format!(":is({member})")
            } else {
                (*member).to_string()
            };
            apply(template, &armoured)
        })
        .collect::<Vec<_>>()
        .join(", ")
}

/// True when a style-object key carries an unquoted `&` parent reference,
/// making it a selector condition even when it does not start with `&`
/// (`'input:hover &'`, `':focus > &'`). A `&` that only appears inside
/// quotes is a literal, not a reference.
pub fn has_parent_reference(key: &str) -> bool {
    if !key.contains('&') {
        return false;
    }
    let mut state = SelectorQuoteState::default();
    for ch in key.chars() {
        if matches!(state.step(ch), Action::Substitute) {
            return true;
        }
    }
    false
}

/// Wrap for a raw `&` key or unknown leftover name (`foo` → `&:foo`).
pub fn template_for_key(key: &str) -> String {
    if key.contains('&') {
        // `&[data-slot=inner]`
        key.to_string()
    } else {
        // unknown `foo` after `_foo` missed the catalog
        format!("&:{key}")
    }
}

/// Class name segment for `&` / `@` keys. `_` tokens return None.
pub fn class_segment(raw: &str) -> Option<String> {
    if raw.starts_with('&') || raw.starts_with('@') {
        // `&[data-slot=inner]` → `[&[data-slot=inner]]`
        let sanitized = raw.trim().replace(' ', "_");
        Some(format!("[{sanitized}]"))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_apply() {
        let hover = apply("&:is(:hover, [data-hover])", ".hover\\:bg_red");
        assert_eq!(hover, ".hover\\:bg_red:is(:hover, [data-hover])");

        let dark = apply("[data-color-mode=dark] &", ".dark\\:bg_red");
        assert_eq!(dark, "[data-color-mode=dark] .dark\\:bg_red");

        let in_quotes = apply("&[data-x=\"a & b\"]", ".cls");
        assert_eq!(in_quotes, ".cls[data-x=\"a & b\"]");

        let list = apply("&:not(:first-child), &:only-child", ".cls");
        assert_eq!(list, ".cls:not(:first-child), .cls:only-child");
    }

    #[test]
    fn test_apply_distributed() {
        assert_eq!(apply_distributed("&:hover", ".btn"), ".btn:hover");
        assert_eq!(
            apply_distributed("& .kid", ".a, .b"),
            ".a .kid, .b .kid"
        );
        assert_eq!(apply_distributed("& ~ &", ".a, .b"), ".a ~ .a, .b ~ .b");
        assert_eq!(
            apply_distributed("& ~ &", "body > p, body > ul"),
            ":is(body > p) ~ :is(body > p), :is(body > ul) ~ :is(body > ul)"
        );
        assert_eq!(
            apply_distributed("& ~ &", ".stack > p"),
            ":is(.stack > p) ~ :is(.stack > p)"
        );
        assert_eq!(
            apply_distributed("[data-color-mode=dark] &", ":root, body"),
            "[data-color-mode=dark] :root, [data-color-mode=dark] body"
        );
        assert_eq!(
            apply_distributed("&:hover", ".a:is(.x, .y)"),
            ".a:is(.x, .y):hover"
        );
        assert_eq!(
            apply_distributed("&[data-x=\"a, b\"]", ".a, .b"),
            ".a[data-x=\"a, b\"], .b[data-x=\"a, b\"]"
        );
    }

    #[test]
    fn test_has_parent_reference() {
        assert!(has_parent_reference("&:hover"));
        assert!(has_parent_reference("input:hover &"));
        assert!(has_parent_reference(":focus > &"));
        assert!(has_parent_reference("div:focus > &"));
        assert!(has_parent_reference("&[data-x=\"a & b\"]"));
        assert!(!has_parent_reference("_hover"));
        assert!(!has_parent_reference("color"));
        assert!(!has_parent_reference("[data-x=\"a & b\"]"));
    }

    #[test]
    fn test_template_for_key() {
        assert_eq!(template_for_key("&[data-slot=inner]"), "&[data-slot=inner]");
        assert_eq!(template_for_key("foo"), "&:foo");
    }

    #[test]
    fn test_class_segment() {
        assert_eq!(
            class_segment("&[data-slot=inner]"),
            Some("[&[data-slot=inner]]".into())
        );
        assert_eq!(class_segment("_hover"), None);
    }
}
