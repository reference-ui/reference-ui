use std::collections::BTreeMap;

mod export_names;
mod manifest;

use super::super::util::to_js_literal;

#[cfg(test)]
mod tests;

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

pub(super) fn chunk_path_for_export_name(export_name: &str) -> String {
    format!("./chunks/{export_name}.js")
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

pub(super) use export_names::build_symbol_export_names;
pub(super) use manifest::emit_manifest_module;
