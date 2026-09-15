//! Orchestration pipeline for transforming raw styling wants into fully resolved atomic utilities.
//! Coordinates dialect utilities (`font`, `weight`, `container`, `size`, `r`), shorthand expansion, rhythm, and tokens.
//! Font tracking, named weights, and token lookup come from `BaseSystem`, not a second preset table here.

pub mod conditions;
pub mod container;
pub mod font;
pub mod r;
pub mod rhythm;
pub mod shorthands;
pub mod size;
pub mod tokens;

use base_system::BaseSystem;
use smallvec::SmallVec;

use crate::atom::{Atom, AtomValue, CssValue, Want, When};
use crate::diagnostics::Diagnostic;
use crate::resolve::conditions::{lower_when, LoweredWhen};

/// Pass state for one want → atom lowering.
pub struct ResolveSession<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

/// Resolve a raw styling want into one or more canonical atomic declarations.
pub fn resolve_want(want: &Want) -> Vec<Atom> {
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
    };
    resolve_want_with(want, &mut session)
}

/// Resolve a want against an ingested base system.
pub fn resolve_want_with(want: &Want, session: &mut ResolveSession<'_>) -> Vec<Atom> {
    if !canon::is_known_style_prop(&want.prop) {
        return Vec::new();
    }
    let Some(clean_when) = lower_conditions(&want.when, session) else {
        return Vec::new();
    };
    let pairs = expand_or_passthrough(want, session.system);

    let mut atoms = Vec::with_capacity(pairs.len());
    for (prop, val) in pairs {
        if let Some(final_val) = resolve_atom_value(&prop, val, session) {
            atoms.push(Atom::new(
                prop,
                final_val,
                clean_when.clone(),
                want.important,
            ));
        }
    }
    atoms
}

fn expand_or_passthrough(want: &Want, system: &BaseSystem) -> Vec<(Box<str>, AtomValue)> {
    if let Some(expanded) = lower_macro(want, system) {
        expanded
    } else if let Some(expanded) = shorthands::expand_shorthand(&want.prop, &want.value) {
        expanded
    } else {
        vec![(want.prop.clone(), want.value.clone())]
    }
}

fn lower_macro(want: &Want, system: &BaseSystem) -> Option<Vec<(Box<str>, AtomValue)>> {
    let prop = want.prop.as_ref();
    if is_runtime_owned(prop) {
        return Some(Vec::new());
    }
    let fonts = system.fonts();
    if prop == "font" {
        return Some(font::lower_font(want.value.class_name_str(), fonts));
    }
    if prop == "weight" {
        return Some(font::lower_weight(want.value.class_name_str(), fonts));
    }
    if prop == "container" {
        return Some(container::lower(want));
    }
    if prop == "size" {
        return Some(size::lower(want));
    }
    None
}

fn is_runtime_owned(prop: &str) -> bool {
    matches!(prop, "variant" | "colorMode")
}

fn lower_conditions(
    when: &[Box<str>],
    session: &mut ResolveSession<'_>,
) -> Option<SmallVec<[When; 2]>> {
    let mut out = SmallVec::new();
    let mut known = true;
    for raw in when {
        match lower_when(raw, session.system) {
            LoweredWhen::Skip => {}
            LoweredWhen::Known(cond) => out.push(cond),
            LoweredWhen::Unknown => {
                session
                    .diagnostics
                    .push(Diagnostic::warning(format!("Unknown condition \"{raw}\"")));
                known = false;
            }
        }
    }
    if known {
        Some(out)
    } else {
        None
    }
}

fn resolve_atom_value(
    prop: &str,
    val: AtomValue,
    session: &mut ResolveSession<'_>,
) -> Option<CssValue> {
    let css = css_value_from_authored(prop, val, session.diagnostics)?;
    Some(apply_rhythm_and_tokens(prop, css, session))
}

fn css_value_from_authored(
    prop: &str,
    val: AtomValue,
    diagnostics: &mut Vec<Diagnostic>,
) -> Option<CssValue> {
    if matches!(&val, AtomValue::Bool(_) | AtomValue::Null) {
        diagnostics.push(Diagnostic::warning(format!(
            "`{prop}` value `{val}` is not valid CSS"
        )));
        return None;
    }
    val.into_css_value()
}

