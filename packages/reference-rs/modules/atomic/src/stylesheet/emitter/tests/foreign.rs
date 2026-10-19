//! Foreign utility grouping on both sheets and the guard that drops an empty utilities block.
//! Foreign rules print only under the systems their backing names, so these cases pin both the
//! grouped output and the flat fallback.

use super::*;
use crate::atom::{Backing, CssValue, ForeignAtoms};
use smallvec::smallvec;

/// Grouped emission rides both sheets: the own group prints as before and each
/// backing system contributes one appended group, and the portable sheet
/// agrees with the grouped single-build exactly.
#[test]
fn test_grouped_foreign_rules_ride_both_sheets() {
    let own_atom = Atom::new(
        "color".into(),
        CssValue::String("blue.600".into()),
        smallvec![],
        false,
    );
    let ext_atom = Atom::new(
        "padding".into(),
        CssValue::String("2r".into()),
        smallvec![],
        false,
    );
    let mut own = AtomSet::new();
    own.insert(own_atom.clone());
    let mut external = ForeignAtoms::new();
    external.insert(ext_atom.clone(), &Backing::systems(["alpha"]));

    let system = BaseSystem::lib_fixture();
    let qualifiers = vec![system.name.clone(), "alpha".to_string()];
    let mut primary = Vec::new();
    let mut portable_sink = Vec::new();
    let (streams, sheet, portable) = build_stylesheets_with(
        &SheetInput {
            own: &own,
            foreign: &external,
            qualifiers: &qualifiers,
            extended: &[],
            system,
            recipes: &[],
        },
        StylesheetSinks {
            primary: &mut primary,
            portable: &mut portable_sink,
        },
    );

    let own_sel = name::selector_with_system(&own_atom, &system.name);
    let foreign_sel = name::selector_with_system(&ext_atom, "alpha");
    for sheet in [&sheet, &portable] {
        assert!(sheet.contains(&own_sel), "own rule missing:\n{sheet}");
        assert!(sheet.contains(&foreign_sel), "foreign rule missing:\n{sheet}");
    }
    assert!(
        streams.utilities.find(&own_sel) < streams.utilities.find(&foreign_sel),
        "own group must precede the foreign group:\n{}",
        streams.utilities
    );
    assert_eq!(
        portable,
        build_portable_stylesheet_with(
        &SheetInput {
        own: &own,
        foreign: &external,
        qualifiers: &qualifiers,
        extended: &[],
        system,
        recipes: &[],
    },
        &mut Vec::new(),
    )
    );
}

/// No empty blocks: a foreign atom nothing backs prints nothing, and an empty
/// own set never opens an empty `@layer utilities`.
#[test]
fn test_no_empty_utilities_block_without_a_backing_system() {
    let pad = Atom::new(
        "padding".into(),
        CssValue::String("2r".into()),
        smallvec![],
        false,
    );
    let mut unbacked = ForeignAtoms::new();
    unbacked.insert(pad.clone(), &Backing::none());
    let system = BaseSystem::lib_fixture();
    let own = AtomSet::new();
    let no_foreign = vec![system.name.clone(), "alpha".to_string()];
    let css = build_stylesheet_with(
        &SheetInput {
        own: &own,
        foreign: &unbacked,
        qualifiers: &no_foreign,
        extended: &[],
        system,
        recipes: &[],
    },
        &mut Vec::new(),
    );
    assert!(!css.contains("@layer utilities"), "{css}");

    // Backed under a system the block appears and carries the foreign rule.
    let mut external = ForeignAtoms::new();
    external.insert(pad, &Backing::systems(["alpha"]));
    let with_foreign = vec![system.name.clone(), "alpha".to_string()];
    let css = build_stylesheet_with(
        &SheetInput {
        own: &own,
        foreign: &external,
        qualifiers: &with_foreign,
        extended: &[],
        system,
        recipes: &[],
    },
        &mut Vec::new(),
    );
    assert!(css.contains("@layer utilities {"), "{css}");
    assert!(css.contains(".alpha__p_2r"), "{css}");
}
