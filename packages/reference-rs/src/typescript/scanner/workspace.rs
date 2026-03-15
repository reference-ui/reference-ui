use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs;
use std::path::Path;

use globwalk::GlobWalkerBuilder;

use super::imports::extract_module_specifiers;
use super::model::{DiscoveredFile, ResolvedModule, ScannedFile, ScannedWorkspace};
use super::packages::{resolve_external_import, resolve_relative_import};
use super::paths::{
    is_external_file_id, module_specifier_for_file_id, package_name_from_file_id, path_to_unix,
};

pub(crate) fn scan_workspace(
    root_dir: &Path,
    include: &[String],
) -> Result<ScannedWorkspace, String> {
    let user_file_ids = discover_file_ids(root_dir, include)?;
    let discovered_files = discover_reachable_files(root_dir, user_file_ids)?;
    let file_id_set = discovered_files.keys().cloned().collect();
    let mut files = Vec::new();

    for (
        file_id,
        DiscoveredFile {
            module_specifier,
            library,
        },
    ) in discovered_files
    {
        let absolute_path = root_dir.join(&file_id);
        let source = fs::read_to_string(&absolute_path)
            .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))?;

        files.push(ScannedFile {
            file_id,
            module_specifier,
            library,
            source,
        });
    }

    Ok(ScannedWorkspace {
        root_dir: root_dir.to_path_buf(),
        files,
        file_ids: file_id_set,
    })
}

fn discover_reachable_files(
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

        for source_module in extract_module_specifiers(&file_id, &source) {
            let Some(resolved) = resolve_import_for_discovery(
                root_dir,
                &file_id,
                &source_module,
                &known_file_ids,
                &user_file_id_set,
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

fn resolve_import_for_discovery(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    known_file_ids: &BTreeSet<String>,
    user_file_ids: &BTreeSet<String>,
) -> Option<ResolvedModule> {
    if source_module.starts_with('.') {
        let file_id = if is_external_file_id(current_file_id) {
            resolve_relative_import(
                root_dir,
                current_file_id,
                source_module,
                known_file_ids,
                true,
            )?
        } else {
            resolve_relative_import(
                root_dir,
                current_file_id,
                source_module,
                user_file_ids,
                false,
            )?
        };

        return Some(ResolvedModule {
            module_specifier: module_specifier_for_file_id(&file_id),
            library: package_name_from_file_id(&file_id),
            file_id,
        });
    }

    resolve_external_import(root_dir, source_module)
}

fn discover_file_ids(root_dir: &Path, include: &[String]) -> Result<Vec<String>, String> {
    let walker = GlobWalkerBuilder::from_patterns(root_dir, include)
        .follow_links(true)
        .build()
        .map_err(|err| format!("failed to build glob walker: {err}"))?;

    let mut file_ids = BTreeSet::new();
    for entry in walker {
        let entry = entry.map_err(|err| format!("failed to walk scan root: {err}"))?;
        if !entry.file_type().is_file() {
            continue;
        }

        let Some(extension) = entry.path().extension().and_then(|ext| ext.to_str()) else {
            continue;
        };
        if !matches!(extension, "ts" | "tsx") {
            continue;
        }

        let relative = entry
            .path()
            .strip_prefix(root_dir)
            .map_err(|err| format!("failed to normalize path {}: {err}", entry.path().display()))?;
        file_ids.insert(path_to_unix(relative));
    }

    Ok(file_ids.into_iter().collect())
}
