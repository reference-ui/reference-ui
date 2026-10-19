//! Top-level statement dispatch.
//! Routes each program statement to import collection, export collection, or user-library symbol shells, and names the module-level statements tasty skips.

mod exports;
mod imports;
mod module_requests;
mod unsupported;

pub(super) use exports::exports_from_statement;
pub(super) use imports::import_bindings_from_statement;
pub(super) use module_requests::unresolved_import_diagnostics;
pub(super) use unsupported::unsupported_syntax_diagnostics;
