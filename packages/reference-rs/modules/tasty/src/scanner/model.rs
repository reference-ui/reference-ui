//! Scan-phase data structures. These feed `extract` and are distinct from
//! [`crate::ast::model::ParsedFileAst`]: a `ScannedFile` is source + ids only;
//! `ParsedFileAst` adds import/value/export bindings and symbol shells after parsing.

use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;

use super::packages::ImportResolver;

#[derive(Debug, Clone)]
pub(crate) struct ScannedFile {
    pub(crate) file_id: String,
    pub(crate) module_specifier: String,
    pub(crate) library: String,
    pub(crate) source: String,
}

#[derive(Debug, Clone)]
pub(crate) struct ScannedWorkspace {
    pub(crate) files: Vec<ScannedFile>,
    pub(crate) file_ids: BTreeSet<String>,
    /// External libraries a user file re-exported from. Only these (plus
    /// user files) enter the manifest name index; other followed libraries
    /// emit chunks without name entries (followed-without-indexing).
    pub(crate) bridged_libraries: BTreeSet<String>,
    /// The discovery resolver, retained so extraction reuses the same memo
    /// instead of re-walking `node_modules` for every import.
    pub(crate) resolver: Rc<ImportResolver>,
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

/// Crawler output: the reachable file set plus the external libraries a
/// user file re-exported from (the name-index bridge set).
#[derive(Debug, Clone)]
pub(super) struct Discovery {
    pub(super) files: BTreeMap<String, DiscoveredFile>,
    pub(super) bridged_libraries: BTreeSet<String>,
}
