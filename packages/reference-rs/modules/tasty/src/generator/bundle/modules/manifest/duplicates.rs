//! Duplicate symbol names in the manifest index. A name shared by symbols that are not one declaration raises a
//! warning, unless the copies come from a single library or are structurally identical external duplicates. The
//! function takes the index and the bundle's symbols, and it returns one diagnostic per conflicting name.

use std::collections::{BTreeMap, BTreeSet};

use super::equivalence::{members_equivalent, type_parameters_equivalent};
use super::type_ref_equivalence::{optional_type_ref_equivalent, type_refs_equivalent};
use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::diagnostics::{DiagnosticError, TastyDiagnostic};
use crate::emitted::TastySymbolIndexEntry;
use crate::model::{TsSymbol, TypeScriptBundle};

pub(super) fn duplicate_symbol_name_warnings(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
    symbols_by_name: &BTreeMap<String, Vec<String>>,
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
) -> Result<Vec<TastyDiagnostic>, DiagnosticError> {
    let symbol_ids_by_export_name = export_names
        .iter()
        .map(|(symbol_id, export_name)| (export_name.clone(), symbol_id.clone()))
        .collect::<BTreeMap<_, _>>();

    symbols_by_name
        .iter()
        .filter(|(_, symbol_ids)| {
            should_warn_duplicate_symbol_name(
                symbol_ids,
                symbols_by_id,
                &bundle.symbols,
                &symbol_ids_by_export_name,
            )
        })
        .map(|(symbol_name, symbol_ids)| {
            let matches = duplicate_symbol_matches(symbol_ids, symbols_by_id);
            crate::diagnostics::duplicate_symbol_name(symbol_name, symbol_ids.len(), &matches)
        })
        .collect()
}

pub(super) fn should_warn_duplicate_symbol_name(
    symbol_ids: &[String],
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
    symbols: &BTreeMap<String, TsSymbol>,
    symbol_ids_by_export_name: &BTreeMap<String, String>,
) -> bool {
    if symbol_ids.len() <= 1 {
        return false;
    }

    let libraries = symbol_ids
        .iter()
        .filter_map(|symbol_id| {
            symbols_by_id
                .get(symbol_id)
                .map(|entry| entry.library.as_str())
        })
        .collect::<Vec<_>>();
    if libraries.len() <= 1 {
        return true;
    }

    let has_user_symbol = libraries.contains(&USER_LIBRARY_NAME);
    let user_symbol_count = libraries
        .iter()
        .filter(|library| **library == USER_LIBRARY_NAME)
        .count();
    let distinct_libraries = libraries
        .iter()
        .copied()
        .collect::<BTreeSet<_>>();
    if distinct_libraries.len() <= 1 {
        return true;
    }

    if !has_user_symbol {
        return false;
    }

    if user_symbol_count == 1 {
        return false;
    }

    !all_duplicate_symbols_equivalent(symbol_ids, symbols, symbol_ids_by_export_name)
}

fn all_duplicate_symbols_equivalent(
    symbol_ids: &[String],
    symbols: &BTreeMap<String, TsSymbol>,
    symbol_ids_by_export_name: &BTreeMap<String, String>,
) -> bool {
    let mut resolved_symbols = symbol_ids.iter().map(|export_name| {
        symbol_ids_by_export_name
            .get(export_name)
            .and_then(|symbol_id| symbols.get(symbol_id))
    });
    let Some(first) = resolved_symbols.next().flatten() else {
        return false;
    };

    resolved_symbols.all(|current| {
        current
            .map(|symbol| symbols_equivalent(first, symbol))
            .unwrap_or(false)
    })
}

fn symbols_equivalent(left: &TsSymbol, right: &TsSymbol) -> bool {
    left.name == right.name
        && left.kind == right.kind
        && left.description == right.description
        && left.description_raw == right.description_raw
        && left.jsdoc == right.jsdoc
        && type_parameters_equivalent(&left.type_parameters, &right.type_parameters)
        && members_equivalent(&left.defined_members, &right.defined_members)
        && type_refs_equivalent(&left.extends, &right.extends)
        && optional_type_ref_equivalent(&left.underlying, &right.underlying)
        && type_refs_equivalent(&left.references, &right.references)
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
