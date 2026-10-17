//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::collections::{BTreeMap, BTreeSet};

use oxc_ast::ast::Comment;

use crate::ast::model::{ImportBinding, SymbolShell};
use crate::scanner::{ImportResolver, ScannedFile};

/// Shared per-file inputs for extract (types, members, symbols, value inference).
pub(crate) struct ExtractionContext<'a> {
    pub(crate) source: &'a str,
    pub(crate) comments: &'a [Comment],
    pub(crate) import_bindings: &'a BTreeMap<String, ImportBinding>,
    pub(crate) module_specifier: &'a str,
    pub(crate) library: &'a str,
}

impl<'a> ExtractionContext<'a> {
    /// Type literals have no comment attachment in this path; reuse bindings and module ids.
    pub(crate) fn with_empty_comments(&self) -> ExtractionContext<'a> {
        ExtractionContext {
            source: self.source,
            comments: &[],
            import_bindings: self.import_bindings,
            module_specifier: self.module_specifier,
            library: self.library,
        }
    }
}

/// Workspace facts one statement walk reads for its file: the import resolver, the workspace file ids, and the
/// scanned file with its comments. Statement collectors take this one handle instead of loose parameters.
pub(crate) struct StatementScope<'a> {
    pub(crate) resolver: &'a ImportResolver,
    pub(crate) file_id_set: &'a BTreeSet<String>,
    pub(crate) scanned_file: &'a ScannedFile,
    pub(crate) comments: &'a [Comment],
}

/// Where one emitted symbol shell goes: its owning file id, the context its members read, and the list it appends to.
pub(crate) struct ShellSink<'s, 'a> {
    pub(crate) file_id: &'s str,
    pub(crate) ctx: &'s ExtractionContext<'a>,
    pub(crate) exports: &'s mut Vec<SymbolShell>,
}
