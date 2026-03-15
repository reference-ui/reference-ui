use std::collections::BTreeMap;
use std::path::PathBuf;

use serde::Serialize;

#[derive(Debug, Clone)]
pub struct ScanRequest {
    pub root_dir: PathBuf,
    pub include: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TypeScriptBundle {
    pub version: u8,
    pub root_dir: String,
    pub entry_globs: Vec<String>,
    pub files: BTreeMap<String, TsFile>,
    pub symbols: BTreeMap<String, TsSymbol>,
    pub exports: BTreeMap<String, ExportMap>,
    pub diagnostics: Vec<ScannerDiagnostic>,
}

pub type ExportMap = BTreeMap<String, String>;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TsFile {
    pub path: String,
    pub module_specifier: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TsSymbol {
    pub id: String,
    pub name: String,
    pub kind: TsSymbolKind,
    pub file_id: String,
    pub exported: bool,
    pub defined_members: Vec<TsMember>,
    pub extends: Vec<TypeRef>,
    pub underlying: Option<TypeRef>,
    pub references: Vec<TypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum TsSymbolKind {
    Interface,
    TypeAlias,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TsMember {
    pub name: String,
    pub optional: bool,
    pub type_ref: Option<TypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum TypeRef {
    Intrinsic {
        name: String,
    },
    Literal {
        value: String,
    },
    Reference {
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
    },
    Union {
        types: Vec<TypeRef>,
    },
    Unknown {
        summary: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerDiagnostic {
    pub file_id: String,
    pub message: String,
}
