//! `tsconfig` alias probing for the provenance walk.
//!
//! A bare specifier is either an installed package or a project alias
//! (`@/ui` through `compilerOptions.paths`). The shared module-graph ladder
//! answers which, with the same `tsconfig` rung atomic's value resolver
//! follows (SITE-54), over a filesystem view that serves the compile sources
//! from memory and reads `tsconfig.json` from disk. Package directories never
//! resolve through this view: a bare specifier no `paths` entry maps is a
//! package by spelling, so `node_modules` is never probed. Outcomes memoize
//! per importing directory and specifier, so a lane pays one probe per pair.

use std::cell::RefCell;

use module_graph::{
    DiskFs, ExtensionPolicy, FileSystem, ModuleKey, ProbeMemo, SpecifierLadder, TsconfigPolicy,
};
use rustc_hash::FxHashMap;

use super::paths::{dir_of, normalize_path};

/// Where a `tsconfig` alias lands, if anywhere.
#[derive(Debug, Clone)]
pub(super) enum AliasHit {
    /// A compile source: the walk continues in it (its source path).
    Source(String),
    /// A file under `node_modules`: an installed package after all.
    Installed,
    /// A project file outside the compile sources: local, but opaque.
    Project,
    /// No `paths` entry maps the specifier.
    Miss,
}

/// Per-graph alias memo plus the disk probes behind it.
#[derive(Debug, Default)]
pub(super) struct AliasMemo {
    hits: RefCell<FxHashMap<(String, Box<str>), AliasHit>>,
    probes: ProbeMemo,
}

/// The compile sources over disk, with package directories switched off.
struct ProjectFs<'g> {
    sources: &'g [(String, String)],
    index: &'g FxHashMap<String, usize>,
    probes: &'g ProbeMemo,
}

impl ProjectFs<'_> {
    /// The source position a probed path names, when it is a compile source.
    fn position(&self, path: &str) -> Option<usize> {
        self.index.get(&normalize_path(path)).copied()
    }
}

impl FileSystem for ProjectFs<'_> {
    fn read_to_string(&self, path: &str) -> Option<String> {
        if let Some(position) = self.position(path) {
            return Some(self.sources[position].1.clone());
        }
        self.probes
            .read_to_string(path, |probed| DiskFs.read_to_string(probed))
    }

    fn is_file(&self, path: &str) -> bool {
        self.position(path).is_some() || self.probes.is_file(path, |probed| DiskFs.is_file(probed))
    }

    fn is_dir(&self, _path: &str) -> bool {
        // The ladder asks only for package dirs: none resolve here.
        false
    }

    fn read_dir(&self, _path: &str) -> Vec<String> {
        Vec::new()
    }

    fn canonicalize(&self, path: &str) -> Option<String> {
        if self.position(path).is_some() {
            return Some(path.to_string());
        }
        self.probes
            .canonicalize(path, |probed| DiskFs.canonicalize(probed))
    }
}

impl super::IdentityGraph<'_> {
    /// Where `specifier`, imported from `from_file`, lands through `tsconfig`
    /// `paths`. Memoized per importing directory and specifier.
    pub(super) fn alias_hit(&self, from_file: &str, specifier: &str) -> AliasHit {
        let key = (
            dir_of(&normalize_path(from_file)).to_string(),
            Box::<str>::from(specifier),
        );
        if let Some(hit) = self.aliases.hits.borrow().get(&key) {
            return hit.clone();
        }
        let hit = self.probe_alias(from_file, specifier);
        self.aliases.hits.borrow_mut().insert(key, hit.clone());
        hit
    }

    /// One uncached alias probe through the shared ladder.
    fn probe_alias(&self, from_file: &str, specifier: &str) -> AliasHit {
        let fs = ProjectFs {
            sources: self.sources,
            index: &self.index,
            probes: &self.aliases.probes,
        };
        let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source)
            .with_tsconfig(TsconfigPolicy::Follow);
        let Ok(key) = ladder.resolve(&ModuleKey::new(from_file), specifier) else {
            return AliasHit::Miss;
        };
        let path = key.as_str();
        if let Some(position) = fs.position(path) {
            return AliasHit::Source(self.sources[position].0.clone());
        }
        if path.split('/').any(|segment| segment == "node_modules") {
            return AliasHit::Installed;
        }
        AliasHit::Project
    }
}