fn apply_rhythm_and_tokens(
    prop: &str,
    css: CssValue,
    session: &mut ResolveSession<'_>,
) -> CssValue {
    let val_str = css.class_name_str();
    let rhythm_resolved = rhythm::resolve_rhythm(val_str);
    let token_resolved =
        tokens::resolve_token_value(prop, &rhythm_resolved, session.system, session.diagnostics);

    if token_resolved != val_str {
        CssValue::Token {
            path: val_str.into(),
            value: token_resolved.into_owned().into_boxed_str(),
        }
    } else {
        css
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use base_system::{FontDefinition, FontScale};
    use indexmap::IndexMap;

    fn resolve_with(want: &Want, system: &BaseSystem) -> Vec<Atom> {
        let mut diagnostics = Vec::new();
        let mut session = ResolveSession {
            system,
            diagnostics: &mut diagnostics,
        };
        resolve_want_with(want, &mut session)
    }

    #[test]
    fn test_resolve_rhythm_want() {
        let want = Want::new("mt", AtomValue::String("2r".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 1);
        assert_eq!(atoms[0].prop.as_ref(), "mt");
        assert_eq!(atoms[0].value.class_name_str(), "2r");
        assert_eq!(
            atoms[0].value.css_value_str(),
            "calc(2 * var(--spacing-root))"
        );
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
        let atoms = resolve_with(&want, BaseSystem::lib_fixture());
        assert_eq!(atoms.len(), 1);
        assert_eq!(atoms[0].value.class_name_str(), "blue.600");
        assert_eq!(atoms[0].value.css_value_str(), "var(--colors-blue-600)");
    }

    #[test]
    fn test_resolve_container() {
        let want = Want::new("container", AtomValue::String("sidebar".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 2);
        assert_eq!(atoms[0].prop.as_ref(), "containerType");
        assert_eq!(atoms[0].value.class_name_str(), "inline-size");
        assert_eq!(atoms[1].prop.as_ref(), "containerName");
        assert_eq!(atoms[1].value.class_name_str(), "sidebar");
    }

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

    #[test]
    fn test_resolve_size() {
        let want = Want::new("size", AtomValue::String("20px".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 2);
        assert_eq!(atoms[0].prop.as_ref(), "width");
        assert_eq!(atoms[0].value.class_name_str(), "20px");
        assert_eq!(atoms[1].prop.as_ref(), "height");
        assert_eq!(atoms[1].value.class_name_str(), "20px");
    }

    #[test]
    fn test_resolve_variant_color_mode_empty() {
        let want_variant = Want::new("variant", AtomValue::String("primary".into()));
        assert!(resolve_want(&want_variant).is_empty());

        let want_color_mode = Want::new("colorMode", AtomValue::String("dark".into()));
        assert!(resolve_want(&want_color_mode).is_empty());
    }

    #[test]
    fn test_bool_want_emits_no_atom() {
        let want = Want::new("border", AtomValue::Bool(true));
        let mut diagnostics = Vec::new();
        let system = BaseSystem::default();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
        };
        let atoms = resolve_want_with(&want, &mut session);
        assert!(atoms.is_empty());
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(
            diagnostics[0].message,
            "`border` value `true` is not valid CSS"
        );
    }

    #[test]
    fn test_null_want_emits_no_atom() {
        let want = Want::new("color", AtomValue::Null);
        let mut diagnostics = Vec::new();
        let system = BaseSystem::default();
        let mut session = ResolveSession {
            system: &system,
            diagnostics: &mut diagnostics,
        };
        let atoms = resolve_want_with(&want, &mut session);
        assert!(atoms.is_empty());
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(
            diagnostics[0].message,
            "`color` value `null` is not valid CSS"
        );
    }

    #[test]
    fn test_container_bool_still_lowers() {
        let want = Want::new("container", AtomValue::Bool(true));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 1);
        assert_eq!(atoms[0].prop.as_ref(), "containerType");
        assert_eq!(atoms[0].value.css_value_str(), "inline-size");
    }
}
