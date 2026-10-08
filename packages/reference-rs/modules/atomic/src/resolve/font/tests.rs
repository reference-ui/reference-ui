//! Unit tests for font family expand, scoped weights, and CSS keyword fallback.
//! Asserts the generic scale has no lib tracking, ingested css extras land, and bare `bold` maps to `700`.

use super::*;
use base_system::{FontDefinition, FontScale};
use indexmap::IndexMap as Map;

#[test]
fn test_default_font_has_no_lib_tracking() {
    let fonts = FontScale::generic();
    let pairs = lower_font("sans", &fonts);
    assert_eq!(pairs[0].0.as_ref(), "fontFamily");
    assert_eq!(pairs[0].1.class_name_str(), "sans");
    assert_eq!(pairs[1].0.as_ref(), "fontWeight");
    assert_eq!(pairs[1].1.class_name_str(), "400");
    assert_eq!(pairs.len(), 2);
}

#[test]
fn test_ingested_font_css_and_scoped_weight() {
    let mut css = Map::new();
    css.insert("letterSpacing".to_string(), "-0.01em".to_string());
    css.insert("fontWeight".to_string(), "normal".to_string());
    let mut weights = Map::new();
    weights.insert("bold".to_string(), "700".to_string());
    weights.insert("normal".to_string(), "400".to_string());
    let mut map = Map::new();
    map.insert(
        "sans".to_string(),
        FontDefinition {
            value: String::new(),
            weights,
            css,
            font_face: None,
        },
    );
    let fonts = FontScale::from_definitions(map);

    let pairs = lower_font("sans", &fonts);
    assert_eq!(pairs[0].1.class_name_str(), "sans");
    assert_eq!(pairs[1].1.class_name_str(), "normal");
    assert_eq!(pairs[2].0.as_ref(), "letterSpacing");
    assert_eq!(pairs[2].1.class_name_str(), "-0.01em");

    let weight = lower_weight("sans.bold", &fonts);
    assert_eq!(weight[0].1.class_name_str(), "700");
}

#[test]
fn test_bare_weight_uses_css_keywords() {
    let fonts = FontScale::generic();
    let pairs = lower_weight("bold", &fonts);
    assert_eq!(pairs[0].1.class_name_str(), "700");
}
