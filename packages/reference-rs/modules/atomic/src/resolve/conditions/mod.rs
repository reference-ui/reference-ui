//! Join point for the `_` catalog and `&` selector application.
//! Takes a `when` token and emits `LoweredCondition` plus a class-name segment
//! so stylesheet and `css()` share one wrap. Named lookup lives in
//! `pseudoprops`; `&` application lives in `pseudoselectors`. Already-concrete
//! `@media` / `@container` strings pass through. This file does not look up `sm`.

pub mod pseudoprops;
pub mod pseudoselectors;

/// Semantic classification of a lowered condition wrap.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoweredCondition {
    Media(String),
    Container(String),
    Selector(String),
}

/// Class name segment for a `when` token. `base` is not a prefix.
pub fn finalize_condition_name(raw: &str) -> Option<String> {
    if raw == "base" {
        // mt={['1r', '2r']} slot 0 — not a class prefix
        return None;
    }
    if let Some(name) = pseudoprops::class_segment(raw) {
        return Some(name);
    }
    pseudoselectors::class_segment(raw)
}

/// Lower a `when` token into a selector template or at-rule.
pub fn lower_condition(raw: &str) -> LoweredCondition {
    let key = raw.strip_prefix('_').unwrap_or(raw);
    if let Some(preset) = pseudoprops::preset_wrap(key) {
        return wrap_preset(preset);
    }
    at_rule_or_selector(key)
}

fn wrap_preset(preset: &str) -> LoweredCondition {
    if preset.starts_with("@media") {
        // `_osDark` → `@media (prefers-color-scheme: dark)`
        LoweredCondition::Media(preset.to_string())
    } else {
        // `_hover` → `&:is(:hover, [data-hover])`
        LoweredCondition::Selector(preset.to_string())
    }
}

fn at_rule_or_selector(key: &str) -> LoweredCondition {
    if key.starts_with("@media") {
        // `@media print`
        return LoweredCondition::Media(key.to_string());
    }
    if key.starts_with("@container") {
        // `@container (min-width: 300px)` from `r/`
        return LoweredCondition::Container(key.to_string());
    }
    LoweredCondition::Selector(pseudoselectors::template_for_key(key))
}

pub use pseudoselectors::apply as apply_selector_condition;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_finalize_condition_name() {
        assert_eq!(finalize_condition_name("base"), None);
        assert_eq!(finalize_condition_name("_hover"), Some("hover".into()));
        assert_eq!(finalize_condition_name("sm"), None);
        assert_eq!(
            finalize_condition_name("&[data-slot=inner]"),
            Some("[&[data-slot=inner]]".into())
        );
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
    fn test_container_passthrough() {
        match lower_condition("@container (min-width: 640px)") {
            LoweredCondition::Container(m) => {
                assert_eq!(m, "@container (min-width: 640px)")
            }
            _ => panic!("expected container query"),
        }
    }
}
