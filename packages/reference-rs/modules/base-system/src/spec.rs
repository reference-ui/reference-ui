//! Authored nested spec of one design-system utterance.
//! TypeScript evaluates `tokens()` / `font()` / `keyframes()` / `globalCss()` and serializes
//! the objects; this type is that JSON — the wire form fragments specify.
//! Leaves carry `value` / `light` / `dark` strings. When `light` or `dark` is itself an object,
//! it is a nested group (a token *named* `light`) rather than a mode slot. Keyframes are name →
//! steps; recipes are static `base` / `variants` tables. Unknown top-level keys fail closed.
//! Extra leaf keys and `fontFace` are ignored until later steps grow those types.

use crate::fonts::FontDefinition;
use crate::{KeyframeDefinition, RecipeDefinition, StaticCss};
use indexmap::IndexMap;
use serde::de::Deserializer;
use serde::Deserialize;
use serde_json::Value;
use std::error::Error;
use std::fmt;

/// Failure lowering an evaluated JSON spec into an indexed `BaseSystem`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FromJsonError {
    Parse(String),
    InvalidLeaf { path: String },
    DuplicatePath { path: String },
    Cycle { path: String },
}

impl fmt::Display for FromJsonError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Parse(message) => write!(
                f,
                "base-system consumes evaluated JSON only: {message}"
            ),
            Self::InvalidLeaf { path } => write!(f, "invalid token leaf at {path}"),
            Self::DuplicatePath { path } => write!(f, "duplicate token path {path}"),
            Self::Cycle { path } => write!(f, "cyclic token alias at {path}"),
        }
    }
}

impl Error for FromJsonError {}

/// Mode slots on one token leaf. Extra keys are ignored (no `deny_unknown_fields`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub(crate) struct TokenSpecLeaf {
    pub value: Option<String>,
    pub light: Option<String>,
    pub dark: Option<String>,
}

/// Nested token tree: a mode leaf, a group of children, or a scalar that lowering rejects.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TokenSpecNode {
    Leaf(TokenSpecLeaf),
    Group(IndexMap<String, TokenSpecNode>),
    Scalar,
}

/// Nested spec wire format. Distinct from indexed `BaseSystem` (`names`/`widths`, flat tokens).
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub(crate) struct BaseSystemSpec {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub tokens: IndexMap<String, TokenSpecNode>,
    #[serde(default)]
    pub fonts: IndexMap<String, FontDefinition>,
    #[serde(default)]
    pub breakpoints: IndexMap<String, SpecBreakpointWidth>,
    #[serde(default)]
    pub conditions: IndexMap<String, String>,
    #[serde(default)]
    pub global_css: Vec<String>,
    #[serde(default)]
    pub keyframes: IndexMap<String, KeyframeDefinition>,
    #[serde(default)]
    pub recipes: IndexMap<String, RecipeDefinition>,
    #[serde(default)]
    pub static_css: StaticCss,
}

/// Spec breakpoint width: `"640px"` or `{ "value": "640px" }`.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(untagged)]
pub(crate) enum SpecBreakpointWidth {
    Bare(String),
    Wrapped { value: String },
}

impl SpecBreakpointWidth {
    pub(crate) fn into_px(self) -> String {
        let raw = match self {
            Self::Bare(value) | Self::Wrapped { value } => value,
        };
        raw.strip_suffix("px").map(str::to_string).unwrap_or(raw)
    }
}

impl BaseSystemSpec {
    pub(crate) fn from_json(json: &str) -> Result<Self, FromJsonError> {
        serde_json::from_str(json).map_err(|err| FromJsonError::Parse(err.to_string()))
    }
}

impl<'de> Deserialize<'de> for TokenSpecNode {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        Ok(node_from_value(Value::deserialize(deserializer)?))
    }
}

fn node_from_value(value: Value) -> TokenSpecNode {
    match value {
        Value::Object(map) => node_from_object(map.into_iter().collect()),
        _ => TokenSpecNode::Scalar,
    }
}

