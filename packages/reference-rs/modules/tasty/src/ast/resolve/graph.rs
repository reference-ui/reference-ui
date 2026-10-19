//! Resolved graph output type.
//! Holds the connected file, symbol, and export maps that later stages consume after reference resolution.

use std::collections::{BTreeMap, BTreeSet};

use crate::diagnostics::TastyDiagnostic;
use crate::model::{ExportMap, TsFile, TsSymbol};

#[derive(Debug, Clone)]
pub(crate) struct ResolvedTypeScriptGraph {
    pub(crate) files: BTreeMap<String, TsFile>,
    pub(crate) symbols: BTreeMap<String, TsSymbol>,
    pub(crate) exports: BTreeMap<String, ExportMap>,
    pub(crate) diagnostics: Vec<TastyDiagnostic>,
    /// External libraries bridged by user re-exports (carried from scan to
    /// the manifest name-index filter; untouched by extract/resolve).
    pub(crate) bridged_libraries: BTreeSet<String>,
}
