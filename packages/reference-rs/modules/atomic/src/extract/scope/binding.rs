//! One named value binding inside a scope of the scope table.
//! A binding records what a name is (const, param, import, …) and the static
//! value it carries, if any. Bindings without an init — params, functions,
//! dynamic declarators — exist to shadow outer names, never to resolve.
//! `Import` bindings carry their specifier so the Ph4 resolver (SPEC-V2-76)
//! can follow them; until then the import lookup stub answers by local name.

use std::collections::BTreeMap;

use oxc_span::Span;

use crate::atom::AtomValue;

/// Index of a binding in the scope table.
pub type BindingId = u32;

/// What a name is bound to in its scope.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BindingKind {
    /// `const x = …` — resolves when the init is static.
    Const,
    /// `let x = …` — resolves like `const` until SPEC-V2-35 tracks mutation.
    Let,
    /// `var x = …` — block-scoped like `let` for this pass; hoisting is ignored.
    Var,
    /// A function or catch parameter — always shadows, never resolves.
    Param,
    /// An imported name — resolved through the import lookup, never locally.
    Import(ImportRef),
    /// A function or class declaration — always shadows, never resolves.
    Function,
    /// A TS enum name — always shadows until SPEC-V2-45 folds members.
    Enum,
}

/// An import binding: the local name plus where it was imported from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportRef {
    /// The name the importing file uses (`primary` in `brand as primary`).
    pub local: Box<str>,
    /// The exported name in the target file (`brand`, `default`, or `*`).
    pub imported: Box<str>,
    /// The module specifier as authored (`./tokens`).
    pub specifier: Box<str>,
}

/// The static value a binding carries: scalar leaves or a style object.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BindingInit {
    /// Literal leaves (`'2r'`, both arms of a const ternary).
    Scalars(Vec<AtomValue>),
    /// A const style object (`{ primary: 'n300' }`).
    Object(BTreeMap<String, AtomValue>),
}

/// A single declared name: its kind, its static value if any, its span.
#[derive(Debug, Clone)]
pub struct Binding {
    pub kind: BindingKind,
    pub init: Option<BindingInit>,
    pub span: Span,
}
