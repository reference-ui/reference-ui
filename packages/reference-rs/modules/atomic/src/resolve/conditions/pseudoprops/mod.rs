//! Named `_` pseudo-prop catalog for atomic `when` tokens.
//! Takes `_hover` / `_dark` after extract stuffed them onto a want. Emits a class
//! segment (`hover`) and a wrap string (selector template or `@media`). Does not
//! apply `&` to a class selector — that is `pseudoselectors`. `sm` / `300` are
//! not in this catalog; `r/` already stamped `@container` onto `when`.

/// Fallback pseudo-prop catalog keyed by stripped name (`hover`, not `_hover`).
pub(crate) const PRESETS: &[(&str, &str)] = &[
    // `_hover` `{ color: 'red' }`  →  `&:is(:hover, [data-hover])`
    ("active", "&:is(:active, [data-active])"),
    (
        "checked",
        "&:is(:checked, [data-checked], [aria-checked=true], [data-state=\"checked\"])",
    ),
    (
        "disabled",
        "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])",
    ),
    ("focus", "&:is(:focus, [data-focus])"),
    ("focusVisible", "&:is(:focus-visible, [data-focus-visible])"),
    ("focusWithin", "&:focus-within"),
    ("hover", "&:is(:hover, [data-hover])"),
    ("motionReduce", "@media (prefers-reduced-motion: reduce)"),
    (
        "motionSafe",
        "@media (prefers-reduced-motion: no-preference)",
    ),
    ("osDark", "@media (prefers-color-scheme: dark)"),
    ("osLight", "@media (prefers-color-scheme: light)"),
    ("print", "@media print"),
];

/// Wrap string for a stripped pseudo-prop name (`hover`, not `_hover`).
pub fn preset_wrap(name: &str) -> Option<&'static str> {
    // `_hover` / `_dark` / `_osDark` after the underscore is stripped
    for (key, val) in PRESETS {
        if *key == name {
            return Some(*val);
        }
    }
    None
}

/// Class name segment for a `_` token. Other prefixes return None.
pub fn class_segment(raw: &str) -> Option<String> {
    raw.strip_prefix('_').map(str::to_string)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preset_wrap_hover_and_dark() {
        assert_eq!(preset_wrap("hover"), Some("&:is(:hover, [data-hover])"));
        assert_eq!(preset_wrap("dark"), None);
        assert_eq!(
            preset_wrap("osDark"),
            Some("@media (prefers-color-scheme: dark)")
        );
        assert_eq!(preset_wrap("wat"), None);
    }

    #[test]
    fn test_class_segment() {
        assert_eq!(class_segment("_hover"), Some("hover".into()));
        assert_eq!(class_segment("sm"), None);
        assert_eq!(class_segment("&:hover"), None);
    }
}
