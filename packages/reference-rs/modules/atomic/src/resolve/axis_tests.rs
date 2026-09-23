//! Axis-shorthand lowering proofs for the four logical box aliases.
//! Pins that `marginX`, `marginY`, `paddingX`, and `paddingY` resolve as
//! known style props through the shared want pipeline: one atom each, the
//! authored spelling kept on the atom, rhythm values lowered to the spacing
//! root calc, and class/declaration rendering through the canonical logical
//! property. The twins (`mx`, `my`, `px`, `py`) converge on the same classes.

use super::{resolve_want, resolve_want_with, ResolveSession};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::DiagnosticLocation;
use crate::stylesheet::name::class_name;

/// Authored axis spelling, canonical logical property, class prefix, CSS declaration.
const AXIS_ROWS: &[(&str, &str, &str, &str)] = &[
    ("marginX", "marginInline", "mx", "margin-inline"),
    ("marginY", "marginBlock", "my", "margin-block"),
    ("paddingX", "paddingInline", "px", "padding-inline"),
    ("paddingY", "paddingBlock", "py", "padding-block"),
];

#[test]
fn axis_shorthands_resolve_to_one_rhythm_atom_each() {
    for (authored, canonical, prefix, declaration) in AXIS_ROWS {
        assert!(
            canon::is_known_style_prop(authored),
            "'{authored}' must be a known style prop"
        );
        assert_eq!(canon::resolve_canonical_prop(authored), *canonical);
        let want = Want::new(*authored, AtomValue::String("2r".into()));
        let atoms = resolve_want(&want);
        assert_eq!(atoms.len(), 1, "'{authored}' must resolve to one atom");
        assert_eq!(atoms[0].prop.as_ref(), *authored);
        assert_eq!(
            atoms[0].value.css_value_str(),
            "calc(2 * var(--spacing-root))"
        );
        assert_eq!(class_name(&atoms[0]), format!("{prefix}_2r"));
        assert_eq!(
            canon::to_css_declaration_property(authored),
            *declaration
        );
    }
}

/// Authored longhand next to its short twin: both name one class.
const TWIN_ROWS: &[(&str, &str)] = &[
    ("marginX", "mx"),
    ("marginY", "my"),
    ("paddingX", "px"),
    ("paddingY", "py"),
];

#[test]
fn axis_shorthands_converge_with_short_twins() {
    for (longhand, short) in TWIN_ROWS {
        let long_atoms = resolve_want(&Want::new(*longhand, AtomValue::String("2r".into())));
        let short_atoms = resolve_want(&Want::new(*short, AtomValue::String("2r".into())));
        assert_eq!(long_atoms.len(), 1);
        assert_eq!(short_atoms.len(), 1);
        assert_eq!(
            class_name(&long_atoms[0]),
            class_name(&short_atoms[0]),
            "'{longhand}' and '{short}' must name one class"
        );
        assert_eq!(
            long_atoms[0].value.css_value_str(),
            short_atoms[0].value.css_value_str()
        );
    }
}

#[test]
fn axis_shorthands_emit_no_diagnostics() {
    for (authored, _, _, _) in AXIS_ROWS {
        let mut diagnostics = Vec::new();
        let mut session = ResolveSession {
            system: base_system::BaseSystem::lib_fixture(),
            diagnostics: &mut diagnostics,
            location: DiagnosticLocation::default(),
            sink: None,
            want: None,
        };
        let want = Want::new(*authored, AtomValue::String("2r".into()));
        let atoms = resolve_want_with(&want, &mut session);
        assert_eq!(atoms.len(), 1, "'{authored}' must resolve to one atom");
        assert!(
            session.diagnostics.is_empty(),
            "'{authored}' must emit no diagnostics, got {:?}",
            session.diagnostics
        );
    }
}
