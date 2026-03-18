use std::collections::BTreeMap;

use super::super::model::ParsedFileAst;

mod symbol;
mod type_ref;

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
