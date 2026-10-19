//! Request shape for a tasty scan.
//! Carries the workspace root directory and the include globs that seed file discovery.
//! Built by the N-API boundary and consumed by the scan pipeline.

use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct ScanRequest {
    pub root_dir: PathBuf,
    pub include: Vec<String>,
}
