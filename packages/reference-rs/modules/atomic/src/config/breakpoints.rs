//! Breakpoint configuration and responsive array scale resolver for atomic styling.
//! Ingests breakpoint lists or token maps from compilation requests and base systems.
//! Names drive array slots; optional pixel widths are the utterance `r/` looks up.
//! Defaults exist only as a starting table, not as a second condition language.

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use super::{BaseSystemConfig, TokensConfig};
use crate::CompileRequest;

const DEFAULT_NAMED_WIDTHS: &[(&str, &str)] = &[
    ("sm", "640"),
    ("md", "768"),
    ("lg", "1024"),
    ("xl", "1280"),
    ("2xl", "1536"),
];

/// Ingested breakpoint configuration supporting array lists or ordered map objects.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum BreakpointConfig {
    List(Vec<String>),
    Map(IndexMap<String, serde_json::Value>),
}

impl BreakpointConfig {
    /// Extract the ordered sequence of breakpoint names from the configuration.
    pub fn to_names(&self) -> Vec<String> {
        match self {
            Self::List(list) => list.clone(),
            Self::Map(map) => map.keys().cloned().collect(),
        }
    }
}

/// Ordered scale of condition names plus optional name → pixel-width lookups.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BreakpointScale {
    names: Vec<String>,
    widths: IndexMap<String, String>,
}

impl Default for BreakpointScale {
    fn default() -> Self {
        Self::default_scale()
    }
}

impl BreakpointScale {
    /// Construct the standard reference breakpoint scale.
    pub fn default_scale() -> Self {
        let mut widths = IndexMap::new();
        for (name, px) in DEFAULT_NAMED_WIDTHS {
            widths.insert((*name).to_string(), (*px).to_string());
        }
        Self {
            names: vec![
                "base".to_string(),
                "sm".to_string(),
                "md".to_string(),
                "lg".to_string(),
                "xl".to_string(),
                "2xl".to_string(),
            ],
            widths,
        }
    }

    /// Construct a scale from an ordered sequence of breakpoint names.
    /// Ensures index 0 is always mapped to "base" for unconditioned styles.
    pub fn from_names(names: impl IntoIterator<Item = impl Into<String>>) -> Self {
        let raw: Vec<String> = names.into_iter().map(Into::into).collect();
        let mut list = Vec::with_capacity(raw.len() + 1);
        if raw.first().map(|s| s.as_str()) != Some("base") {
            list.push("base".to_string());
        }
        for name in raw {
            if !name.is_empty()
                && (list.is_empty() || list.last().map(|s| s.as_str()) != Some(&name))
            {
                list.push(name);
            }
        }
        Self {
            names: list,
            widths: IndexMap::new(),
        }
    }

    /// Construct a scale from a compile-request breakpoint config, keeping map widths.
    pub fn from_config(config: &BreakpointConfig) -> Self {
        match config {
            BreakpointConfig::List(list) => Self::from_names(list.clone()),
            BreakpointConfig::Map(map) => Self::from_map(map),
        }
    }

    /// Look up the condition name assigned to a specific responsive array index.
    pub fn breakpoint_for_index(&self, index: usize) -> Option<&str> {
        self.names.get(index).map(|s| s.as_str())
    }

    /// Access the ordered slice of breakpoint names.
    pub fn names(&self) -> &[String] {
        &self.names
    }

    /// Pixel width for a named breakpoint, if the project utterance declared one.
    pub fn width_px(&self, name: &str) -> Option<&str> {
        self.widths.get(name).map(String::as_str)
    }

    fn from_map(map: &IndexMap<String, serde_json::Value>) -> Self {
        let mut scale = Self::from_names(map.keys().cloned());
        for (name, value) in map {
            if let Some(px) = json_width(value) {
                scale.widths.insert(name.clone(), px);
            }
        }
        scale
    }
}

/// Resolve the active breakpoint scale for a compilation request.
pub fn resolve_breakpoints(request: &CompileRequest) -> BreakpointScale {
    if let Some(config) = &request.breakpoints {
        return BreakpointScale::from_config(config);
    }
    if let Some(scale) = extract_tokens_breakpoints(request.tokens.as_ref()) {
        return scale;
    }
    if let Some(scale) = extract_base_system_breakpoints(request.base_system.as_ref()) {
        return scale;
    }
    BreakpointScale::default_scale()
}

fn extract_tokens_breakpoints(tokens: Option<&TokensConfig>) -> Option<BreakpointScale> {
    let cfg = tokens.and_then(|t| t.breakpoints.as_ref())?;
    Some(BreakpointScale::from_config(cfg))
}

fn extract_base_system_breakpoints(
    base_system: Option<&BaseSystemConfig>,
) -> Option<BreakpointScale> {
    let cfg = base_system.and_then(|b| b.breakpoints.as_ref())?;
    Some(BreakpointScale::from_config(cfg))
}

fn json_width(value: &serde_json::Value) -> Option<String> {
    match value {
        serde_json::Value::Object(obj) => obj.get("value").and_then(json_width),
        serde_json::Value::String(s) => parse_px_width(s),
        serde_json::Value::Number(n) => n.as_f64().map(px_from_f64),
        _ => None,
    }
}

fn parse_px_width(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    let without_px = trimmed
        .strip_suffix("px")
        .or_else(|| trimmed.strip_suffix("PX"))
        .unwrap_or(trimmed)
        .trim();
    if without_px.parse::<f64>().is_ok() {
        Some(without_px.to_string())
    } else {
        None
    }
}

fn px_from_f64(n: f64) -> String {
    if n.fract() == 0.0 {
        format!("{}", n as i64)
    } else {
        n.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_scale() {
        let scale = BreakpointScale::default_scale();
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("sm"));
        assert_eq!(scale.breakpoint_for_index(2), Some("md"));
        assert_eq!(scale.breakpoint_for_index(3), Some("lg"));
        assert_eq!(scale.breakpoint_for_index(4), Some("xl"));
        assert_eq!(scale.breakpoint_for_index(5), Some("2xl"));
        assert_eq!(scale.breakpoint_for_index(6), None);
        assert_eq!(scale.width_px("sm"), Some("640"));
        assert_eq!(scale.width_px("md"), Some("768"));
    }

    #[test]
    fn test_custom_scale_prepends_base() {
        let scale = BreakpointScale::from_names(["tablet", "desktop"]);
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("tablet"));
        assert_eq!(scale.breakpoint_for_index(2), Some("desktop"));
        assert_eq!(scale.breakpoint_for_index(3), None);
        assert_eq!(scale.width_px("tablet"), None);
    }

    #[test]
    fn test_custom_scale_with_explicit_base() {
        let scale = BreakpointScale::from_names(["base", "tablet", "desktop"]);
        assert_eq!(scale.breakpoint_for_index(0), Some("base"));
        assert_eq!(scale.breakpoint_for_index(1), Some("tablet"));
        assert_eq!(scale.breakpoint_for_index(2), Some("desktop"));
        assert_eq!(scale.breakpoint_for_index(3), None);
    }

    #[test]
    fn test_map_config_keeps_pixel_widths() {
        let mut map = IndexMap::new();
        map.insert("wide".to_string(), serde_json::json!("1200px"));
        map.insert("ultra".to_string(), serde_json::json!({ "value": 1800 }));
        let scale = BreakpointScale::from_config(&BreakpointConfig::Map(map));
        assert_eq!(scale.breakpoint_for_index(1), Some("wide"));
        assert_eq!(scale.width_px("wide"), Some("1200"));
        assert_eq!(scale.width_px("ultra"), Some("1800"));
    }
}
