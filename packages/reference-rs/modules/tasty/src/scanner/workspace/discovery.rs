//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use super::crawler::Crawler;
use crate::scanner::model::Discovery;
use crate::scanner::packages::ImportResolver;

pub(super) fn discover_reachable_files(
    resolver: &ImportResolver,
    user_file_ids: Vec<String>,
) -> Result<Discovery, String> {
    Crawler::new(resolver, user_file_ids).run()
}
