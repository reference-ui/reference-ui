//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::collections::BTreeMap;

use crate::ast::model::ParsedFileAst;
use crate::model::TypeRef;

mod evaluate;
mod instantiate;
mod resolve;
mod symbol;

pub(super) struct Resolver<'a> {
    symbol_index: &'a BTreeMap<(String, String), String>,
    export_index: &'a BTreeMap<(String, String), String>,
    parsed: &'a ParsedFileAst,
    cross_file_values: &'a CrossFileValues<'a>,
}

impl<'a> Resolver<'a> {
    pub(super) fn new(
        symbol_index: &'a BTreeMap<(String, String), String>,
        export_index: &'a BTreeMap<(String, String), String>,
        parsed: &'a ParsedFileAst,
        cross_file_values: &'a CrossFileValues<'a>,
    ) -> Self {
        Self {
            symbol_index,
            export_index,
            parsed,
            cross_file_values,
        }
    }
}

/// Per-file value/export tables behind the `typeof` import arm, built once
/// in `resolve_ast` and shared by every `Resolver` (never per-symbol).
pub(super) struct CrossFileValues<'a> {
    files: BTreeMap<String, CrossFileValueFile<'a>>,
}

struct CrossFileValueFile<'a> {
    value_bindings: &'a BTreeMap<String, TypeRef>,
    export_bindings: &'a BTreeMap<String, String>,
}

impl<'a> CrossFileValues<'a> {
    pub(super) fn new(parsed_files: &'a [ParsedFileAst]) -> Self {
        Self {
            files: parsed_files
                .iter()
                .map(|parsed| {
                    (
                        parsed.file_id.clone(),
                        CrossFileValueFile {
                            value_bindings: &parsed.value_bindings,
                            export_bindings: &parsed.export_bindings,
                        },
                    )
                })
                .collect(),
        }
    }

    /// Look up a named import's value in its target file: the export name
    /// maps through the target's export bindings (so `export { t as
    /// tokens }` lands on `t`), else reads as a direct-export local name
    /// (`export const tokens` binds no export entry, only a value). Names
    /// with no local value binding — aliases, re-export chains — miss.
    pub(super) fn imported_value(
        &self,
        target_file_id: &str,
        imported_name: &str,
    ) -> Option<TypeRef> {
        let target = self.files.get(target_file_id)?;
        let local_name = target
            .export_bindings
            .get(imported_name)
            .map(String::as_str)
            .unwrap_or(imported_name);
        target.value_bindings.get(local_name).cloned()
    }
}
