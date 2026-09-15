//! Selector-template application for atomic utilities.
//! Takes an `&` wrap (`&:is(:hover, [data-hover])`, `[data-panda-theme=dark] &`, or a raw `css()`
//! key) plus the escaped class selector. Emits the CSS selector the stylesheet
//! prints. Does not own the `_` catalog — that is `pseudoprops`. `@media` /
//! `@container` strings are at-rules, not selector templates.

/// Substitute `&` in a template with the utility class selector.
pub fn apply(template: &str, class_selector: &str) -> String {
    if template.contains('&') {
        // `&:is(:hover, [data-hover])` + `.hover\:bg_red`
        template.replace('&', class_selector)
    } else {
        format!("{class_selector}{template}")
    }
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

        let dark = apply("[data-panda-theme=dark] &", ".dark\\:bg_red");
        assert_eq!(dark, "[data-panda-theme=dark] .dark\\:bg_red");
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
