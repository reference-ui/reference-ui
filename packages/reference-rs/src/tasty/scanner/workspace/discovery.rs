use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs;
use std::path::Path;

use super::super::imports::{extract_module_specifiers, extract_reexport_module_specifiers};
use super::super::model::{DiscoveredFile, ResolvedModule};
use super::super::paths::module_specifier_for_file_id;
use super::policy::resolve_import_for_discovery;

pub(super) fn discover_reachable_files(
    root_dir: &Path,
    user_file_ids: Vec<String>,
) -> Result<BTreeMap<String, DiscoveredFile>, String> {
    let user_file_id_set = user_file_ids.iter().cloned().collect::<BTreeSet<_>>();
    let (mut discovered, mut pending) = seed_discovered_files(user_file_ids);

    while let Some(file_id) = pending.pop_front() {
        let source = read_discovered_file_source(root_dir, &file_id)?;
        let known_file_ids = discovered.keys().cloned().collect::<BTreeSet<_>>();
        let is_user_file = user_file_id_set.contains(&file_id);
        let current_library = current_library_for_file(&discovered, &file_id);
        let reexport_specifiers = reexport_specifiers_for_file(is_user_file, &file_id, &source);

        for resolved in resolved_imports_for_file(
            root_dir,
            &file_id,
            &source,
            &known_file_ids,
            &user_file_id_set,
            is_user_file,
            &reexport_specifiers,
            &current_library,
        ) {
            enqueue_resolved_file(&mut discovered, &mut pending, resolved);
        }
    }

    Ok(discovered)
}

fn seed_discovered_files(
    user_file_ids: Vec<String>,
) -> (BTreeMap<String, DiscoveredFile>, VecDeque<String>) {
    let mut discovered = BTreeMap::new();
    let mut pending = VecDeque::new();

    for file_id in user_file_ids {
        discovered.insert(file_id.clone(), discovered_user_file(&file_id));
        pending.push_back(file_id);
    }

    (discovered, pending)
}

fn discovered_user_file(file_id: &str) -> DiscoveredFile {
    DiscoveredFile {
        module_specifier: module_specifier_for_file_id(file_id),
        library: "user".to_string(),
    }
}

fn read_discovered_file_source(root_dir: &Path, file_id: &str) -> Result<String, String> {
    let absolute_path = root_dir.join(file_id);
    fs::read_to_string(&absolute_path)
        .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))
}

fn resolved_imports_for_file(
    root_dir: &Path,
    file_id: &str,
    source: &str,
    known_file_ids: &BTreeSet<String>,
    user_file_ids: &BTreeSet<String>,
    is_user_file: bool,
    reexport_specifiers: &BTreeSet<String>,
    current_library: &str,
) -> Vec<ResolvedModule> {
    extract_module_specifiers(file_id, source)
        .into_iter()
        .filter_map(|source_module| {
            resolve_import_for_discovery(
                root_dir,
                file_id,
                &source_module,
                known_file_ids,
                user_file_ids,
                is_user_file,
                reexport_specifiers,
                current_library,
            )
        })
        .collect()
}

fn current_library_for_file(
    discovered: &BTreeMap<String, DiscoveredFile>,
    file_id: &str,
) -> String {
    discovered
        .get(file_id)
        .map(|file| file.library.clone())
        .unwrap_or_else(|| "user".to_string())
}

fn reexport_specifiers_for_file(
    is_user_file: bool,
    file_id: &str,
    source: &str,
) -> BTreeSet<String> {
    if !is_user_file {
        return BTreeSet::new();
    }

    extract_reexport_module_specifiers(file_id, source)
        .into_iter()
        .collect()
}

fn enqueue_resolved_file(
    discovered: &mut BTreeMap<String, DiscoveredFile>,
    pending: &mut VecDeque<String>,
    resolved: ResolvedModule,
) {
    if discovered.contains_key(&resolved.file_id) {
        return;
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
