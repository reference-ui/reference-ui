//! Scan-phase data structures. These feed `extract` and are distinct from
//! [`crate::tasty::ast::model::ParsedFileAst`]: a `ScannedFile` is source + ids only;
//! `ParsedFileAst` adds import/value/export bindings and symbol shells after parsing.

use std::collections::BTreeSet;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub(crate) struct ScannedFile {
    pub(crate) file_id: String,
    pub(crate) module_specifier: String,
    pub(crate) library: String,
    pub(crate) source: String,
}

#[derive(Debug, Clone)]
pub(crate) struct ScannedWorkspace {
    pub(crate) root_dir: PathBuf,
    pub(crate) files: Vec<ScannedFile>,
    pub(crate) file_ids: BTreeSet<String>,
}

#[derive(Debug, Clone)]
pub(super) struct DiscoveredFile {
    pub(super) module_specifier: String,
    pub(super) library: String,
    pub(super) external_depth: usize,
}

#[derive(Debug, Clone)]
pub(super) struct ResolvedModule {
    pub(super) file_id: String,
    pub(super) module_specifier: String,
    pub(super) library: String,
    pub(super) external_depth: usize,
}
