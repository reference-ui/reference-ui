use std::collections::BTreeMap;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct ScanRequest {
    pub root_dir: PathBuf,
    pub include: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TsFile {
    pub path: String,
    pub module_specifier: String,
    pub library: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TsTypeParameter {
    pub name: String,
    pub constraint: Option<TypeRef>,
    pub default: Option<TypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TsSymbol {
    pub id: String,
    pub name: String,
    pub library: String,
    pub kind: TsSymbolKind,
    pub file_id: String,
    pub exported: bool,
    pub description: Option<String>,
    pub type_parameters: Vec<TsTypeParameter>,
    pub defined_members: Vec<TsMember>,
    pub extends: Vec<TypeRef>,
    pub underlying: Option<TypeRef>,
    pub references: Vec<TypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TsSymbolKind {
    Interface,
    TypeAlias,
}

/// Kind of interface/type-literal member: property, method, call signature, or index signature.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TsMemberKind {
    #[default]
    Property,
    Method,
    CallSignature,
    IndexSignature,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TsMember {
    pub name: String,
    pub optional: bool,
    pub readonly: bool,
    pub kind: TsMemberKind,
    pub description: Option<String>,
    pub type_ref: Option<TypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
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
        type_arguments: Option<Vec<TypeRef>>,
    },
    Union {
        types: Vec<TypeRef>,
    },
    Array {
        element: Box<TypeRef>,
    },
    Tuple {
        elements: Vec<TypeRef>,
    },
    Intersection {
        types: Vec<TypeRef>,
    },
    Object {
        members: Vec<TsMember>,
    },
    Unknown {
        summary: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScannerDiagnostic {
    pub file_id: String,
    pub message: String,
}
