//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::path::Path;

use super::crawler::Crawler;
use crate::scanner::model::Discovery;

pub(super) fn discover_reachable_files(
    root_dir: &Path,
    user_file_ids: Vec<String>,
) -> Result<Discovery, String> {
    Crawler::new(root_dir, user_file_ids).run()
}
