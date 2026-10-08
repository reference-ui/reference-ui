//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod exports;
mod imports;

pub(super) use exports::{
    collect_default_export_declaration, collect_exported_declaration, record_named_reexports,
};
pub(super) use imports::collect_import_bindings;
