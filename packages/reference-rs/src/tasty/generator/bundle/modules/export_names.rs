use std::collections::BTreeMap;

use super::super::super::super::model::TypeScriptBundle;

/// Deterministic hash for symbol IDs so the same id always gets the same export name.
fn stable_hash_symbol_id(symbol_id: &str) -> u64 {
    const FNV_OFFSET: u64 = 14695981039346656037;
    const FNV_PRIME: u64 = 1099511628211;
    symbol_id
        .bytes()
        .fold(FNV_OFFSET, |h, b| h.wrapping_mul(FNV_PRIME) ^ u64::from(b))
}

fn export_name_for_symbol_id(symbol_id: &str, hash_symbol_id: impl Fn(&str) -> u64) -> String {
    format!("_{:016x}", hash_symbol_id(symbol_id))
}

pub(crate) fn build_symbol_export_names(
    bundle: &TypeScriptBundle,
) -> Result<BTreeMap<String, String>, String> {
    build_symbol_export_names_with(bundle, stable_hash_symbol_id)
}

pub(crate) fn build_symbol_export_names_with<F>(
    bundle: &TypeScriptBundle,
    hash_symbol_id: F,
) -> Result<BTreeMap<String, String>, String>
where
    F: Fn(&str) -> u64,
{
    let mut export_names = BTreeMap::new();
    let mut symbol_ids_by_export_name = BTreeMap::new();

    for symbol_id in bundle.symbols.keys() {
        let export_name = export_name_for_symbol_id(symbol_id, &hash_symbol_id);
        ensure_unique_export_name(
            &mut symbol_ids_by_export_name,
            export_name.clone(),
            symbol_id,
        )?;
        export_names.insert(symbol_id.to_string(), export_name);
    }

    Ok(export_names)
}

fn ensure_unique_export_name(
    symbol_ids_by_export_name: &mut BTreeMap<String, String>,
    export_name: String,
    symbol_id: &str,
) -> Result<(), String> {
    if let Some(existing_symbol_id) =
        symbol_ids_by_export_name.insert(export_name.clone(), symbol_id.to_string())
    {
        return Err(format!(
            "Tasty emitted-id collision between \"{existing_symbol_id}\" and \"{symbol_id}\" for export name \"{export_name}\"."
        ));
    }

    Ok(())
}
