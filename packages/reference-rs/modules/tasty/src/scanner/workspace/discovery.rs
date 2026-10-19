//! Thin entry point for reachable-file discovery.
//! Runs the workspace crawler from the user file ids to a Discovery set.

use super::crawler::Crawler;
use crate::scanner::model::Discovery;
use crate::scanner::packages::ImportResolver;

pub(super) fn discover_reachable_files(
    resolver: &ImportResolver,
    user_file_ids: Vec<String>,
) -> Result<Discovery, String> {
    Crawler::new(resolver, user_file_ids).run()
}
