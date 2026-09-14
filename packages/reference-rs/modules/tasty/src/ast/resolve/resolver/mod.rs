//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::collections::BTreeMap;

use crate::ast::model::ParsedFileAst;

mod evaluate;
mod instantiate;
mod resolve;
mod symbol;

pub(super) struct Resolver<'a> {
    symbol_index: &'a BTreeMap<(String, String), String>,
    export_index: &'a BTreeMap<(String, String), String>,
    parsed: &'a ParsedFileAst,
}

impl<'a> Resolver<'a> {
    pub(super) fn new(
        symbol_index: &'a BTreeMap<(String, String), String>,
        export_index: &'a BTreeMap<(String, String), String>,
        parsed: &'a ParsedFileAst,
    ) -> Self {
        Self {
            symbol_index,
            export_index,
            parsed,
        }
    }
}
