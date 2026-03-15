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
}

#[derive(Debug, Clone)]
pub(super) struct ResolvedModule {
    pub(super) file_id: String,
    pub(super) module_specifier: String,
    pub(super) library: String,
}
