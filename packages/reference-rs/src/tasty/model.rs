use std::collections::BTreeMap;

use serde::Serialize;

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
pub struct JsDocTag {
    pub name: String,
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JsDoc {
    pub summary: Option<String>,
    pub tags: Vec<JsDocTag>,
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
    pub description_raw: Option<String>,
    pub jsdoc: Option<JsDoc>,
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

/// Kind of interface/type-literal member: property, method, call signature, index signature, or construct signature.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TsMemberKind {
    #[default]
    Property,
    Method,
    CallSignature,
    IndexSignature,
    ConstructSignature,
}

/// A single parameter in a function type: name (if simple identifier), optional flag, and type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FnParam {
    pub name: Option<String>,
    pub optional: bool,
    pub type_ref: Option<TypeRef>,
}

/// A single element in a tuple type: optional label (named tuple), optional/rest flags, and the element type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TupleElement {
    pub label: Option<String>,
    pub optional: bool,
    pub rest: bool,
    pub element: TypeRef,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TsMember {
    pub name: String,
    pub optional: bool,
    pub readonly: bool,
    pub kind: TsMemberKind,
    pub description: Option<String>,
    pub description_raw: Option<String>,
    pub jsdoc: Option<JsDoc>,
    pub type_ref: Option<TypeRef>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TemplateLiteralPart {
    Text { value: String },
    Type { value: TypeRef },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MappedModifierKind {
    Preserve,
    Add,
    Remove,
}

impl MappedModifierKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Preserve => "preserve",
            Self::Add => "add",
            Self::Remove => "remove",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TypeOperatorKind {
    Keyof,
    Readonly,
    Unique,
}

impl TypeOperatorKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Keyof => "keyof",
            Self::Readonly => "readonly",
            Self::Unique => "unique",
        }
    }
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
        elements: Vec<TupleElement>,
    },
    Intersection {
        types: Vec<TypeRef>,
    },
    Object {
        members: Vec<TsMember>,
    },
    /// Indexed access type `T[K]`: object type and index type (key).
    IndexedAccess {
        object: Box<TypeRef>,
        index: Box<TypeRef>,
    },
    /// Function type `(params) => returnType`: for callback properties etc.; params include name and type.
    Function {
        params: Vec<FnParam>,
        return_type: Box<TypeRef>,
    },
    /// Constructor type `new (...args) => T`; params include name and type.
    Constructor {
        r#abstract: bool,
        type_parameters: Vec<TsTypeParameter>,
        params: Vec<FnParam>,
        return_type: Box<TypeRef>,
    },
    /// Type operator like `keyof T`, `readonly T[]`, or `unique symbol`.
    TypeOperator {
        operator: TypeOperatorKind,
        target: Box<TypeRef>,
    },
    /// Type query like `typeof themeConfig`; expression is preserved structurally.
    TypeQuery {
        expression: String,
    },
    /// Conditional type `T extends U ? A : B`; preserved structurally without evaluation.
    Conditional {
        check_type: Box<TypeRef>,
        extends_type: Box<TypeRef>,
        true_type: Box<TypeRef>,
        false_type: Box<TypeRef>,
    },
    /// Mapped type like `{ [K in keyof T]?: T[K] }`; preserved structurally without evaluation.
    Mapped {
        type_param: String,
        source_type: Box<TypeRef>,
        name_type: Option<Box<TypeRef>>,
        optional_modifier: MappedModifierKind,
        readonly_modifier: MappedModifierKind,
        value_type: Option<Box<TypeRef>>,
    },
    /// Template literal type like `` `size-${"sm" | "lg"}` `` with alternating text/type parts.
    TemplateLiteral {
        parts: Vec<TemplateLiteralPart>,
    },
    /// Raw source-preserved type expression.
    ///
    /// `Raw` means we parsed the AST variant successfully, but intentionally keep
    /// the original type expression as source text instead of lowering it into a
    /// more structured `TypeRef`.
    ///
    /// This is not an error state and not parser uncertainty; it is an explicit
    /// IR choice for variants we do not currently model structurally.
    Raw {
        summary: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ScannerDiagnostic {
    pub file_id: String,
    pub message: String,
}
