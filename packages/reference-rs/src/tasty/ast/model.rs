use std::collections::BTreeMap;

use crate::tasty::model::{
    JsDoc, ScannerDiagnostic, TsMember, TsSymbolKind, TsTypeParameter, TypeRef,
};

#[derive(Debug, Clone)]
pub(crate) struct ParsedFileAst {
    pub(crate) file_id: String,
    pub(crate) module_specifier: String,
    pub(crate) library: String,
    /// Source text from scan; not read after extract today (the extract pass uses [`crate::tasty::scanner::ScannedFile::source`] directly).
    #[allow(dead_code)]
    pub(crate) source: String,
    pub(crate) import_bindings: BTreeMap<String, ImportBinding>,
    pub(crate) value_bindings: BTreeMap<String, TypeRef>,
    pub(crate) export_bindings: BTreeMap<String, String>,
    /// For `export { X } from './m'`, maps the specifier local name → (target file id, symbol name in target).
    pub(crate) reexport_target: BTreeMap<String, (String, String)>,
    /// For `export * from './m'`, stores the fully resolved target file id.
    pub(crate) export_all_targets: Vec<String>,
    pub(crate) exports: Vec<SymbolShell>,
}

#[derive(Debug, Clone)]
pub(crate) enum ImportBindingKind {
    Named,
    Default,
    Namespace,
}

#[derive(Debug, Clone)]
pub(crate) struct ImportBinding {
    pub(crate) kind: ImportBindingKind,
    pub(crate) imported_name: String,
    pub(crate) source_module: String,
    pub(crate) target_file_id: Option<String>,
}

#[derive(Debug, Clone)]
pub(crate) struct SymbolShell {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) kind: TsSymbolKind,
    pub(crate) exported: bool,
    pub(crate) description: Option<String>,
    pub(crate) description_raw: Option<String>,
    pub(crate) jsdoc: Option<JsDoc>,
    pub(crate) type_parameters: Vec<TsTypeParameter>,
    pub(crate) defined_members: Vec<TsMember>,
    pub(crate) extends: Vec<TypeRef>,
    pub(crate) underlying: Option<TypeRef>,
    pub(crate) references: Vec<TypeRef>,
}

#[derive(Debug, Clone)]
pub(crate) struct ParsedTypeScriptAst {
    pub(crate) files: Vec<ParsedFileAst>,
    pub(crate) diagnostics: Vec<ScannerDiagnostic>,
}
