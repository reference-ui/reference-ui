//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct ScanRequest {
    pub root_dir: PathBuf,
    pub include: Vec<String>,
}
