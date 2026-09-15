//! Font-scale ingest for `font()` / `weight` resolution.
//! Collects family names, named weights, and optional CSS extras from the compile request.
//! Defaults are CSS-generic families and weight keywords, not a baked copy of `@reference-ui/lib` tracking.

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use crate::CompileRequest;

const DEFAULT_FAMILIES: &[&str] = &["sans", "serif", "mono"];

const DEFAULT_WEIGHTS: &[(&str, &str)] = &[
    ("thin", "100"),
    ("light", "300"),
    ("normal", "400"),
    ("semibold", "600"),
    ("bold", "700"),
    ("black", "900"),
];

/// One `font()` fragment as passed into compile.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontDefinitionConfig {
    #[serde(default)]
    pub weights: IndexMap<String, String>,
    #[serde(default)]
    pub css: IndexMap<String, String>,
}

/// Name → definition map matching collected `font()` fragments.
pub type FontsConfig = IndexMap<String, FontDefinitionConfig>;

/// Resolved font table consulted by resolve.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FontScale {
    fonts: IndexMap<String, FontDefinitionConfig>,
}

impl Default for FontScale {
    fn default() -> Self {
        Self::default_scale()
    }
}

impl FontScale {
    /// Generic CSS families and keyword weights. No letter-spacing tracking.
    pub fn default_scale() -> Self {
        let mut fonts = IndexMap::new();
        for family in DEFAULT_FAMILIES {
            fonts.insert((*family).to_string(), default_definition());
        }
        Self { fonts }
    }

    /// Build a scale from an ingested font map, replacing the default table.
    pub fn from_config(config: &FontsConfig) -> Self {
        Self {
            fonts: config.clone(),
        }
    }

    /// True when `name` is a registered font family.
    pub fn has_family(&self, name: &str) -> bool {
        self.fonts.contains_key(name)
    }

    /// Registered definition for a family name.
    pub fn get(&self, name: &str) -> Option<&FontDefinitionConfig> {
        self.fonts.get(name)
    }

    /// Named weight from a scoped key (`sans.bold`) or a family's weight map.
    pub fn scoped_weight(&self, raw: &str) -> Option<&str> {
        let (family, weight) = raw.split_once('.')?;
        self.fonts
            .get(family)
            .and_then(|font| font.weights.get(weight))
            .map(String::as_str)
    }
}

/// Resolve the active font scale for a compilation request.
pub fn resolve_fonts(request: &CompileRequest) -> FontScale {
    if let Some(fonts) = &request.fonts {
        return FontScale::from_config(fonts);
    }
    if let Some(fonts) = request.tokens.as_ref().and_then(|t| t.fonts.as_ref()) {
        return FontScale::from_config(fonts);
    }
    if let Some(fonts) = request
        .base_system
        .as_ref()
        .and_then(|b| b.fonts.as_ref())
    {
        return FontScale::from_config(fonts);
    }
    FontScale::default_scale()
}

fn default_definition() -> FontDefinitionConfig {
    let mut weights = IndexMap::new();
    for (name, value) in DEFAULT_WEIGHTS {
        weights.insert((*name).to_string(), (*value).to_string());
    }
    FontDefinitionConfig {
        weights,
        css: IndexMap::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_scale_has_css_families() {
        let scale = FontScale::default_scale();
        assert!(scale.has_family("sans"));
        assert!(scale.has_family("serif"));
        assert!(scale.has_family("mono"));
        assert_eq!(scale.scoped_weight("sans.bold"), Some("700"));
        assert!(scale.get("sans").unwrap().css.is_empty());
    }

    #[test]
    fn test_from_config_replaces_defaults() {
        let mut css = IndexMap::new();
        css.insert("letterSpacing".to_string(), "-0.01em".to_string());
        let mut weights = IndexMap::new();
        weights.insert("bold".to_string(), "700".to_string());
        let mut map = IndexMap::new();
        map.insert(
            "display".to_string(),
            FontDefinitionConfig { weights, css },
        );
        let scale = FontScale::from_config(&map);
        assert!(scale.has_family("display"));
        assert!(!scale.has_family("sans"));
        assert_eq!(scale.scoped_weight("display.bold"), Some("700"));
        assert_eq!(
            scale.get("display").unwrap().css.get("letterSpacing"),
            Some(&"-0.01em".to_string())
        );
    }
}
