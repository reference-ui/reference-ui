use std::collections::BTreeMap;

use serde::Serialize;

mod modules;

use self::modules::{
    build_symbol_export_names, chunk_path_for_export_name, emit_chunk_registry_module,
    emit_manifest_declaration_module, emit_manifest_module, emit_runtime_declaration_module,
    emit_runtime_module, CHUNK_REGISTRY_MODULE_PATH, MANIFEST_DECLARATION_PATH,
    MANIFEST_MODULE_PATH, RUNTIME_DECLARATION_PATH, RUNTIME_MODULE_PATH,
};
use super::super::model::TypeScriptBundle;
use super::symbols::emit_chunk_module;

#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub(crate) struct TypeScriptArtifactBundle {
    pub modules: BTreeMap<String, String>,
    pub type_declarations: BTreeMap<String, String>,
}

#[allow(dead_code)]
pub(crate) fn emit_artifact_bundle(
    bundle: &TypeScriptBundle,
) -> Result<TypeScriptArtifactBundle, String> {
    let export_names = build_symbol_export_names(bundle)?;

    let mut modules = BTreeMap::new();
    modules.insert(
        MANIFEST_MODULE_PATH.to_string(),
        emit_manifest_module(bundle, &export_names)?,
    );
    modules.insert(
        RUNTIME_MODULE_PATH.to_string(),
        emit_runtime_module().to_string(),
    );
    modules.insert(
        CHUNK_REGISTRY_MODULE_PATH.to_string(),
        emit_chunk_registry_module(&export_names),
    );

    for (symbol_id, symbol) in &bundle.symbols {
        let export_name = export_names
            .get(symbol_id)
            .expect("symbol export name should exist");
        modules.insert(
            chunk_path_for_export_name(export_name),
            emit_chunk_module(bundle, symbol, export_name, &export_names)?,
        );
    }

    let mut type_declarations = BTreeMap::new();
    type_declarations.insert(
        MANIFEST_DECLARATION_PATH.to_string(),
        emit_manifest_declaration_module().to_string(),
    );
    type_declarations.insert(
        RUNTIME_DECLARATION_PATH.to_string(),
        emit_runtime_declaration_module().to_string(),
    );

    Ok(TypeScriptArtifactBundle {
        modules,
        type_declarations,
    })
}
