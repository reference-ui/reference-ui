use std::collections::BTreeMap;

use super::chunk_path_for_export_name;
use crate::tasty::emitted::{TastyManifest, TastySymbolIndexEntry, TastySymbolKind};
use crate::tasty::generator::util::to_js_literal;
use crate::tasty::model::{TsSymbolKind, TypeScriptBundle};

pub(crate) fn emit_manifest_module(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let (symbols_by_name, symbols_by_id) = build_manifest_symbol_indices(bundle, export_names);
    let mut warnings = bundle
        .diagnostics
        .iter()
        .map(|diagnostic| format!("{}: {}", diagnostic.file_id, diagnostic.message))
        .collect::<Vec<_>>();
    warnings.extend(duplicate_symbol_name_warnings(
        &symbols_by_name,
        &symbols_by_id,
    ));

    let manifest = TastyManifest {
        version: "2".to_string(),
        warnings,
        symbols_by_name,
        symbols_by_id,
    };
    let literal = to_js_literal(&manifest)?;

    Ok(format!(
        "export const manifest = {literal};\nexport default manifest;\n"
    ))
}

fn build_manifest_symbol_indices(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> (
    BTreeMap<String, Vec<String>>,
    BTreeMap<String, TastySymbolIndexEntry>,
) {
    let mut symbols_by_name = BTreeMap::new();
    let mut symbols_by_id = BTreeMap::new();

    for (symbol_id, symbol) in &bundle.symbols {
        let export_name = export_names
            .get(symbol_id)
            .expect("symbol export name should exist")
            .clone();
        symbols_by_name
            .entry(symbol.name.clone())
            .or_insert_with(Vec::new)
            .push(export_name.clone());
        symbols_by_id.insert(
            export_name.clone(),
            TastySymbolIndexEntry {
                id: export_name.clone(),
                name: symbol.name.clone(),
                kind: emitted_symbol_kind(symbol.kind.clone()),
                chunk: chunk_path_for_export_name(&export_name),
                library: symbol.library.clone(),
            },
        );
    }

    (symbols_by_name, symbols_by_id)
}

fn duplicate_symbol_name_warnings(
    symbols_by_name: &BTreeMap<String, Vec<String>>,
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
) -> Vec<String> {
    symbols_by_name
        .iter()
        .filter(|(_, symbol_ids)| symbol_ids.len() > 1)
        .map(|(symbol_name, symbol_ids)| {
            let matches = duplicate_symbol_matches(symbol_ids, symbols_by_id);
            format!(
                "Duplicate symbol name \"{symbol_name}\" matched {} entries: {matches}. Use symbol id or scoped lookup to disambiguate.",
                symbol_ids.len()
            )
        })
        .collect()
}

fn duplicate_symbol_matches(
    symbol_ids: &[String],
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
) -> String {
    symbol_ids
        .iter()
        .filter_map(|symbol_id| {
            symbols_by_id
                .get(symbol_id)
                .map(|entry| format!("{} ({})", entry.id, entry.library))
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn emitted_symbol_kind(kind: TsSymbolKind) -> TastySymbolKind {
    match kind {
        TsSymbolKind::Interface => TastySymbolKind::Interface,
        TsSymbolKind::TypeAlias => TastySymbolKind::TypeAlias,
    }
}
