use std::collections::BTreeMap;

use crate::tasty::ast::model::ParsedFileAst;

mod symbol;
mod resolve;
mod instantiate;
mod evaluate;

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
