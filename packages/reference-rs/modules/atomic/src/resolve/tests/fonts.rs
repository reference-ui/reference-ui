//! Font lowering proofs: the generic default family and its css weight, and an ingested font
//! definition whose tracking declarations lower into trailing atoms. Each test builds a
//! `BaseSystem` with the font scale under test and pins the atoms it resolves to. Compiled only
//! under `cfg(test)` as a child of `resolve::tests`.

use super::*;
use base_system::{FontDefinition, FontScale};
use indexmap::IndexMap;

#[test]
fn test_resolve_default_font_and_css_weight() {
    let mut system = BaseSystem::default();
    system.fonts = FontScale::generic();
    let want = Want::new("font", AtomValue::String("sans".into()));
    let atoms = resolve_with(&want, &system);
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "fontFamily");
    assert_eq!(atoms[0].value.css_value_str(), "var(--fonts-sans)");
    assert_eq!(atoms[1].prop.as_ref(), "fontWeight");
    assert_eq!(atoms[1].value.class_name_str(), "400");

    let weight_want = Want::new("weight", AtomValue::String("bold".into()));
    let weight_atoms = resolve_with(&weight_want, &system);
    assert_eq!(weight_atoms.len(), 1);
    assert_eq!(weight_atoms[0].prop.as_ref(), "fontWeight");
    assert_eq!(weight_atoms[0].value.class_name_str(), "700");
}

#[test]
fn test_resolve_ingested_font_tracking() {
    let mut css = IndexMap::new();
    css.insert("letterSpacing".to_string(), "-0.01em".to_string());
    css.insert("fontWeight".to_string(), "normal".to_string());
    let mut weights = IndexMap::new();
    weights.insert("normal".to_string(), "400".to_string());
    let mut map = IndexMap::new();
    map.insert(
        "sans".to_string(),
        FontDefinition {
            value: String::new(),
            weights,
            css,
            font_face: None,
        },
    );
    let mut system = BaseSystem::default();
    system.fonts = FontScale::from_definitions(map);

    let want = Want::new("font", AtomValue::String("sans".into()));
    let atoms = resolve_with(&want, &system);
    assert_eq!(atoms.len(), 3);
    assert_eq!(atoms[1].value.class_name_str(), "normal");
    assert_eq!(atoms[2].prop.as_ref(), "letterSpacing");
    assert_eq!(atoms[2].value.class_name_str(), "-0.01em");
}
