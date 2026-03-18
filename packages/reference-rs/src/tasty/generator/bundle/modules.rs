use std::collections::BTreeMap;

use super::super::super::emitted::{TastyManifest, TastySymbolIndexEntry, TastySymbolKind};
use super::super::super::model::{TsSymbolKind, TypeScriptBundle};
use super::super::util::to_js_literal;

pub(super) const MANIFEST_MODULE_PATH: &str = "./manifest.js";
pub(super) const RUNTIME_MODULE_PATH: &str = "./runtime.js";
pub(super) const CHUNK_REGISTRY_MODULE_PATH: &str = "./chunk-registry.js";
pub(super) const MANIFEST_DECLARATION_PATH: &str = "./manifest.d.ts";
pub(super) const RUNTIME_DECLARATION_PATH: &str = "./runtime.d.ts";

pub(super) fn emit_runtime_module() -> &'static str {
    "import manifest from \"./manifest.js\";\nimport { tastyChunkLoaders } from \"./chunk-registry.js\";\n\nexport { manifest };\n\nexport const manifestUrl = new URL(\"./manifest.js\", import.meta.url).href;\n\nconst loadersBySpecifier = new Map();\nfor (const [specifier, loader] of Object.entries(tastyChunkLoaders)) {\n  loadersBySpecifier.set(specifier, loader);\n  try {\n    loadersBySpecifier.set(new URL(specifier, manifestUrl).href, loader);\n  } catch {\n    // Bundlers may inline the manifest into a data: URL, which cannot act as a base URL.\n  }\n}\n\nexport async function importTastyArtifact(specifier) {\n  const loader = loadersBySpecifier.get(specifier);\n  if (!loader) {\n    throw new Error(`Unknown Tasty artifact: ${specifier}`);\n  }\n  return loader();\n}\n"
}

pub(super) fn emit_manifest_declaration_module() -> &'static str {
    "import type { RawTastyManifest } from \"@reference-ui/rust/tasty\";\n\ndeclare const manifest: RawTastyManifest;\n\nexport { manifest };\nexport default manifest;\n"
}

pub(super) fn emit_runtime_declaration_module() -> &'static str {
    "import type { RawTastyManifest } from \"@reference-ui/rust/tasty\";\n\nexport declare const manifest: RawTastyManifest;\nexport declare const manifestUrl: string;\n\nexport declare function importTastyArtifact(specifier: string): Promise<unknown>;\n"
}

pub(super) fn emit_chunk_registry_module(export_names: &BTreeMap<String, String>) -> String {
    let entries = export_names
        .values()
        .map(|export_name| chunk_path_for_export_name(export_name))
        .map(|chunk_path| {
            format!(
                "  {}: () => import({}),",
                to_js_literal(&chunk_path).expect("chunk path should serialize"),
                to_js_literal(&chunk_path).expect("chunk path should serialize")
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!("export const tastyChunkLoaders = {{\n{entries}\n}};\n")
}

pub(super) fn emit_manifest_module(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut symbols_by_name = BTreeMap::new();
    let mut symbols_by_id = BTreeMap::new();
    let mut warnings = bundle
        .diagnostics
        .iter()
        .map(|diagnostic| format!("{}: {}", diagnostic.file_id, diagnostic.message))
        .collect::<Vec<_>>();

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

    for (symbol_name, symbol_ids) in &symbols_by_name {
        if symbol_ids.len() <= 1 {
            continue;
        }
        let matches = symbol_ids
            .iter()
            .filter_map(|symbol_id| {
                symbols_by_id
                    .get(symbol_id)
                    .map(|entry| format!("{} ({})", entry.id, entry.library))
            })
            .collect::<Vec<_>>()
            .join(", ");
        warnings.push(format!(
            "Duplicate symbol name \"{symbol_name}\" matched {} entries: {matches}. Use symbol id or scoped lookup to disambiguate.",
            symbol_ids.len()
        ));
    }

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

/// Deterministic hash for symbol IDs so the same id always gets the same export name.
fn stable_hash_symbol_id(symbol_id: &str) -> u64 {
    const FNV_OFFSET: u64 = 14695981039346656037;
    const FNV_PRIME: u64 = 1099511628211;
    symbol_id
        .bytes()
        .fold(FNV_OFFSET, |h, b| h.wrapping_mul(FNV_PRIME) ^ u64::from(b))
}

fn emitted_symbol_kind(kind: TsSymbolKind) -> TastySymbolKind {
    match kind {
        TsSymbolKind::Interface => TastySymbolKind::Interface,
        TsSymbolKind::TypeAlias => TastySymbolKind::TypeAlias,
    }
}

pub(super) fn chunk_path_for_export_name(export_name: &str) -> String {
    format!("./chunks/{export_name}.js")
}

pub(super) fn build_symbol_export_names(
    bundle: &TypeScriptBundle,
) -> Result<BTreeMap<String, String>, String> {
    build_symbol_export_names_with(bundle, stable_hash_symbol_id)
}

fn build_symbol_export_names_with<F>(
    bundle: &TypeScriptBundle,
    hash_symbol_id: F,
) -> Result<BTreeMap<String, String>, String>
where
    F: Fn(&str) -> u64,
{
    let mut export_names = BTreeMap::new();
    let mut symbol_ids_by_export_name = BTreeMap::new();

    for symbol_id in bundle.symbols.keys() {
        let export_name = format!("_{:016x}", hash_symbol_id(symbol_id));
        if let Some(existing_symbol_id) =
            symbol_ids_by_export_name.insert(export_name.clone(), symbol_id.clone())
        {
            return Err(format!(
                "Tasty emitted-id collision between \"{existing_symbol_id}\" and \"{symbol_id}\" for export name \"{export_name}\"."
            ));
        }
        export_names.insert(symbol_id.clone(), export_name);
    }

    Ok(export_names)
}

#[cfg(test)]
mod tests;
