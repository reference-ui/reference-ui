mod exports;
mod imports;

pub(super) use exports::{collect_default_export_declaration, collect_exported_declaration};
pub(super) use imports::collect_import_bindings;
