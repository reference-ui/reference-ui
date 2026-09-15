//! Font table for one design-system utterance.
//! Stores family names, named weights, the CSS family stack, and optional extras such as
//! `letterSpacing`. `generic()` is CSS keyword families with no lib tracking. The lib fixture
//! loads `font()` families from the generated dump; `fontFace` is ignored until FONT-02.

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

const GENERIC_FAMILIES: &[&str] = &["sans", "serif", "mono"];

const GENERIC_WEIGHTS: &[(&str, &str)] = &[
    ("thin", "100"),
    ("light", "300"),
    ("normal", "400"),
    ("semibold", "600"),
    ("bold", "700"),
    ("black", "900"),
];

/// One `font()` fragment: stack, named weights, and CSS extras.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontDefinition {
    #[serde(default)]
    pub value: String,
    #[serde(default)]
    pub weights: IndexMap<String, String>,
    #[serde(default)]
    pub css: IndexMap<String, String>,
}

/// Name → definition map consulted by atomic `font` / `weight` lowering.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct FontScale {
    #[serde(flatten)]
    fonts: IndexMap<String, FontDefinition>,
}

impl FontScale {
    /// CSS-generic families and keyword weights. No letter-spacing tracking.
    pub fn generic() -> Self {
        let mut fonts = IndexMap::new();
        for family in GENERIC_FAMILIES {
            fonts.insert((*family).to_string(), generic_definition());
        }
        Self { fonts }
    }

    /// Build a scale from an owned definition map, replacing any previous table.
    pub fn from_definitions(fonts: IndexMap<String, FontDefinition>) -> Self {
        Self { fonts }
    }

    /// True when the table has no families.
    pub fn is_empty(&self) -> bool {
        self.fonts.is_empty()
    }

    /// True when `name` is a registered font family.
    pub fn has_family(&self, name: &str) -> bool {
        self.fonts.contains_key(name)
    }

    /// Registered definition for a family name.
    pub fn get(&self, name: &str) -> Option<&FontDefinition> {
        self.fonts.get(name)
    }

    /// Iterate family name + definition pairs in insertion order.
    pub fn iter(&self) -> impl Iterator<Item = (&String, &FontDefinition)> {
        self.fonts.iter()
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

fn generic_definition() -> FontDefinition {
    let mut weights = IndexMap::new();
    for (name, value) in GENERIC_WEIGHTS {
        weights.insert((*name).to_string(), (*value).to_string());
    }
    FontDefinition {
        value: String::new(),
        weights,
        css: IndexMap::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::BaseSystem;

    #[test]
    fn generic_scale_has_css_families() {
        let scale = FontScale::generic();
        assert!(scale.has_family("sans"));
        assert!(scale.has_family("serif"));
        assert!(scale.has_family("mono"));
        assert_eq!(scale.scoped_weight("sans.bold"), Some("700"));
        assert!(scale.get("sans").unwrap().css.is_empty());
    }

    #[test]
    fn lib_fonts_include_tracking() {
        let scale = BaseSystem::lib_fixture().fonts();
        assert_eq!(
            scale.get("sans").unwrap().css.get("letterSpacing"),
            Some(&"-0.01em".to_string())
        );
        assert_eq!(scale.scoped_weight("mono.normal"), Some("393"));
        assert!(scale.get("sans").unwrap().value.contains("Inter"));
    }
}
