use std::collections::BTreeMap;

use super::export_names::build_symbol_export_names_with;
use crate::tasty::model::{TsSymbol, TsSymbolKind, TypeScriptBundle};

#[test]
fn build_symbol_export_names_rejects_hash_collisions() {
    let mut symbols = BTreeMap::new();
    symbols.insert(
        "symbol-a".to_string(),
        TsSymbol {
            id: "symbol-a".to_string(),
            name: "Shared".to_string(),
            library: "user".to_string(),
            kind: TsSymbolKind::Interface,
            file_id: "a.ts".to_string(),
            exported: true,
            description: None,
            description_raw: None,
            jsdoc: None,
            type_parameters: Vec::new(),
            defined_members: Vec::new(),
            extends: Vec::new(),
            underlying: None,
            references: Vec::new(),
        },
    );
    symbols.insert(
        "symbol-b".to_string(),
        TsSymbol {
            id: "symbol-b".to_string(),
            name: "Shared".to_string(),
            library: "user".to_string(),
            kind: TsSymbolKind::TypeAlias,
            file_id: "b.ts".to_string(),
            exported: true,
            description: None,
            description_raw: None,
            jsdoc: None,
            type_parameters: Vec::new(),
            defined_members: Vec::new(),
            extends: Vec::new(),
            underlying: None,
            references: Vec::new(),
        },
    );

    let bundle = TypeScriptBundle {
        version: 1,
        root_dir: ".".to_string(),
        entry_globs: Vec::new(),
        files: BTreeMap::new(),
        symbols,
        exports: BTreeMap::new(),
        diagnostics: Vec::new(),
    };

    let error = build_symbol_export_names_with(&bundle, |_symbol_id| 7)
        .expect_err("hash collision should be rejected");

    assert!(error.contains("Tasty emitted-id collision"));
}
