use std::collections::BTreeMap;

use super::super::super::model::{ExportMap, ScannerDiagnostic, TsFile, TsSymbol};

#[derive(Debug, Clone)]
pub(crate) struct ResolvedTypeScriptGraph {
    pub(crate) files: BTreeMap<String, TsFile>,
    pub(crate) symbols: BTreeMap<String, TsSymbol>,
    pub(crate) exports: BTreeMap<String, ExportMap>,
    pub(crate) diagnostics: Vec<ScannerDiagnostic>,
}
