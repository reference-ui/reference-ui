use std::collections::BTreeMap;

use super::super::api::TypeScriptBundle;

/// Future ESM output shape for the TypeScript scanner.
///
/// The current scanner still emits a debug bundle for test inspection, but the
/// long-term product output should be a tree-shakeable ESM module graph.
#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeScriptEsmBundle {
    pub entrypoint: String,
    pub modules: BTreeMap<String, String>,
    pub type_declarations: BTreeMap<String, String>,
}

/// Placeholder for the future ESM emitter.
#[allow(dead_code)]
pub fn emit_esm_bundle(_bundle: &TypeScriptBundle) -> Result<TypeScriptEsmBundle, String> {
    Err("ESM emission is not implemented yet.".to_string())
}
