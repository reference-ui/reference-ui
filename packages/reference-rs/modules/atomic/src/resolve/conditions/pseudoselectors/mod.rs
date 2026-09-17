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
