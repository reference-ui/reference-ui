//! Font table for one design-system utterance.
//! Stores family names, named weights, CSS family fallback stacks, structured font-face
//! descriptors, and font-level CSS rules such as letter spacing.
//! `generic()` provides standard CSS keyword families without library tracking.
//! `FontScale` answers family queries, weight resolution, and descriptor enumeration
//! for atomic stylesheet and font-face emission.

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

/// Structured `@font-face` descriptor attributes for CSS emission.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontFaceDefinition {
    pub src: String,
    #[serde(default)]
    pub font_weight: Option<String>,
    #[serde(default)]
    pub font_display: Option<String>,
    #[serde(default)]
    pub font_style: Option<String>,
    #[serde(default)]
    pub size_adjust: Option<String>,
    #[serde(default)]
    pub descent_override: Option<String>,
}

/// One `font()` fragment: family stack, named weights, font-face descriptors, and CSS extras.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontDefinition {
    #[serde(default, alias = "family")]
    pub value: String,
    #[serde(default)]
    pub weights: IndexMap<String, String>,
    #[serde(default)]
    pub css: IndexMap<String, String>,
    #[serde(default)]
    pub font_face: Option<FontFaceDefinition>,
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
        font_face: None,
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

    #[test]
    fn bas_font_01_stores_family_value_and_fallback_stacks() {
        let mut fonts = IndexMap::new();
        fonts.insert(
            "sans".to_string(),
            FontDefinition {
                value: "\"Inter\", ui-sans-serif, sans-serif".to_string(),
                weights: IndexMap::new(),
                css: IndexMap::new(),
                font_face: None,
            },
        );
        let scale = FontScale::from_definitions(fonts);
        assert!(scale.has_family("sans"));
        assert_eq!(
            scale.get("sans").unwrap().value,
            "\"Inter\", ui-sans-serif, sans-serif"
        );
    }

    #[test]
    fn bas_font_02_preserves_structured_font_face_descriptors() {
        let mut fonts = IndexMap::new();
        fonts.insert(
            "sans".to_string(),
            FontDefinition {
                value: "Inter, sans-serif".to_string(),
                weights: IndexMap::new(),
                css: IndexMap::new(),
                font_face: Some(FontFaceDefinition {
                    src: "url(/fonts/inter.woff2) format(\"woff2\")".to_string(),
                    font_weight: Some("200 900".to_string()),
                    font_display: Some("swap".to_string()),
                    font_style: None,
                    size_adjust: None,
                    descent_override: None,
                }),
            },
        );
        let scale = FontScale::from_definitions(fonts);
        let face = scale.get("sans").unwrap().font_face.as_ref().unwrap();
        assert_eq!(face.src, "url(/fonts/inter.woff2) format(\"woff2\")");
        assert_eq!(face.font_weight.as_deref(), Some("200 900"));
        assert_eq!(face.font_display.as_deref(), Some("swap"));
    }

    #[test]
    fn bas_font_03_maps_named_font_weight_aliases_to_numeric_weights() {
        let mut weights = IndexMap::new();
        weights.insert("thin".to_string(), "200".to_string());
        weights.insert("normal".to_string(), "400".to_string());
        weights.insert("bold".to_string(), "700".to_string());
        let mut fonts = IndexMap::new();
        fonts.insert(
            "sans".to_string(),
            FontDefinition {
                value: "Inter, sans-serif".to_string(),
                weights,
                css: IndexMap::new(),
                font_face: None,
            },
        );
        let scale = FontScale::from_definitions(fonts);
        assert_eq!(scale.scoped_weight("sans.bold"), Some("700"));
        assert_eq!(scale.scoped_weight("sans.normal"), Some("400"));
        assert_eq!(scale.scoped_weight("sans.thin"), Some("200"));
    }

    #[test]
    fn bas_font_04_attaches_font_level_base_css_declarations() {
        let mut css = IndexMap::new();
        css.insert("letterSpacing".to_string(), "-0.01em".to_string());
        css.insert("fontFeatureSettings".to_string(), "\"cv02\"".to_string());
        let mut fonts = IndexMap::new();
        fonts.insert(
            "sans".to_string(),
            FontDefinition {
                value: "Inter, sans-serif".to_string(),
                weights: IndexMap::new(),
                css,
                font_face: None,
            },
        );
        let scale = FontScale::from_definitions(fonts);
        let def = scale.get("sans").unwrap();
        assert_eq!(
            def.css.get("letterSpacing").map(String::as_str),
            Some("-0.01em")
        );
        assert_eq!(
            def.css.get("fontFeatureSettings").map(String::as_str),
            Some("\"cv02\"")
        );
    }

    #[test]
    fn bas_font_05_preserves_metric_override_descriptors() {
        let def: FontDefinition = serde_json::from_str(
            r#"{"value":"\"Literata\", serif","fontFace":{"src":"url(/fonts/literata.woff2)","sizeAdjust":"104%","descentOverride":"47%"}}"#,
        )
        .unwrap();
        let face = def.font_face.as_ref().unwrap();
        assert_eq!(face.size_adjust.as_deref(), Some("104%"));
        assert_eq!(face.descent_override.as_deref(), Some("47%"));
        assert!(face.font_weight.is_none());
        let bare: FontDefinition =
            serde_json::from_str(r#"{"value":"Inter, sans-serif"}"#).unwrap();
        assert!(bare.font_face.is_none());
    }
}
