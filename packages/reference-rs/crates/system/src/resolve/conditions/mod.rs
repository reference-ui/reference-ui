//! Responsive breakpoint and pseudo-condition chain resolution for atomic utilities.
//! Normalizes media queries, pseudo-classes, pseudo-elements, and nested selector hierarchies into deterministic condition paths.
//! Ensures consistent ordering and specificity when generating scoped CSS rules across target viewports.

/// Semantic classification of a lowered condition rule.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoweredCondition {
    Media(String),
    Container(String),
    Selector(String),
}

const BREAKPOINT_TABLE: &[(&str, &str)] = &[
    ("sm", "40rem"),
    ("md", "48rem"),
    ("lg", "64rem"),
    ("xl", "80rem"),
    ("2xl", "96rem"),
];

const CONDITION_PRESETS: &[(&str, &str)] = &[
    ("active", "&:is(:active, [data-active])"),
    ("checked", "&:is(:checked, [data-checked], [aria-checked=true], [data-state=\"checked\"])"),
    ("dark", ".dark &"),
    ("disabled", "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])"),
    ("focus", "&:is(:focus, [data-focus])"),
    ("focusVisible", "&:is(:focus-visible, [data-focus-visible])"),
    ("focusWithin", "&:focus-within"),
    ("hover", "&:is(:hover, [data-hover])"),
    ("light", ".light &"),
    ("motionReduce", "@media (prefers-reduced-motion: reduce)"),
    ("motionSafe", "@media (prefers-reduced-motion: no-preference)"),
    ("osDark", "@media (prefers-color-scheme: dark)"),
    ("osLight", "@media (prefers-color-scheme: light)"),
    ("print", "@media print"),
];

fn lookup_breakpoint_media(name: &str) -> Option<String> {
    for (bp_name, min_w) in BREAKPOINT_TABLE {
        if *bp_name == name {
            return Some(format!("@media screen and (min-width: {min_w})"));
        }
    }
    None
}

fn lookup_preset_condition(name: &str) -> Option<&'static str> {
    for (key, val) in CONDITION_PRESETS {
        if *key == name {
            return Some(*val);
        }
    }
    None
}

/// Normalizes a condition token into its canonical class name segment.
pub fn finalize_condition_name(raw: &str) -> Option<String> {
    if raw == "base" {
        return None;
    }
    if let Some(stripped) = raw.strip_prefix('_') {
        return Some(stripped.to_string());
    }
    if raw.starts_with('&') || raw.starts_with('@') {
        let sanitized = raw.trim().replace(' ', "_");
        return Some(format!("[{sanitized}]"));
    }
    Some(raw.to_string())
}

/// Lowers a condition token into its CSS at-rule or selector transformation.
pub fn lower_condition(raw: &str) -> LoweredCondition {
    let key = raw.strip_prefix('_').unwrap_or(raw);

    if let Some(media) = lookup_breakpoint_media(key) {
        return LoweredCondition::Media(media);
    }

    if let Some(preset) = lookup_preset_condition(key) {
        if preset.starts_with("@media") {
            return LoweredCondition::Media(preset.to_string());
        }
        return LoweredCondition::Selector(preset.to_string());
    }

    if key.starts_with("@media") {
        return LoweredCondition::Media(key.to_string());
    }
    if key.starts_with("@container") {
        return LoweredCondition::Container(key.to_string());
    }

    if key.contains('&') {
        LoweredCondition::Selector(key.to_string())
    } else {
        LoweredCondition::Selector(format!("&:{key}"))
    }
}

/// Applies a selector condition template (e.g. `&:hover` or `.dark &`) to a class selector.
pub fn apply_selector_condition(template: &str, class_selector: &str) -> String {
    if template.contains('&') {
        template.replace('&', class_selector)
    } else {
        format!("{class_selector}{template}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_finalize_condition_name() {
        assert_eq!(finalize_condition_name("base"), None);
        assert_eq!(finalize_condition_name("_hover"), Some("hover".into()));
        assert_eq!(finalize_condition_name("sm"), Some("sm".into()));
        assert_eq!(
            finalize_condition_name("&[data-slot=inner]"),
            Some("[&[data-slot=inner]]".into())
        );
    }

    #[test]
    fn test_lower_breakpoints() {
        match lower_condition("sm") {
            LoweredCondition::Media(m) => {
                assert_eq!(m, "@media screen and (min-width: 40rem)")
            }
            _ => panic!("expected media query"),
        }
        match lower_condition("_md") {
            LoweredCondition::Media(m) => {
                assert_eq!(m, "@media screen and (min-width: 48rem)")
            }
            _ => panic!("expected media query"),
        }
    }

    #[test]
    fn test_lower_presets() {
        match lower_condition("_hover") {
            LoweredCondition::Selector(s) => {
                assert_eq!(s, "&:is(:hover, [data-hover])")
            }
            _ => panic!("expected selector"),
        }
        match lower_condition("_dark") {
            LoweredCondition::Selector(s) => assert_eq!(s, ".dark &"),
            _ => panic!("expected selector"),
        }
    }

    #[test]
    fn test_apply_selector_condition() {
        let res = apply_selector_condition("&:is(:hover, [data-hover])", ".hover\\:bg_red");
        assert_eq!(res, ".hover\\:bg_red:is(:hover, [data-hover])");

        let dark_res = apply_selector_condition(".dark &", ".dark\\:bg_red");
        assert_eq!(dark_res, ".dark .dark\\:bg_red");
    }
}
