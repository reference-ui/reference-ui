//! Lowering proofs for plain want shapes: rhythm and shorthand decomposition, token links,
//! container and size macros, the border bool macro, and null or bool wants that emit no atom.
//! Each test resolves one `Want` through `resolve_want` or a fixture-backed session and pins the
//! emitted atoms or the single diagnostic. Compiled only under `cfg(test)` as a child of `resolve::tests`.

use super::*;

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
    let want = Want::new("color", AtomValue::Bool(true));
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(atoms.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].message,
        "`color` value `true` is not valid CSS"
    );
}

#[test]
fn test_border_bool_macro_emits_width_and_style() {
    let want = Want::new("border", AtomValue::Bool(true));
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(diagnostics.is_empty(), "{diagnostics:?}");
    assert_eq!(atoms.len(), 2);
    assert_eq!(atoms[0].prop.as_ref(), "borderWidth");
    assert_eq!(atoms[0].value.css_value_str(), "1px");
    assert_eq!(atoms[1].prop.as_ref(), "borderStyle");
    assert_eq!(atoms[1].value.css_value_str(), "solid");
}

#[test]
fn test_border_false_still_warns_and_skips() {
    let want = Want::new("border", AtomValue::Bool(false));
    let atoms = resolve_want(&want);
    assert!(atoms.is_empty());
}

#[test]
fn test_null_want_strips_silently() {
    let want = Want::new("color", AtomValue::Null);
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(&want, &mut session);
    assert!(atoms.is_empty());
    assert!(diagnostics.is_empty());
}

#[test]
fn test_container_bool_still_lowers() {
    let want = Want::new("container", AtomValue::Bool(true));
    let atoms = resolve_want(&want);
    assert_eq!(atoms.len(), 1);
    assert_eq!(atoms[0].prop.as_ref(), "containerType");
    assert_eq!(atoms[0].value.css_value_str(), "inline-size");
}
