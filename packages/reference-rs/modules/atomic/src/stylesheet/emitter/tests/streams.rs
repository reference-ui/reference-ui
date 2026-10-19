//! Dual-sheet stream builds: concatenation, paired-build equality, the ten wire keys, and the preamble-only fallback.
//! Each case compares the captured per-layer streams against the single-sheet builders over the same atom set.

use super::*;
use crate::atom::CssValue;
use crate::stylesheet::root_default::ROOT_DEFAULT_BLOCK;
use smallvec::smallvec;

#[test]
fn test_streams_concatenate_to_paired_single_builds() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "color".into(),
        CssValue::String("blue.600".into()),
        smallvec![],
        false,
    ));
    let system = BaseSystem::lib_fixture();
    let mut primary = Vec::new();
    let mut portable_sink = Vec::new();
    let streams = build_stylesheet_streams(
        &SheetInput {
        own: &set,
        foreign: &crate::atom::ForeignAtoms::new(),
        qualifiers: &own_qualifiers(system),
        extended: &[],
        system,
        recipes: &[],
    },
        StylesheetSinks {
            primary: &mut primary,
            portable: &mut portable_sink,
        },
    );
    let mut single_primary = Vec::new();
    let mut single_portable = Vec::new();
    assert_eq!(
        streams.stylesheet(),
        build_stylesheet_with(
        &SheetInput {
        own: &set,
        foreign: &crate::atom::ForeignAtoms::new(),
        qualifiers: &own_qualifiers(system),
        extended: &[],
        system,
        recipes: &[],
    },
        &mut single_primary,
    )
    );
    assert_eq!(
        streams.portable_stylesheet(),
        build_portable_stylesheet_with(
        &SheetInput {
        own: &set,
        foreign: &crate::atom::ForeignAtoms::new(),
        qualifiers: &own_qualifiers(system),
        extended: &[],
        system,
        recipes: &[],
    },
        &mut single_portable,
    )
    );
    assert_eq!(primary, single_primary);
    assert_eq!(portable_sink, single_portable);
    assert_eq!(streams.preamble, LAYER_PREAMBLE);
    assert_eq!(streams.package, system.name);
    assert_eq!(streams.root, ROOT_DEFAULT_BLOCK);
    assert!(streams.stylesheet().starts_with(ROOT_DEFAULT_BLOCK));
    assert!(streams.portable_stylesheet().starts_with(ROOT_DEFAULT_BLOCK));
    assert!(streams.global.contains("@layer global {"));
    assert!(streams.tokens.contains(":root"));
    assert!(streams.tokens_portable.contains("[data-layer="));
    assert!(streams.recipes.is_empty());
    assert!(streams.utilities.contains("@layer utilities {"));
}

#[test]
fn test_dual_build_matches_paired_single_builds() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "color".into(),
        CssValue::String("blue.600".into()),
        smallvec![],
        false,
    ));
    set.insert(Atom::new(
        "color".into(),
        CssValue::String("red.500".into()),
        smallvec![when("_hover")],
        false,
    ));
    let system = BaseSystem::lib_fixture();
    let mut primary = Vec::new();
    let mut portable_sink = Vec::new();
    let (streams, sheet, portable) = build_stylesheets_with(
        &SheetInput {
            own: &set,
            foreign: &crate::atom::ForeignAtoms::new(),
            qualifiers: &own_qualifiers(system),
            extended: &[],
            system,
            recipes: &[],
        },
        StylesheetSinks {
            primary: &mut primary,
            portable: &mut portable_sink,
        },
    );
    let mut single_primary = Vec::new();
    let mut single_portable = Vec::new();
    assert_eq!(
        sheet,
        build_stylesheet_with(
        &SheetInput {
        own: &set,
        foreign: &crate::atom::ForeignAtoms::new(),
        qualifiers: &own_qualifiers(system),
        extended: &[],
        system,
        recipes: &[],
    },
        &mut single_primary,
    )
    );
    assert_eq!(
        portable,
        build_portable_stylesheet_with(
        &SheetInput {
        own: &set,
        foreign: &crate::atom::ForeignAtoms::new(),
        qualifiers: &own_qualifiers(system),
        extended: &[],
        system,
        recipes: &[],
    },
        &mut single_portable,
    )
    );
    assert_eq!(primary, single_primary);
    assert_eq!(portable_sink, single_portable);
    assert_eq!(streams.name, system.name);
    assert_eq!(streams.stylesheet(), sheet);
    assert_eq!(streams.portable_stylesheet(), portable);
}

#[test]
fn test_streams_serialize_to_ten_wire_keys() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "color".into(),
        CssValue::String("blue.600".into()),
        smallvec![],
        false,
    ));
    let system = BaseSystem::lib_fixture();
    let mut primary = Vec::new();
    let mut portable_sink = Vec::new();
    let streams = build_stylesheet_streams(
        &SheetInput {
        own: &set,
        foreign: &crate::atom::ForeignAtoms::new(),
        qualifiers: &own_qualifiers(system),
        extended: &[],
        system,
        recipes: &[],
    },
        StylesheetSinks {
            primary: &mut primary,
            portable: &mut portable_sink,
        },
    );
    let value = serde_json::to_value(&streams).expect("streams serialize");
    let keys: Vec<&str> = value
        .as_object()
        .expect("streams are one object")
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(
        keys,
        [
            "name",
            "root",
            "preamble",
            "reset",
            "global",
            "tokens",
            "tokensPortable",
            "recipes",
            "utilities",
            "package"
        ]
    );
    assert_eq!(value["name"], serde_json::json!(system.name));
    assert_eq!(value["root"], serde_json::json!(ROOT_DEFAULT_BLOCK));
    assert!(value["tokens"].as_str().is_some_and(|s| s.contains(":root")));
    assert!(
        value["tokensPortable"]
            .as_str()
            .is_some_and(|s| s.contains("[data-layer="))
    );
}

#[test]
fn test_preamble_only_reprints_to_bare_preamble() {
    let streams = StylesheetStreams::preamble_only();
    assert!(streams.name.is_empty());
    assert_eq!(streams.stylesheet(), LAYER_PREAMBLE);
    assert_eq!(streams.portable_stylesheet(), LAYER_PREAMBLE);
}
