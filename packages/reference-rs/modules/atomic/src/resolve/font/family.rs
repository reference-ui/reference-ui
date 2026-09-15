//! `font` dialect utility: expand a family name into fontFamily, default weight, and css extras.
//! Looks up the compile-time font scale ingested from `font()` fragments.
//! Unknown names still stamp `fontFamily`; tracking and numeric extras only appear when the scale has them.
//! Weight authoring (`weight="bold"`) is a sibling file in this folder, not this transform.

use indexmap::IndexMap;

use crate::atom::AtomValue;
use base_system::{FontDefinition, FontScale};

/// Expand `font="sans"` into family, default weight, and any css extras from the scale.
pub fn lower_font(name: &str, fonts: &FontScale) -> Vec<(Box<str>, AtomValue)> {
    // font="sans" → fontFamily + fontWeight (+ letterSpacing from scale)
    let mut pairs = IndexMap::new();
    pairs.insert("fontFamily".to_string(), AtomValue::String(name.into()));

    if let Some(def) = fonts.get(name) {
        insert_preset(&mut pairs, def);
    }

    pairs
        .into_iter()
        .map(|(prop, value)| (prop.into_boxed_str(), value))
        .collect()
}

fn insert_preset(pairs: &mut IndexMap<String, AtomValue>, def: &FontDefinition) {
    // fontWeight from css.fontWeight or weights.normal, then css extras
    pairs.insert(
        "fontWeight".to_string(),
        AtomValue::String(default_weight(def).into()),
    );
    for (prop, value) in &def.css {
        pairs.insert(prop.clone(), AtomValue::String(value.clone().into()));
    }
}

fn default_weight(def: &FontDefinition) -> &str {
    // css: { fontWeight: 'normal' }  /  weights: { normal: '400' }  /  else 400
    def.css
        .get("fontWeight")
        .map(String::as_str)
        .or_else(|| def.weights.get("normal").map(String::as_str))
        .unwrap_or("400")
}
