//! Orchestration pipeline for transforming raw styling wants into fully resolved atomic utilities.
//! Coordinates condition normalization, shorthand expansion, rhythm unit computation, and token mapping.
//! Bridges extracted AST intentions with the canonical atom representations needed for stylesheet generation.

pub mod conditions;
pub mod patterns;
pub mod rhythm;
pub mod shorthands;
pub mod tokens;

use smallvec::SmallVec;
use crate::atom::{Atom, AtomValue, Want};

/// Resolve a raw styling want into one or more canonical atomic declarations.
pub fn resolve_want(want: &Want) -> Vec<Atom> {
    if !canon::is_known_style_prop(&want.prop) {
        return Vec::new();
    }
    let pairs = expand_or_passthrough(want);
    let clean_when: SmallVec<[Box<str>; 2]> = sanitize_conditions(&want.when);

    let mut atoms = Vec::with_capacity(pairs.len());
    for (prop, val) in pairs {
        let final_val = resolve_atom_value(&prop, val);
        atoms.push(Atom::new(
            prop,
            final_val,
            clean_when.clone(),
            want.important,
        ));
    }
    atoms
}

fn expand_or_passthrough(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    if let Some(pattern_atoms) = patterns::lower_pattern_props(want) {
        pattern_atoms
    } else if let Some(expanded) = shorthands::expand_shorthand(&want.prop, &want.value) {
        expanded
    } else {
        vec![(want.prop.clone(), want.value.clone())]
    }
}

fn sanitize_conditions(conditions: &[Box<str>]) -> SmallVec<[Box<str>; 2]> {
    conditions
        .iter()
        .filter(|w| w.as_ref() != "base")
        .cloned()
        .collect()
}

fn resolve_atom_value(prop: &str, val: AtomValue) -> AtomValue {
    let val_str = val.class_name_str();
    let rhythm_resolved = rhythm::resolve_rhythm(val_str);
    let token_resolved = tokens::resolve_token_value(prop, &rhythm_resolved);

    if token_resolved != val_str {
        AtomValue::Token {
            path: val_str.into(),
            value: token_resolved.into_owned().into_boxed_str(),
        }
    } else {
        val
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_rhythm_want() {
        let want = Want::new("mt", AtomValue::String("2r".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 1);
        assert_eq!(atoms[0].prop.as_ref(), "mt");
        assert_eq!(atoms[0].value.class_name_str(), "2r");
        assert_eq!(atoms[0].value.css_value_str(), "calc(2 * var(--spacing-root))");
    }

    #[test]
    fn test_resolve_shorthand_border_want() {
        let want = Want::new("borderBottom", AtomValue::String("3px solid".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 2);
        assert_eq!(atoms[0].prop.as_ref(), "borderBottomWidth");
        assert_eq!(atoms[0].value.css_value_str(), "3px");
        assert_eq!(atoms[1].prop.as_ref(), "borderBottomStyle");
        assert_eq!(atoms[1].value.css_value_str(), "solid");
    }

    #[test]
    fn test_resolve_token_want() {
        let want = Want::new("color", AtomValue::String("blue.600".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 1);
        assert_eq!(atoms[0].value.class_name_str(), "blue.600");
        assert_eq!(atoms[0].value.css_value_str(), "var(--colors-blue-600)");
    }

    #[test]
    fn test_resolve_pattern_container() {
        let want = Want::new("container", AtomValue::String("sidebar".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 2);
        assert_eq!(atoms[0].prop.as_ref(), "containerType");
        assert_eq!(atoms[0].value.class_name_str(), "inline-size");
        assert_eq!(atoms[1].prop.as_ref(), "containerName");
        assert_eq!(atoms[1].value.class_name_str(), "sidebar");
    }

    #[test]
    fn test_resolve_pattern_font_and_weight() {
        let want = Want::new("font", AtomValue::String("sans".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 3);
        assert_eq!(atoms[0].prop.as_ref(), "fontFamily");
        assert_eq!(atoms[0].value.css_value_str(), "var(--fonts-sans)");
        assert_eq!(atoms[1].prop.as_ref(), "fontWeight");
        assert_eq!(atoms[1].value.class_name_str(), "normal");
        assert_eq!(atoms[2].prop.as_ref(), "letterSpacing");
        assert_eq!(atoms[2].value.class_name_str(), "-0.01em");

        let weight_want = Want::new("weight", AtomValue::String("bold".into()));
        let weight_atoms = resolve_want(&weight_want);
        assert_eq!(weight_atoms.len(), 1);
        assert_eq!(weight_atoms[0].prop.as_ref(), "fontWeight");
        assert_eq!(weight_atoms[0].value.class_name_str(), "700");
    }

    #[test]
    fn test_resolve_pattern_size() {
        let want = Want::new("size", AtomValue::String("20px".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 2);
        assert_eq!(atoms[0].prop.as_ref(), "width");
        assert_eq!(atoms[0].value.class_name_str(), "20px");
        assert_eq!(atoms[1].prop.as_ref(), "height");
        assert_eq!(atoms[1].value.class_name_str(), "20px");
    }

    #[test]
    fn test_resolve_pattern_variant_color_mode_empty() {
        let want_variant = Want::new("variant", AtomValue::String("primary".into()));
        assert!(resolve_want(&want_variant).is_empty());

        let want_color_mode = Want::new("colorMode", AtomValue::String("dark".into()));
        assert!(resolve_want(&want_color_mode).is_empty());
    }
}
