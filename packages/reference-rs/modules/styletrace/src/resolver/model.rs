//! Data models representing lowered TypeScript types and module graphs.
//!
//! This module defines the essential structures used to track type declarations during resolution.
//! It takes raw AST nodes from the parser and maps them to a simplified domain representation.
//! Emits an isolated type graph that the tracer uses for recursive evaluation and property extraction.

use std::collections::{BTreeSet, HashMap};
use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct ParsedModule {
    pub imports: HashMap<String, ImportBinding>,
    pub declarations: HashMap<String, TypeDeclaration>,
    pub reexports: HashMap<String, ImportBinding>,
    pub export_all_sources: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct ImportBinding {
    pub imported_name: String,
    pub source: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum TypeDeclaration {
    Interface(InterfaceDecl),
    TypeAlias(TypeAliasDecl),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct InterfaceDecl {
    pub name: String,
    pub type_params: Vec<String>,
    pub extends: Vec<TypeExpr>,
    pub props: BTreeSet<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct TypeAliasDecl {
    pub name: String,
    pub type_params: Vec<String>,
    pub expr: TypeExpr,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum TypeExpr {
    Unknown,
    Object(BTreeSet<String>),
    Intersection(Vec<TypeExpr>),
    UnionLiterals(BTreeSet<String>),
    Reference {
        name: String,
        args: Vec<TypeExpr>,
    },
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

#[derive(Debug, Clone)]
pub(super) struct BoundTypeExpr {
    pub module_path: PathBuf,
    pub expr: TypeExpr,
}
