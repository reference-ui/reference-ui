//! Unit tests for the manifest index and its duplicate-name rules: which symbols the index names, and which
//! same-named symbols count as conflicts. Each case builds a small bundle and checks the index or the warning
//! predicate directly.

use std::collections::{BTreeMap, BTreeSet};

use super::build_manifest_symbol_indices;
use super::duplicates::should_warn_duplicate_symbol_name;
use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::emitted::{TastySymbolIndexEntry, TastySymbolKind};
use crate::model::{TsSymbol, TsSymbolKind, TypeRef, TypeScriptBundle};

fn entry(id: &str, name: &str, library: &str) -> TastySymbolIndexEntry {
    TastySymbolIndexEntry {
        id: id.to_string(),
        name: name.to_string(),
        kind: TastySymbolKind::TypeAlias,
        chunk: format!("./chunks/{id}.js"),
        library: library.to_string(),
    }
}

fn symbol(id: &str, name: &str, library: &str, underlying: Option<TypeRef>) -> TsSymbol {
    TsSymbol {
        id: id.to_string(),
        name: name.to_string(),
        library: library.to_string(),
        kind: TsSymbolKind::TypeAlias,
        file_id: format!("{id}.ts"),
        exported: true,
        description: None,
        description_raw: None,
        jsdoc: None,
        type_parameters: vec![],
        defined_members: vec![],
        extends: vec![],
        underlying,
        references: vec![],
    }
}

fn symbol_ids_by_export_name(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs
        .iter()
        .map(|(export_name, symbol_id)| ((*export_name).to_string(), (*symbol_id).to_string()))
        .collect()
}

#[test]
fn indexes_only_user_and_bridged_symbols_by_name() {
    // Followed-without-indexing (Objective 1 RS fix): every symbol gets
    // a symbols_by_id entry, but only user and bridged-library symbols
    // enter symbols_by_name. Plain-imported external targets stay
    // resolvable by id without polluting bare-name lookups.
    let symbols = BTreeMap::from([
        (
            "user-symbol".to_string(),
            symbol("user-symbol", "Local", USER_LIBRARY_NAME, None),
        ),
        (
            "widget-symbol".to_string(),
            symbol("widget-symbol", "Widget", "@scope/widgets", None),
        ),
        (
            "helper-symbol".to_string(),
            symbol("helper-symbol", "Helper", "@scope/other", None),
        ),
    ]);
    let export_names = BTreeMap::from([
        ("user-symbol".to_string(), "_u".to_string()),
        ("widget-symbol".to_string(), "_w".to_string()),
        ("helper-symbol".to_string(), "_h".to_string()),
    ]);
    let bundle = TypeScriptBundle {
        version: 1,
        root_dir: ".".to_string(),
        entry_globs: Vec::new(),
        files: BTreeMap::new(),
        symbols,
        exports: BTreeMap::new(),
        diagnostics: Vec::new(),
        bridged_libraries: BTreeSet::from(["@scope/widgets".to_string()]),
    };

    let (symbols_by_name, symbols_by_id) =
        build_manifest_symbol_indices(&bundle, &export_names);

    assert_eq!(symbols_by_name.len(), 2);
    assert_eq!(symbols_by_name["Local"], vec!["_u".to_string()]);
    assert_eq!(symbols_by_name["Widget"], vec!["_w".to_string()]);
    assert!(!symbols_by_name.contains_key("Helper"));
    assert_eq!(symbols_by_id.len(), 3);
    assert!(symbols_by_id.contains_key("_h"));
}

#[test]
fn suppresses_cross_library_external_duplicates() {
    let symbols_by_id = BTreeMap::from([
        (
            "_a".to_string(),
            entry("_a", "Shared", "@reference-ui/react"),
        ),
        (
            "_b".to_string(),
            entry("_b", "Shared", "@reference-ui/system"),
        ),
        (
            "_c".to_string(),
            entry("_c", "Shared", "@reference-ui/types"),
        ),
    ]);
    let symbols = BTreeMap::new();
    let symbol_ids = vec!["_a".to_string(), "_b".to_string(), "_c".to_string()];

    assert!(!should_warn_duplicate_symbol_name(
        &symbol_ids,
        &symbols_by_id,
        &symbols,
        &BTreeMap::new(),
    ));
}

#[test]
fn suppresses_unique_user_external_collisions_warning() {
    let symbols_by_id = BTreeMap::from([
        ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
        (
            "_b".to_string(),
            entry("_b", "Shared", "@reference-ui/system"),
        ),
    ]);
    let symbols = BTreeMap::from([
        (
            "user-symbol".to_string(),
            symbol(
                "user-symbol",
                "Shared",
                USER_LIBRARY_NAME,
                Some(TypeRef::Intrinsic {
                    name: "string".to_string(),
                }),
            ),
        ),
        (
            "system-symbol".to_string(),
            symbol(
                "system-symbol",
                "Shared",
                "@reference-ui/system",
                Some(TypeRef::Intrinsic {
                    name: "number".to_string(),
                }),
            ),
        ),
    ]);
    let export_name_map =
        symbol_ids_by_export_name(&[("_a", "user-symbol"), ("_b", "system-symbol")]);
    let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

    assert!(!should_warn_duplicate_symbol_name(
        &symbol_ids,
        &symbols_by_id,
        &symbols,
        &export_name_map,
    ));
}

#[test]
fn keeps_same_library_collisions_warning() {
    let symbols_by_id = BTreeMap::from([
        ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
        ("_b".to_string(), entry("_b", "Shared", USER_LIBRARY_NAME)),
    ]);
    let symbols = BTreeMap::new();
    let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

    assert!(should_warn_duplicate_symbol_name(
        &symbol_ids,
        &symbols_by_id,
        &symbols,
        &BTreeMap::new(),
    ));
}

#[test]
fn suppresses_structurally_identical_user_external_duplicates() {
    let symbols_by_id = BTreeMap::from([
        ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
        (
            "_b".to_string(),
            entry("_b", "Shared", "@reference-ui/styled"),
        ),
    ]);
    let shared_definition = Some(TypeRef::Intersection {
        types: vec![
            TypeRef::Intrinsic {
                name: "string".to_string(),
            },
            TypeRef::Object { members: vec![] },
        ],
    });
    let symbols = BTreeMap::from([
        (
            "user-symbol".to_string(),
            symbol(
                "user-symbol",
                "Shared",
                USER_LIBRARY_NAME,
                shared_definition.clone(),
            ),
        ),
        (
            "styled-symbol".to_string(),
            symbol(
                "styled-symbol",
                "Shared",
                "@reference-ui/styled",
                shared_definition,
            ),
        ),
    ]);
    let export_name_map =
        symbol_ids_by_export_name(&[("_a", "user-symbol"), ("_b", "styled-symbol")]);
    let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

    assert!(!should_warn_duplicate_symbol_name(
        &symbol_ids,
        &symbols_by_id,
        &symbols,
        &export_name_map,
    ));
}
