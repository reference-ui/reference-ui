use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs;
use std::path::Path;

use super::policy::resolve_import_for_discovery;
use super::super::imports::{extract_module_specifiers, extract_reexport_module_specifiers};
use super::super::model::DiscoveredFile;
use super::super::paths::module_specifier_for_file_id;

pub(super) fn discover_reachable_files(
    root_dir: &Path,
    user_file_ids: Vec<String>,
) -> Result<BTreeMap<String, DiscoveredFile>, String> {
    let user_file_id_set = user_file_ids.iter().cloned().collect::<BTreeSet<_>>();
    let mut discovered = BTreeMap::new();
    let mut pending = VecDeque::new();

    for file_id in user_file_ids {
        discovered.insert(
            file_id.clone(),
            DiscoveredFile {
                module_specifier: module_specifier_for_file_id(&file_id),
                library: "user".to_string(),
            },
        );
        pending.push_back(file_id);
    }

    while let Some(file_id) = pending.pop_front() {
        let absolute_path = root_dir.join(&file_id);
        let source = fs::read_to_string(&absolute_path)
            .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))?;
        let known_file_ids = discovered.keys().cloned().collect::<BTreeSet<_>>();
        let is_user_file = user_file_id_set.contains(&file_id);
        let current_library = discovered
            .get(&file_id)
            .map(|d| d.library.clone())
            .unwrap_or_else(|| "user".to_string());
        let reexport_specifiers: BTreeSet<String> = if is_user_file {
            extract_reexport_module_specifiers(&file_id, &source)
                .into_iter()
                .collect()
        } else {
            BTreeSet::new()
        };

        for source_module in extract_module_specifiers(&file_id, &source) {
            let Some(resolved) = resolve_import_for_discovery(
                root_dir,
                &file_id,
                &source_module,
                &known_file_ids,
                &user_file_id_set,
                is_user_file,
                &reexport_specifiers,
                &current_library,
            ) else {
                continue;
            };

            if discovered.contains_key(&resolved.file_id) {
                continue;
            }

            discovered.insert(
                resolved.file_id.clone(),
                DiscoveredFile {
                    module_specifier: resolved.module_specifier,
                    library: resolved.library,
                },
            );
            pending.push_back(resolved.file_id);
        }
    }

    Ok(discovered)
}
