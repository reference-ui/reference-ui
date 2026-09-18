//! Keyframe tables for one design-system utterance.
//! Spec JSON is name → ordered steps, each step an authored selector (`from`, `to`,
//! `50%`, `0%, 100%`) plus a declaration map. `from`/`to` stay as authored for CSS
//! emit; `model_selector` maps them to `0%`/`100%` for the MOTION-01 model. Animation
//! tokens name a keyframe in their first CSS ident (`spin 1s linear infinite` →
//! `spin`); unmatched names are gaps, not panics.

use crate::tokens::TokenEntry;
use crate::StyleMap;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

/// One `@keyframes` rule: authored selector → declarations, in source order.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct KeyframeDefinition {
    #[serde(flatten)]
    steps: IndexMap<String, StyleMap>,
}

/// Animation token whose first ident is not a declared keyframe name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AnimationKeyframeGap {
    pub token: String,
    pub keyframe: String,
}

impl KeyframeDefinition {
    /// True when the rule has no steps.
    pub fn is_empty(&self) -> bool {
        self.steps.is_empty()
    }

    /// True when at least one step has a declaration to print.
    pub fn has_declarations(&self) -> bool {
        self.steps.values().any(|decls| !decls.is_empty())
    }

    /// Declaration map for an authored selector (`from`, `to`, `50%`).
    pub fn step(&self, selector: &str) -> Option<&StyleMap> {
        self.steps.get(selector)
    }

    /// Authored selector → declaration map, in source order.
    pub fn steps(&self) -> impl Iterator<Item = (&str, &StyleMap)> {
        self.steps
            .iter()
            .map(|(selector, decls)| (selector.as_str(), decls))
    }

    /// `from` → `0%`, `to` → `100%`; other selectors stay as authored.
    pub fn model_selector(authored: &str) -> &str {
        match authored {
            "from" => "0%",
            "to" => "100%",
            other => other,
        }
    }
}

impl crate::BaseSystem {
    /// Insertion-order walk of keyframe name + steps for `@keyframes` emit.
    pub fn list_keyframes(&self) -> impl Iterator<Item = (&str, &KeyframeDefinition)> {
        self.keyframes
            .iter()
            .map(|(name, def)| (name.as_str(), def))
    }

    /// First CSS ident of an animation token value (`animations.spin` → `spin`).
    pub fn keyframe_names_referenced_by_animation_token(&self, path: &str) -> Option<&str> {
        first_css_ident(self.token_light(path)?)
    }

    /// Animation tokens whose first ident is missing from this system's keyframes.
    pub fn animation_keyframe_gaps(&self) -> Vec<AnimationKeyframeGap> {
        self.tokens
            .iter()
            .filter_map(|(path, entry)| gap_for_token(path, entry, &self.keyframes))
            .collect()
    }
}

fn gap_for_token(
    path: &str,
    entry: &TokenEntry,
    keyframes: &IndexMap<String, KeyframeDefinition>,
) -> Option<AnimationKeyframeGap> {
    if entry.category() != "animations" {
        return None;
    }
    let name = first_css_ident(entry.light())?;
    if keyframes.contains_key(name) {
        return None;
    }
    Some(AnimationKeyframeGap {
        token: path.to_string(),
        keyframe: name.to_string(),
    })
}

