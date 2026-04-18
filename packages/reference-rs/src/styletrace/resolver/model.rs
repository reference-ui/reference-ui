//! Internal data structures used by the style-prop resolver.

use std::collections::{BTreeSet, HashMap};
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub(super) struct ParsedModule {
    pub(super) imports: HashMap<String, ImportBinding>,
    pub(super) declarations: HashMap<String, TypeDeclaration>,
    pub(super) reexports: HashMap<String, ImportBinding>,
}

#[derive(Debug, Clone)]
pub(super) struct ImportBinding {
    pub(super) imported_name: String,
    pub(super) source: String,
}

#[derive(Debug, Clone)]
pub(super) struct BoundTypeExpr {
    pub(super) module_path: PathBuf,
    pub(super) expr: TypeExpr,
}

#[derive(Debug, Clone)]
pub(super) enum TypeDeclaration {
    Interface(InterfaceDecl),
    TypeAlias(TypeAliasDecl),
}

#[derive(Debug, Clone)]
pub(super) struct InterfaceDecl {
    pub(super) name: String,
    pub(super) type_params: Vec<String>,
    pub(super) extends: Vec<TypeExpr>,
    pub(super) props: BTreeSet<String>,
}

#[derive(Debug, Clone)]
pub(super) struct TypeAliasDecl {
    pub(super) name: String,
    pub(super) type_params: Vec<String>,
    pub(super) expr: TypeExpr,
}

#[derive(Debug, Clone)]
pub(super) enum TypeExpr {
    Unknown,
    Object(BTreeSet<String>),
    Intersection(Vec<TypeExpr>),
    Reference {
        name: String,
        args: Vec<TypeExpr>,
    },
    UnionLiterals(BTreeSet<String>),
    IndexedAccess {
        object: Box<TypeExpr>,
        index: Box<TypeExpr>,
    },
    Mapped {
        key_source: Box<TypeExpr>,
        value_type: Box<TypeExpr>,
    },
    Keyof(Box<TypeExpr>),
    Conditional {
        true_type: Box<TypeExpr>,
        false_type: Box<TypeExpr>,
    },
}
