use std::collections::BTreeMap;

use oxc_ast::ast::Comment;

use crate::tasty::ast::model::ImportBinding;

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
