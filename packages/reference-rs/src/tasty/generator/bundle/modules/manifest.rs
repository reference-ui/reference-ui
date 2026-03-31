use std::collections::BTreeMap;

use super::chunk_path_for_export_name;
use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
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
        .filter(|(_, symbol_ids)| should_warn_duplicate_symbol_name(symbol_ids, symbols_by_id))
        .map(|(symbol_name, symbol_ids)| {
            let matches = duplicate_symbol_matches(symbol_ids, symbols_by_id);
            format!(
                "Duplicate symbol name \"{symbol_name}\" matched {} entries: {matches}. Use symbol id or scoped lookup to disambiguate.",
                symbol_ids.len()
            )
        })
        .collect()
}

fn should_warn_duplicate_symbol_name(
    symbol_ids: &[String],
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
) -> bool {
    if symbol_ids.len() <= 1 {
        return false;
    }

    let libraries = symbol_ids
        .iter()
        .filter_map(|symbol_id| symbols_by_id.get(symbol_id).map(|entry| entry.library.as_str()))
        .collect::<Vec<_>>();
    if libraries.len() <= 1 {
        return true;
    }

    let has_user_symbol = libraries.iter().any(|library| *library == USER_LIBRARY_NAME);
    if has_user_symbol {
        return true;
    }

    let distinct_libraries = libraries
        .iter()
        .copied()
        .collect::<std::collections::BTreeSet<_>>();
    distinct_libraries.len() <= 1
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

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::should_warn_duplicate_symbol_name;
    use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
    use crate::tasty::emitted::{TastySymbolIndexEntry, TastySymbolKind};

    fn entry(id: &str, name: &str, library: &str) -> TastySymbolIndexEntry {
        TastySymbolIndexEntry {
            id: id.to_string(),
            name: name.to_string(),
            kind: TastySymbolKind::TypeAlias,
            chunk: format!("./chunks/{id}.js"),
            library: library.to_string(),
        }
    }

    #[test]
    fn suppresses_cross_library_external_duplicates() {
        let symbols_by_id = BTreeMap::from([
            ("_a".to_string(), entry("_a", "Shared", "@reference-ui/react")),
            ("_b".to_string(), entry("_b", "Shared", "@reference-ui/system")),
            ("_c".to_string(), entry("_c", "Shared", "@reference-ui/types")),
        ]);
        let symbol_ids = vec!["_a".to_string(), "_b".to_string(), "_c".to_string()];

        assert!(!should_warn_duplicate_symbol_name(&symbol_ids, &symbols_by_id));
    }

    #[test]
    fn keeps_user_collisions_warning() {
        let symbols_by_id = BTreeMap::from([
            ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
            ("_b".to_string(), entry("_b", "Shared", "@reference-ui/system")),
        ]);
        let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

        assert!(should_warn_duplicate_symbol_name(&symbol_ids, &symbols_by_id));
    }

    #[test]
    fn keeps_same_library_collisions_warning() {
        let symbols_by_id = BTreeMap::from([
            ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
            ("_b".to_string(), entry("_b", "Shared", USER_LIBRARY_NAME)),
        ]);
        let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

        assert!(should_warn_duplicate_symbol_name(&symbol_ids, &symbols_by_id));
    }
}
