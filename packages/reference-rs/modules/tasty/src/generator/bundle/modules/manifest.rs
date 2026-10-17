//! Emits the manifest module: the symbol index by name and by id, plus the warnings the index raises for
//! duplicate names. The index is built from the bundle's symbols and export names. Duplicate detection lives in
//! `duplicates`, and the structural comparison it relies on lives in `equivalence` and `type_ref_equivalence`.

mod duplicates;
mod equivalence;
mod type_ref_equivalence;

#[cfg(test)]
mod tests;

use std::collections::BTreeMap;

use super::chunk_path_for_export_name;
use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::emitted::{TastyManifest, TastySymbolIndexEntry, TastySymbolKind};
use crate::generator::util::to_js_pretty_literal;
use crate::model::{TsSymbolKind, TypeScriptBundle};

use duplicates::duplicate_symbol_name_warnings;

pub(crate) fn emit_manifest_module(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let (symbols_by_name, symbols_by_id) = build_manifest_symbol_indices(bundle, export_names);
    let mut warnings = bundle.diagnostics.clone();
    warnings.extend(
        duplicate_symbol_name_warnings(bundle, export_names, &symbols_by_name, &symbols_by_id)
            .map_err(|error| error.to_string())?,
    );

    let manifest = TastyManifest {
        version: "2".to_string(),
        warnings,
        symbols_by_name,
        symbols_by_id,
    };
    let literal = to_js_pretty_literal(&manifest)?;

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
        // Followed-without-indexing: plain-imported external targets stay
        // resolvable by id (symbols_by_id + chunks) without polluting the
        // name index; only user and bridged-library symbols are named.
        if symbol.library == USER_LIBRARY_NAME
            || bundle.bridged_libraries.contains(&symbol.library)
        {
            symbols_by_name
                .entry(symbol.name.clone())
                .or_insert_with(Vec::new)
                .push(export_name.clone());
        }
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

fn emitted_symbol_kind(kind: TsSymbolKind) -> TastySymbolKind {
    match kind {
        TsSymbolKind::Interface => TastySymbolKind::Interface,
        TsSymbolKind::TypeAlias => TastySymbolKind::TypeAlias,
    }
}
