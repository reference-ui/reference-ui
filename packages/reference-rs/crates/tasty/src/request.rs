use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct ScanRequest {
    pub root_dir: PathBuf,
    pub include: Vec<String>,
}