fn first_css_ident(value: &str) -> Option<&str> {
    let start = value.trim();
    let mut chars = start.char_indices();
    let (_, first) = chars.next()?;
    if !first.is_ascii_alphabetic() && first != '_' {
        return None;
    }
    let end = chars
        .find(|(_, ch)| !ch.is_ascii_alphanumeric() && *ch != '_' && *ch != '-')
        .map(|(i, _)| i)
        .unwrap_or(start.len());
    Some(&start[..end])
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::BaseSystem;

    fn motion_spec_json(tokens: &str, keyframes: &str) -> String {
        format!(
            r#"{{"schemaVersion":1,"profile":"reference-ui","name":"test","tokens":{tokens},"fonts":{{}},"globalCss":[],"keyframes":{keyframes},"recipes":{{}},"staticCss":{{}},"provenance":[]}}"#
        )
    }

    #[test]
    fn bas_motion_01_stores_fade_in_steps() {
        let json = motion_spec_json(
            "{}",
            r#"{"fadeIn":{"from":{"opacity":"0"},"to":{"opacity":"1"}}}"#,
        );
        let system = BaseSystem::from_json(&json).unwrap();
        let fade = system.keyframes.get("fadeIn").unwrap();
        assert_eq!(
            fade.step("from")
                .unwrap()
                .get("opacity")
                .map(String::as_str),
            Some("0")
        );
        assert_eq!(
            fade.step("to").unwrap().get("opacity").map(String::as_str),
            Some("1")
        );
        assert_eq!(KeyframeDefinition::model_selector("from"), "0%");
        assert_eq!(KeyframeDefinition::model_selector("to"), "100%");
    }

    #[test]
    fn bas_motion_02_iterates_name_and_steps_for_at_rule_emit() {
        let json = motion_spec_json(
            "{}",
            r#"{"fadeIn":{"from":{"opacity":"0"},"to":{"opacity":"1"}}}"#,
        );
        let system = BaseSystem::from_json(&json).unwrap();
        let pairs: Vec<_> = system.list_keyframes().collect();
        assert_eq!(pairs.len(), 1);
        assert_eq!(pairs[0].0, "fadeIn");
        let selectors: Vec<_> = pairs[0].1.steps().map(|(selector, _)| selector).collect();
        assert_eq!(selectors, ["from", "to"]);
    }

    #[test]
    fn bas_motion_03_animation_token_identifies_keyframe_name() {
        let json = motion_spec_json(
            r#"{"animations":{"spin":{"value":"spin 1s linear infinite"}}}"#,
            r#"{"spin":{"from":{"transform":"rotate(0deg)"},"to":{"transform":"rotate(360deg)"}}}"#,
        );
        let system = BaseSystem::from_json(&json).unwrap();
        assert_eq!(
            system.keyframe_names_referenced_by_animation_token("animations.spin"),
            Some("spin")
        );
        assert!(system.animation_keyframe_gaps().is_empty());
    }

    #[test]
    fn bas_motion_03_unmatched_animation_token_is_a_gap() {
        let json = motion_spec_json(
            r#"{"animations":{"ghost":{"value":"ghost 1s"}}}"#,
            r#"{"spin":{"from":{"opacity":"1"},"to":{"opacity":"0"}}}"#,
        );
        let system = BaseSystem::from_json(&json).unwrap();
        let gaps = system.animation_keyframe_gaps();
        assert_eq!(gaps.len(), 1);
        assert_eq!(gaps[0].token, "animations.ghost");
        assert_eq!(gaps[0].keyframe, "ghost");
        assert_eq!(
            system.keyframe_names_referenced_by_animation_token("animations.ghost"),
            Some("ghost")
        );
    }

    #[test]
    fn keyframe_string_value_is_rejected() {
        let json = motion_spec_json("{}", r#"{"fadeIn":"from { opacity: 0 }"}"#);
        let err = BaseSystem::from_json(&json).unwrap_err();
        assert!(matches!(err, crate::FromJsonError::Parse(_)));
    }

    #[test]
    fn lib_fixture_keyframes_match_measured_count_with_zero_gaps() {
        let system = BaseSystem::lib_fixture();
        let names: Vec<&str> = system.list_keyframes().map(|(name, _)| name).collect();
        assert_eq!(names.len(), 31);
        assert!(names.contains(&"fadeIn"));
        assert!(names.contains(&"spin"));
        assert!(names.contains(&"wigglewiggle"));
        assert!(names.contains(&"shimmer"));
        assert!(system.is_token("animations.fadeIn.normal"));
        assert!(system.is_token("animations.spin.normal"));
        assert!(system.animation_keyframe_gaps().is_empty());
        assert!(system.recipes.is_empty());
    }
}
