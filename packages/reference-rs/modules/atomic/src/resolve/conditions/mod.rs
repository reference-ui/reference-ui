//! Pseudo-condition and at-rule lowering for atomic utilities.
//! Named breakpoint keys are handed to `r/`; this file does not own the query language.
//! This file only knows language: `_hover` presets, `&` selectors, and already-concrete `@media` / `@container` keys.

use crate::config::BreakpointScale;
use crate::resolve::r;

/// Semantic classification of a lowered condition rule.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoweredCondition {
    Media(String),
    Container(String),
    Selector(String),
}

const CONDITION_PRESETS: &[(&str, &str)] = &[
    // `_hover` `{ color: 'red' }`  →  `&:is(:hover, [data-hover])`
    ("active", "&:is(:active, [data-active])"),
    (
        "checked",
        "&:is(:checked, [data-checked], [aria-checked=true], [data-state=\"checked\"])",
    ),
    ("dark", ".dark &"),
    (
        "disabled",
        "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])",
    ),
    ("focus", "&:is(:focus, [data-focus])"),
    ("focusVisible", "&:is(:focus-visible, [data-focus-visible])"),
    ("focusWithin", "&:focus-within"),
    ("hover", "&:is(:hover, [data-hover])"),
    ("light", ".light &"),
    ("motionReduce", "@media (prefers-reduced-motion: reduce)"),
    (
        "motionSafe",
        "@media (prefers-reduced-motion: no-preference)",
    ),
    ("osDark", "@media (prefers-color-scheme: dark)"),
    ("osLight", "@media (prefers-color-scheme: light)"),
    ("print", "@media print"),
];

fn lookup_preset_condition(name: &str) -> Option<&'static str> {
    // `_hover` / `_dark` / `_osDark` after the underscore is stripped
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
        // mt={['1r', '2r']} slot 0 — not a class prefix
        return None;
    }
    if let Some(stripped) = raw.strip_prefix('_') {
        // `_hover` → `hover`
        return Some(stripped.to_string());
    }
    if raw.starts_with('&') || raw.starts_with('@') {
        // `&[data-slot=inner]` → `[&[data-slot=inner]]`
        let sanitized = raw.trim().replace(' ', "_");
        return Some(format!("[{sanitized}]"));
    }
    // `sm`
    Some(raw.to_string())
}

/// Lowers a condition token into its CSS at-rule or selector transformation.
pub fn lower_condition(raw: &str, scale: &BreakpointScale) -> LoweredCondition {
    let key = raw.strip_prefix('_').unwrap_or(raw);

    if let Some(query) = r::lower_r_key(key, scale) {
        // `sm` / `_md` / `300` → `@container (min-width: Npx)`
        return LoweredCondition::Container(query);
    }

    if let Some(preset) = lookup_preset_condition(key) {
        if preset.starts_with("@media") {
            // `_osDark` → `@media (prefers-color-scheme: dark)`
            return LoweredCondition::Media(preset.to_string());
        }
        // `_hover` → `&:is(:hover, [data-hover])`
        // `_dark` → `.dark &`
        return LoweredCondition::Selector(preset.to_string());
    }

    if key.starts_with("@media") {
        // `@media print`
        return LoweredCondition::Media(key.to_string());
    }
    if key.starts_with("@container") {
        // `@container (min-width: 300px)`
        return LoweredCondition::Container(key.to_string());
    }

    if key.contains('&') {
        // `&[data-slot=inner]`
        LoweredCondition::Selector(key.to_string())
    } else {
        // unknown `foo` → `&:foo`
        LoweredCondition::Selector(format!("&:{key}"))
    }
}

/// Applies a selector condition template (e.g. `&:hover` or `.dark &`) to a class selector.
pub fn apply_selector_condition(template: &str, class_selector: &str) -> String {
    if template.contains('&') {
        // `&:is(:hover, [data-hover])` + `.hover\:bg_red`
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
        let scale = BreakpointScale::default_scale();
        match lower_condition("sm", &scale) {
            LoweredCondition::Container(m) => {
                assert_eq!(m, "@container (min-width: 640px)")
            }
            _ => panic!("expected container query"),
        }
        match lower_condition("_md", &scale) {
            LoweredCondition::Container(m) => {
                assert_eq!(m, "@container (min-width: 768px)")
            }
            _ => panic!("expected container query"),
        }
    }

    #[test]
    fn test_lower_custom_token_breakpoints() {
        let mut map = indexmap::IndexMap::new();
        map.insert("wide".to_string(), serde_json::json!("1200px"));
        let scale = BreakpointScale::from_config(&crate::config::BreakpointConfig::Map(map));
        match lower_condition("wide", &scale) {
            LoweredCondition::Container(m) => {
                assert_eq!(m, "@container (min-width: 1200px)")
            }
            _ => panic!("expected container query"),
        }
    }

    #[test]
    fn test_lower_presets() {
        let scale = BreakpointScale::default_scale();
        match lower_condition("_hover", &scale) {
            LoweredCondition::Selector(s) => {
                assert_eq!(s, "&:is(:hover, [data-hover])")
            }
            _ => panic!("expected selector"),
        }
        match lower_condition("_dark", &scale) {
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
