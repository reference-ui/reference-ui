//! Join point for the `_` catalog and `&` selector application.
//! Takes a `when` token and emits `LoweredCondition` plus a class-name segment
//! so stylesheet and `css()` share one wrap. Named `_` keys ask `BaseSystem`
//! first. Presets remain only for keys the utterance does not list. Named
//! breakpoint tokens lower to `@container (min-width: Npx)` from the scale.

pub mod pseudoprops;
pub mod pseudoselectors;

use base_system::BaseSystem;

/// Semantic classification of a lowered condition wrap.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoweredCondition {
    Media(String),
    Container(String),
    Selector(String),
}

/// Class name segment for a `when` token. `base` is not a prefix.
pub fn finalize_condition_name(raw: &str, system: &BaseSystem) -> Option<String> {
    if raw == "base" {
        return None;
    }
    if let Some(name) = pseudoprops::class_segment(raw) {
        return Some(name);
    }
    if let Some(name) = pseudoselectors::class_segment(raw) {
        return Some(name);
    }
    if is_named_breakpoint(raw, system) {
        Some(raw.to_string())
    } else {
        None
    }
}

/// Lower a `when` token into a selector template or at-rule.
pub fn lower_condition(raw: &str, system: &BaseSystem) -> LoweredCondition {
    if let Some(preset) = named_wrap(raw, system) {
        return wrap_preset(preset);
    }
    if is_named_breakpoint(raw, system) {
        return named_breakpoint_wrap(raw, system);
    }
    let key = raw.strip_prefix('_').unwrap_or(raw);
    at_rule_or_selector(key)
}

fn is_named_breakpoint(raw: &str, system: &BaseSystem) -> bool {
    raw != "base" && system.breakpoints().names().iter().any(|name| name == raw)
}

fn named_breakpoint_wrap(raw: &str, system: &BaseSystem) -> LoweredCondition {
    match system.breakpoints().width_px(raw) {
        Some(width) => LoweredCondition::Container(format!("@container (min-width: {width}px)")),
        None => LoweredCondition::Selector("&".to_string()),
    }
}

fn named_wrap<'a>(raw: &'a str, system: &'a BaseSystem) -> Option<&'a str> {
    if let Some(wrap) = system.get_condition(raw) {
        return Some(wrap);
    }
    let key = raw.strip_prefix('_').unwrap_or(raw);
    pseudoprops::preset_wrap(key)
}

fn wrap_preset(preset: &str) -> LoweredCondition {
    if preset.starts_with("@media") {
        LoweredCondition::Media(preset.to_string())
    } else {
        LoweredCondition::Selector(preset.to_string())
    }
}

fn at_rule_or_selector(key: &str) -> LoweredCondition {
    if key.starts_with("@media") {
        return LoweredCondition::Media(key.to_string());
    }
    if key.starts_with("@container") {
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
        assert_eq!(
            finalize_condition_name("base", &BaseSystem::default()),
            None
        );
        assert_eq!(
            finalize_condition_name("_hover", &BaseSystem::default()),
            Some("hover".into())
        );
        assert_eq!(finalize_condition_name("sm", &BaseSystem::default()), None);
        assert_eq!(
            finalize_condition_name("sm", BaseSystem::lib_fixture()),
            Some("sm".into())
        );
        assert_eq!(
            finalize_condition_name("&[data-slot=inner]", &BaseSystem::default()),
            Some("[&[data-slot=inner]]".into())
        );
    }

    fn assert_selector(raw: &str, expected: &str, system: &BaseSystem) {
        match lower_condition(raw, system) {
            LoweredCondition::Selector(s) => assert_eq!(s, expected),
            _ => panic!("expected selector for {raw}"),
        }
    }

    fn assert_container(raw: &str, px: &str, system: &BaseSystem) {
        match lower_condition(raw, system) {
            LoweredCondition::Container(m) => {
                assert_eq!(m, format!("@container (min-width: {px}px)"))
            }
            _ => panic!("expected container query for {raw}"),
        }
    }

    #[test]
    fn test_lower_presets() {
        let system = BaseSystem::lib_fixture();
        assert_selector("_hover", "&:is(:hover, [data-hover])", system);
        assert_selector("_dark", "[data-panda-theme=dark] &", system);
        assert_selector(
            "_groupHover",
            "&:is(:where(.group, [data-group]):is(:hover, [data-hover]) *)",
            system,
        );
        assert_selector(
            "_peerFocus",
            "&:is(:where(.peer, [data-peer]):is(:focus, [data-focus]) ~ *)",
            system,
        );
    }

    #[test]
    fn test_named_breakpoint_lowers_to_container() {
        let system = BaseSystem::lib_fixture();
        assert_container("sm", "640", system);
        assert_container("md", "768", system);
        assert_container("lg", "1024", system);
        assert_container("xl", "1280", system);
        assert_container("2xl", "1536", system);
    }

    #[test]
    fn test_container_passthrough() {
        match lower_condition("@container (min-width: 640px)", &BaseSystem::default()) {
            LoweredCondition::Container(m) => {
                assert_eq!(m, "@container (min-width: 640px)")
            }
            _ => panic!("expected container query"),
        }
    }
}
