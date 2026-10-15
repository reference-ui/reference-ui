//! Unit tests for font family expand, scoped weights, and CSS keyword fallback.
//! Asserts the generic scale has no lib tracking, ingested css extras land, and bare `bold` maps to `700`.
//! A dotted scale miss such as `mono.black` maps to its suffix keyword, and a suffix that names no keyword passes raw.

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

#[test]
fn test_scale_miss_falls_back_to_suffix_keyword() {
    let mut weights = Map::new();
    weights.insert("thin".to_string(), "100".to_string());
    weights.insert("normal".to_string(), "393".to_string());
    let mut map = Map::new();
    map.insert(
        "mono".to_string(),
        FontDefinition {
            value: String::new(),
            weights,
            css: Map::new(),
            font_face: None,
        },
    );
    let fonts = FontScale::from_definitions(map);

    // `mono` declares no `black`, so the suffix names a CSS keyword: 900.
    let miss = lower_weight("mono.black", &fonts);
    assert_eq!(miss[0].0.as_ref(), "fontWeight");
    assert_eq!(miss[0].1.class_name_str(), "900");
    // A suffix that names no keyword still passes the dotted name through raw.
    let raw = lower_weight("mono.foo", &fonts);
    assert_eq!(raw[0].1.class_name_str(), "mono.foo");
    // A scale hit still wins over the keyword table.
    let hit = lower_weight("mono.normal", &fonts);
    assert_eq!(hit[0].1.class_name_str(), "393");
}
