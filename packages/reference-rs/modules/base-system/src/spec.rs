//! Authored nested spec of one design-system utterance.
//! TypeScript evaluates `tokens()`, `font()`, `keyframes()`, and `globalCss()` and serializes
//! the evaluated objects into an `EvaluatedSystemSpec` with schemaVersion 1 and reference-ui profile.
//! Leaves carry `value`, `light`, and `dark` strings. When `light` or `dark` is itself an object,
//! it is a nested group rather than a mode slot. Unknown top-level fields and unsupported
//! schema versions fail closed with explicit diagnostics. `extends` names upstream systems
//! that `BaseSystem::from_specs` resolves; empty means standalone.

use std::error::Error;
use std::fmt;

use indexmap::IndexMap;
use serde::de::Deserializer;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::fonts::FontDefinition;
pub use crate::global_css::GlobalCssFragment;
use crate::{KeyframeDefinition, RecipeDefinition, StaticCss};

#[cfg(test)]
#[path = "spec_tests.rs"]
mod tests;

/// Failure lowering an evaluated JSON spec into an indexed `BaseSystem`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FromJsonError {
    Parse(String),
    UnsupportedSchemaVersion(u32),
    UnsupportedProfile(String),
    InvalidLeaf {
        path: String,
        source: Option<String>,
    },
    DuplicatePath {
        path: String,
        source: Option<String>,
    },
    Cycle {
        path: String,
        source: Option<String>,
    },
    UnknownUpstream {
        name: String,
    },
    ExtendsCycle {
        chain: Vec<String>,
    },
    InvalidGlobalCss {
        path: String,
        source: Option<String>,
        message: String,
    },
}

impl fmt::Display for FromJsonError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if let Some(res) = self.fmt_envelope_error(f) {
            return res;
        }
        self.fmt_domain_error(f)
    }
}

impl FromJsonError {
    fn fmt_envelope_error(&self, f: &mut fmt::Formatter<'_>) -> Option<fmt::Result> {
        match self {
            Self::Parse(msg) => Some(write!(f, "base-system consumes evaluated JSON only: {msg}")),
            Self::UnsupportedSchemaVersion(ver) => {
                Some(write!(f, "unsupported schema version {ver}; expected 1"))
            }
            Self::UnsupportedProfile(prof) => Some(write!(
                f,
                "unsupported profile \"{prof}\"; expected \"reference-ui\""
            )),
            _ => None,
        }
    }

    fn fmt_domain_error(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if let Some(res) = self.fmt_extends_error(f) {
            return res;
        }
        if let Some(res) = self.fmt_path_error(f) {
            return res;
        }
        match self {
            Self::InvalidGlobalCss {
                path,
                source,
                message,
            } => fmt_global_css(f, path, source.as_deref(), message),
            _ => Ok(()),
        }
    }

    fn fmt_path_error(&self, f: &mut fmt::Formatter<'_>) -> Option<fmt::Result> {
        match self {
            Self::InvalidLeaf { path, source } => Some(fmt_with_source(
                f,
                "invalid token leaf",
                path,
                source.as_deref(),
            )),
            Self::DuplicatePath { path, source } => Some(fmt_with_source(
                f,
                "duplicate token path",
                path,
                source.as_deref(),
            )),
            Self::Cycle { path, source } => Some(fmt_with_source(
                f,
                "cyclic token alias",
                path,
                source.as_deref(),
            )),
            _ => None,
        }
    }

    fn fmt_extends_error(&self, f: &mut fmt::Formatter<'_>) -> Option<fmt::Result> {
        match self {
            Self::UnknownUpstream { name } => Some(write!(
                f,
                "unknown upstream system \"{name}\" in extends graph"
            )),
            Self::ExtendsCycle { chain } => {
                Some(write!(f, "extends cycle detected: {}", chain.join(" -> ")))
            }
            _ => None,
        }
    }
}

fn fmt_with_source(
    f: &mut fmt::Formatter<'_>,
    prefix: &str,
    path: &str,
    source: Option<&str>,
) -> fmt::Result {
    match source {
        Some(src) => write!(f, "{prefix} at {path} (from {src})"),
        None => write!(f, "{prefix} at {path}"),
    }
}

fn fmt_global_css(
    f: &mut fmt::Formatter<'_>,
    path: &str,
    source: Option<&str>,
    message: &str,
) -> fmt::Result {
    match source {
        Some(src) => write!(f, "invalid global CSS at {path} in {src}: {message}"),
        None => write!(f, "invalid global CSS at {path}: {message}"),
    }
}

impl Error for FromJsonError {}

/// Provenance collector categories.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ProvenanceKind {
    Tokens,
    Fonts,
    Keyframes,
    GlobalCss,
    Recipes,
    Fragment,
}

/// Provenance record attributing keys to their source file.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProvenanceEntry {
    pub source: String,
    pub kind: ProvenanceKind,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub keys: Vec<String>,
}

/// Mode slots on one token leaf. Extra keys are ignored (no `deny_unknown_fields`).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
pub struct TokenSpecLeaf {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub light: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dark: Option<String>,
}

/// Nested token tree: a mode leaf, a group of children, or a scalar that lowering rejects.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(untagged)]
pub enum TokenSpecNode {
    Leaf(TokenSpecLeaf),
    Group(IndexMap<String, TokenSpecNode>),
    #[serde(skip_serializing)]
    Scalar,
}

/// Spec breakpoint width: `"640px"` or `{ "value": "640px" }`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum SpecBreakpointWidth {
    Bare(String),
    Wrapped { value: String },
}

impl SpecBreakpointWidth {
    pub fn into_px(self) -> String {
        let raw = match self {
            Self::Bare(value) | Self::Wrapped { value } => value,
        };
        raw.strip_suffix("px").map(str::to_string).unwrap_or(raw)
    }
}

/// Versioned v1 evaluated design-system wire specification.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct EvaluatedSystemSpec {
    pub schema_version: u32,
    pub profile: String,
    pub name: String,
    #[serde(default)]
    pub extends: Vec<String>,
    pub tokens: IndexMap<String, TokenSpecNode>,
    pub fonts: IndexMap<String, FontDefinition>,
    #[serde(default)]
    pub breakpoints: Option<IndexMap<String, SpecBreakpointWidth>>,
    #[serde(default)]
    pub conditions: Option<IndexMap<String, String>>,
    pub global_css: Vec<GlobalCssFragment>,
    pub keyframes: IndexMap<String, KeyframeDefinition>,
    pub recipes: IndexMap<String, RecipeDefinition>,
    pub static_css: StaticCss,
    pub provenance: Vec<ProvenanceEntry>,
}

/// Backwards-compatible alias for existing indexed BaseSystem consumers.
pub type BaseSystemSpec = EvaluatedSystemSpec;

impl EvaluatedSystemSpec {
    /// Deserialize an evaluated spec from JSON with strict version and unknown field checks.
    pub fn from_json(json: &str) -> Result<Self, FromJsonError> {
        serde_json::from_str(json).map_err(|err| FromJsonError::Parse(err.to_string()))
    }
}

/// Reject specs whose envelope version or profile the lowering cannot honor.
pub(crate) fn check_envelope(spec: &EvaluatedSystemSpec) -> Result<(), FromJsonError> {
    if spec.schema_version != 1 {
        return Err(FromJsonError::UnsupportedSchemaVersion(spec.schema_version));
    }
    if spec.profile != "reference-ui" {
        return Err(FromJsonError::UnsupportedProfile(spec.profile.clone()));
    }
    Ok(())
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
