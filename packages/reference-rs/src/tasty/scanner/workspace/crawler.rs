use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs;
use std::path::Path;

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;

use super::super::imports::{extract_module_specifiers, extract_reexport_module_specifiers};
use super::super::model::{DiscoveredFile, ResolvedModule};
use super::super::paths::module_specifier_for_file_id;
use super::policy::resolve_import_for_discovery;

pub(super) struct Crawler<'a> {
    root_dir: &'a Path,
    user_file_ids: BTreeSet<String>,
    discovered: BTreeMap<String, DiscoveredFile>,
    pending: VecDeque<String>,
}

impl<'a> Crawler<'a> {
    pub(super) fn new(root_dir: &'a Path, entry_points: Vec<String>) -> Self {
        let user_file_ids = entry_points.iter().cloned().collect();
        let mut discovered = BTreeMap::new();
        let mut pending = VecDeque::new();

        for file_id in entry_points {
            discovered.insert(file_id.clone(), Self::discovered_user_file(&file_id));
            pending.push_back(file_id);
        }

        Self {
            root_dir,
            user_file_ids,
            discovered,
            pending,
        }
    }

    pub(super) fn run(mut self) -> Result<BTreeMap<String, DiscoveredFile>, String> {
        while let Some(file_id) = self.pending.pop_front() {
            self.crawl_file(&file_id)?;
        }

        Ok(self.discovered)
    }

    fn crawl_file(&mut self, file_id: &str) -> Result<(), String> {
        let source = self.read_source(file_id)?;
        let known_file_ids = self.known_file_ids();
        let is_user_file = self.is_user_file(file_id);
        let current_library = self.library_of(file_id);
        let reexport_specifiers = self.reexports_of(is_user_file, file_id, &source);

        for resolved in self.resolve_imports(
            file_id,
            &source,
            &known_file_ids,
            is_user_file,
            &reexport_specifiers,
            &current_library,
        ) {
            self.enqueue(resolved);
        }

        Ok(())
    }

    fn read_source(&self, file_id: &str) -> Result<String, String> {
        let absolute_path = self.root_dir.join(file_id);
        fs::read_to_string(&absolute_path)
            .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))
    }

    fn known_file_ids(&self) -> BTreeSet<String> {
        self.discovered.keys().cloned().collect()
    }

    fn is_user_file(&self, file_id: &str) -> bool {
        self.user_file_ids.contains(file_id)
    }

    fn resolve_imports(
        &self,
        file_id: &str,
        source: &str,
        known_file_ids: &BTreeSet<String>,
        is_user_file: bool,
        reexport_specifiers: &BTreeSet<String>,
        current_library: &str,
    ) -> Vec<ResolvedModule> {
        extract_module_specifiers(file_id, source)
            .into_iter()
            .filter_map(|source_module| {
                resolve_import_for_discovery(
                    self.root_dir,
                    file_id,
                    &source_module,
                    known_file_ids,
                    &self.user_file_ids,
                    is_user_file,
                    reexport_specifiers,
                    current_library,
                )
            })
            .collect()
    }

    fn library_of(&self, file_id: &str) -> String {
        self.discovered
            .get(file_id)
            .map(|file| file.library.clone())
            .unwrap_or_else(|| USER_LIBRARY_NAME.to_string())
    }

    fn reexports_of(
        &self,
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

    fn enqueue(&mut self, resolved: ResolvedModule) {
        if self.discovered.contains_key(&resolved.file_id) {
            return;
        }

        self.discovered.insert(
            resolved.file_id.clone(),
            DiscoveredFile {
                module_specifier: resolved.module_specifier,
                library: resolved.library,
            },
        );
        self.pending.push_back(resolved.file_id);
    }

    fn discovered_user_file(file_id: &str) -> DiscoveredFile {
        DiscoveredFile {
            module_specifier: module_specifier_for_file_id(file_id),
            library: USER_LIBRARY_NAME.to_string(),
        }
    }
}
