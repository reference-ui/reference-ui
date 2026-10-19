//! Module binding wiring.
//! Declares the import and export binding collection passes behind one surface.

mod exports;
mod imports;

pub(super) use exports::{
    collect_default_export_declaration, collect_exported_declaration, record_named_reexports,
    ExportOutputs, ExportScope,
};
pub(super) use imports::collect_import_bindings;
