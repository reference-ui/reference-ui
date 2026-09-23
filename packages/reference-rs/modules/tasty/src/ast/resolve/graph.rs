//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::collections::{BTreeMap, BTreeSet};

use crate::model::{ExportMap, ScannerDiagnostic, TsFile, TsSymbol};

#[derive(Debug, Clone)]
pub(crate) struct ResolvedTypeScriptGraph {
    pub(crate) files: BTreeMap<String, TsFile>,
    pub(crate) symbols: BTreeMap<String, TsSymbol>,
    pub(crate) exports: BTreeMap<String, ExportMap>,
    pub(crate) diagnostics: Vec<ScannerDiagnostic>,
    /// External libraries bridged by user re-exports (carried from scan to
    /// the manifest name-index filter; untouched by extract/resolve).
    pub(crate) bridged_libraries: BTreeSet<String>,
}