fn node_from_object(map: IndexMap<String, Value>) -> TokenSpecNode {
    if is_mode_leaf(&map) {
        return match leaf_from_object(&map) {
            Some(leaf) => TokenSpecNode::Leaf(leaf),
            None => TokenSpecNode::Scalar,
        };
    }
    let mut children = IndexMap::new();
    for (key, value) in map {
        children.insert(key, node_from_value(value));
    }
    TokenSpecNode::Group(children)
}

fn is_mode_leaf(map: &IndexMap<String, Value>) -> bool {
    let has_slot =
        map.contains_key("value") || map.contains_key("light") || map.contains_key("dark");
    has_slot && !is_plain_object(map.get("light")) && !is_plain_object(map.get("dark"))
}

fn is_plain_object(value: Option<&Value>) -> bool {
    matches!(value, Some(Value::Object(_)))
}

fn leaf_from_object(map: &IndexMap<String, Value>) -> Option<TokenSpecLeaf> {
    Some(TokenSpecLeaf {
        value: slot(map, "value")?,
        light: slot(map, "light")?,
        dark: slot(map, "dark")?,
    })
}

fn slot(map: &IndexMap<String, Value>, key: &str) -> Option<Option<String>> {
    match map.get(key) {
        None | Some(Value::Null) => Some(None),
        Some(Value::String(value)) => Some(Some(value.clone())),
        Some(_) => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::BaseSystem;

    const FOREIGN: &str =
        r#"{"name":"@reference-ui/lib","fragment":"(function(){})()","jsxElements":["Button"]}"#;

    #[test]
    fn bas_dump_02_indexes_nested_color_leaf() {
        let system = BaseSystem::from_json(
            r##"{"tokens":{"colors":{"blue":{"600":{"value":"#2563eb"}}}}}"##,
        )
        .unwrap();
        assert!(system.is_token("colors.blue.600"));
        assert_eq!(system.token_category("colors.blue.600"), Some("colors"));
        assert_eq!(
            system.token_css_var("colors.blue.600"),
            Some("--colors-blue-600")
        );
        assert_eq!(system.token_light("colors.blue.600"), Some("#2563eb"));
        assert!(system.token_dark("colors.blue.600").is_none());
    }

    #[test]
    fn bas_dump_03_preserves_system_name() {
        let system = BaseSystem::from_json(r#"{"name":"@reference-ui/lib"}"#).unwrap();
        assert_eq!(system.name, "@reference-ui/lib");
    }

    #[test]
    fn bas_dump_04_rejects_typescript_source() {
        let err = BaseSystem::from_json("tokens({ colors: { primary: '#fff' } })").unwrap_err();
        let message = err.to_string();
        assert!(
            message.contains("evaluated JSON"),
            "unexpected parse diagnostic: {message}"
        );
    }

    #[test]
    fn atm_token_10_rejects_foreign_core_shape() {
        let spec_err = BaseSystem::from_json(FOREIGN).unwrap_err();
        let spec_message = spec_err.to_string();
        assert!(
            spec_message.contains("unknown field"),
            "unexpected spec diagnostic: {spec_message}"
        );
        assert!(
            serde_json::from_str::<BaseSystem>(FOREIGN).is_err(),
            "indexed BaseSystem must deny fragment/jsxElements"
        );
    }

    #[test]
    fn from_json_empty_object_equals_default() {
        let via_spec = BaseSystem::from_json("{}").unwrap();
        let via_index: BaseSystem = serde_json::from_str("{}").unwrap();
        assert_eq!(via_spec, BaseSystem::default());
        assert_eq!(via_index, BaseSystem::default());
    }

    #[test]
    fn light_named_nested_group_is_not_a_mode_slot() {
        let system = BaseSystem::from_json(
            r#"{"tokens":{"colors":{"design":{"text":{"light":{"light":"{colors.gray.700}","dark":"{colors.gray.300}"}}}}}}"#,
        )
        .unwrap();
        assert!(system.is_token("colors.design.text.light"));
        assert!(!system.is_token("colors.design.text"));
        assert_eq!(
            system.token_light("colors.design.text.light"),
            Some("{colors.gray.700}")
        );
        assert_eq!(
            system.token_dark("colors.design.text.light"),
            Some("{colors.gray.300}")
        );
    }

    #[test]
    fn open_category_indexes_arbitrary_token() {
        let system = BaseSystem::from_json(r#"{"tokens":{"foo":{"bar":{"value":"1"}}}}"#).unwrap();
        assert!(system.is_token("foo.bar"));
        assert_eq!(system.token_category("foo.bar"), Some("foo"));
        assert_eq!(system.token_css_var("foo.bar"), Some("--foo-bar"));
        assert_eq!(system.token_light("foo.bar"), Some("1"));
    }

    #[test]
    fn extra_font_face_is_ignored() {
        let system = BaseSystem::from_json(
            r#"{"fonts":{"sans":{"value":"Inter, sans-serif","fontFace":{"src":"url(/x.woff2)"}}}}"#,
        )
        .unwrap();
        assert!(system.fonts().has_family("sans"));
        assert_eq!(
            system.fonts().get("sans").unwrap().value,
            "Inter, sans-serif"
        );
        assert!(system.is_token("fonts.sans"));
    }

    #[test]
    fn spec_breakpoints_strip_px_and_stay_empty_when_omitted() {
        let with_widths =
            BaseSystem::from_json(r#"{"breakpoints":{"sm":"640px","md":{"value":"768px"}}}"#)
                .unwrap();
        assert_eq!(with_widths.breakpoints().width_px("sm"), Some("640"));
        assert_eq!(with_widths.breakpoints().width_px("md"), Some("768"));
        assert_eq!(
            with_widths.breakpoints().breakpoint_for_index(0),
            Some("base")
        );
        let empty = BaseSystem::from_json("{}").unwrap();
        assert!(empty.breakpoints().is_empty());
    }

    #[test]
    fn indexed_partial_breakpoints_still_deserialize() {
        let system: BaseSystem =
            serde_json::from_str(r#"{"breakpoints":{"names":["tablet","desktop"]}}"#).unwrap();
        assert_eq!(system.breakpoints().breakpoint_for_index(1), Some("tablet"));
        assert!(system.tokens.is_empty());
    }

    #[test]
    fn string_leaf_is_invalid() {
        let err = BaseSystem::from_json(r##"{"tokens":{"colors":{"blue":{"500":"#3b82f6"}}}}"##)
            .unwrap_err();
        assert!(matches!(
            err,
            FromJsonError::InvalidLeaf { path } if path == "colors.blue.500"
        ));
    }

    #[test]
    fn missing_alias_target_is_not_a_cycle() {
        let system = BaseSystem::from_json(
            r#"{"tokens":{"colors":{"brand":{"value":"{colors.missing}"}}}}"#,
        )
        .unwrap();
        assert_eq!(system.token_light("colors.brand"), Some("{colors.missing}"));
    }

    #[test]
    fn spec_token_walk_preserves_authored_object_order() {
        let system =
            BaseSystem::from_json(r#"{"tokens":{"colors":{"b":{"value":"1"},"a":{"value":"2"}}}}"#)
                .unwrap();
        let keys: Vec<&str> = system.tokens.iter().map(|(key, _)| key).collect();
        assert_eq!(keys, ["colors.b", "colors.a"]);
    }

    #[test]
    fn indexed_empty_keyframes_and_recipes_deserialize() {
        let omitted: BaseSystem = serde_json::from_str("{}").unwrap();
        let empty: BaseSystem = serde_json::from_str(r#"{"keyframes":{},"recipes":{}}"#).unwrap();
        assert!(omitted.keyframes.is_empty());
        assert!(omitted.recipes.is_empty());
        assert!(empty.keyframes.is_empty());
        assert!(empty.recipes.is_empty());
    }
}
