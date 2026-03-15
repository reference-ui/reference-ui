use std::collections::BTreeMap;

use super::super::api::{ScannerDiagnostic, TsMember, TsSymbolKind, TypeRef};

#[derive(Debug, Clone)]
pub(crate) struct ParsedFileAst {
    pub(crate) file_id: String,
    pub(crate) module_specifier: String,
    pub(crate) library: String,
    pub(crate) source: String,
    pub(crate) import_bindings: BTreeMap<String, ImportBinding>,
    pub(crate) exports: Vec<SymbolShell>,
}

#[derive(Debug, Clone)]
pub(crate) struct ImportBinding {
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
