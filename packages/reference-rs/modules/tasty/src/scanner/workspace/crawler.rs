//! Breadth-first import graph crawler that builds the reachable file set.
//! Reads and screens each file once, parses it once for its specifiers, and keeps the text with the file it discovers.
//! Holds pending work and discovered files while enforcing the scan boundary.

use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs;

use shared::parse::ScreenedSource;

use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::diagnostics::scan_failed;

use super::policy::{resolve_import_for_discovery, DiscoveryContext};
use crate::scanner::imports::{module_specifiers_of, source_type_of};
use crate::scanner::model::{DiscoveredFile, Discovery, ResolvedModule};
use crate::scanner::packages::ImportResolver;
use crate::scanner::paths::module_specifier_for_file_id;

pub(super) struct Crawler<'a> {
    resolver: &'a ImportResolver,
    user_file_ids: BTreeSet<String>,
    /// Every file id enqueued so far, crawled or not. Borrowed by the import policy for each file.
    known_file_ids: BTreeSet<String>,
    pending: VecDeque<ResolvedModule>,
    /// Files already crawled, each with the text read and screened for it.
    crawled: BTreeMap<String, DiscoveredFile>,
    bridged_libraries: BTreeSet<String>,
}

impl<'a> Crawler<'a> {
    pub(super) fn new(resolver: &'a ImportResolver, entry_points: Vec<String>) -> Self {
        let user_file_ids: BTreeSet<String> = entry_points.iter().cloned().collect();
        let known_file_ids = user_file_ids.clone();
        let mut seen = BTreeSet::new();
        let pending = entry_points
            .iter()
            .filter(|file_id| seen.insert(file_id.as_str()))
            .map(|file_id| Self::user_module(file_id))
            .collect();

        Self {
            resolver,
            user_file_ids,
            known_file_ids,
            pending,
            crawled: BTreeMap::new(),
            bridged_libraries: BTreeSet::new(),
        }
    }

    pub(super) fn run(mut self) -> Result<Discovery, String> {
        while let Some(module) = self.pending.pop_front() {
            self.crawl_file(module)?;
        }

        Ok(Discovery {
            files: self.crawled,
            bridged_libraries: self.bridged_libraries,
        })
    }

    fn crawl_file(&mut self, module: ResolvedModule) -> Result<(), String> {
        let source = self.read_source(&module.file_id)?;
        let specifiers = module_specifiers_of(&source);
        let is_user_file = self.user_file_ids.contains(&module.file_id);

        let ctx = DiscoveryContext {
            resolver: self.resolver,
            file_id: &module.file_id,
            is_user_file,
            current_library: &module.library,
            external_depth: module.external_depth,
            known_file_ids: &self.known_file_ids,
            user_file_ids: &self.user_file_ids,
            reexport_specifiers: &specifiers.reexports,
        };
        let followed = Self::resolve_imports(&ctx, &specifiers.all);

        for (resolved, bridged) in followed {
            if bridged && resolved.library != USER_LIBRARY_NAME {
                self.bridged_libraries.insert(resolved.library.clone());
            }
            self.enqueue(resolved);
        }

        self.crawled.insert(
            module.file_id,
            DiscoveredFile {
                module_specifier: module.module_specifier,
                library: module.library,
                source,
            },
        );
        Ok(())
    }

    /// Reads the file and runs the nesting gate on it once; the verdict travels with the text.
    fn read_source(&self, file_id: &str) -> Result<ScreenedSource, String> {
        let absolute_path = self.resolver.root_dir().join(file_id);
        let text = fs::read_to_string(&absolute_path).map_err(|err| {
            scan_failed(format!(
                "failed to read {}: {err}",
                absolute_path.display()
            ))
        })?;
        Ok(ScreenedSource::screen(text, source_type_of(file_id)))
    }

    fn resolve_imports(
        ctx: &DiscoveryContext<'_>,
        specifiers: &[String],
    ) -> Vec<(ResolvedModule, bool)> {
        specifiers
            .iter()
            .filter_map(|source_module| {
                let resolved = resolve_import_for_discovery(ctx, source_module)?;
                let bridged = ctx.is_user_file && ctx.reexport_specifiers.contains(source_module);
                Some((resolved, bridged))
            })
            .collect()
    }

    fn enqueue(&mut self, resolved: ResolvedModule) {
        if !self.known_file_ids.insert(resolved.file_id.clone()) {
            return;
        }

        self.pending.push_back(resolved);
    }

    fn user_module(file_id: &str) -> ResolvedModule {
        ResolvedModule {
            file_id: file_id.to_string(),
            module_specifier: module_specifier_for_file_id(file_id),
            library: USER_LIBRARY_NAME.to_string(),
            external_depth: 0,
        }
    }
}
