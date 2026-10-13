//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

mod exports;
mod imports;
mod module_requests;
mod unsupported;

pub(super) use exports::exports_from_statement;
pub(super) use imports::import_bindings_from_statement;
pub(super) use module_requests::unresolved_import_diagnostics;
pub(super) use unsupported::unsupported_syntax_diagnostics;
