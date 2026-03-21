use std::collections::BTreeMap;
use std::path::Path;

use super::crawler::Crawler;
use crate::tasty::scanner::model::DiscoveredFile;

pub(super) fn discover_reachable_files(
    root_dir: &Path,
    user_file_ids: Vec<String>,
) -> Result<BTreeMap<String, DiscoveredFile>, String> {
    Crawler::new(root_dir, user_file_ids).run()
}
