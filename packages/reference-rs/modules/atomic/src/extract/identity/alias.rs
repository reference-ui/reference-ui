//! Bare-specifier probing for the provenance walk.
//!
//! A bare specifier is a project alias (`@/ui` through `compilerOptions.paths`)
//! or a package, and a package is either code this compile can see into or a
//! directory it cannot. The shared module-graph ladder answers where it lands,
//! following the `tsconfig` rung atomic's value resolver follows (SITE-54) and
//! then each ancestor `node_modules`, over a view that serves the compile
//! sources from memory and everything else from disk, canonicalized through
//! symlinks. A hit in the compile sources continues the walk unless its package
//! directory published a system of its own; any other package directory ends it
//! with that directory's verdict, which also asks whether the compile sources
//! reach into it. Hits memoize per importing directory and specifier, verdicts
//! per directory, so a lane pays one probe per pair.

use std::cell::{OnceCell, RefCell};

use module_graph::{
    DiskFs, ExtensionPolicy, FileSystem, ModuleKey, ProbeMemo, SpecifierLadder, TsconfigPolicy,
};
use rustc_hash::FxHashMap;

use super::paths::{dir_of, normalize_path};
use crate::extract::own_runtime::{OwnCompile, OwnRoot};
use crate::extract::package_system::{dir_verdict, installed_dir, package_name, DirVerdict};
use crate::extract::provenance::names_package;

/// Where a bare specifier lands, if anywhere.
#[derive(Debug, Clone)]
pub(super) enum BareHit {
    /// A compile source: the walk continues in it (its source path).
    Source(String),
    /// A package directory ends the walk: where it is, and what renders it.
    Package {
        dir: Box<str>,
        verdict: DirVerdict,
    },
    /// A project file outside the compile sources: local, but opaque.
    Project,
    /// Nothing resolves the specifier.
    Miss,
}

/// Per-graph bare-specifier memo, the disk probes behind it, and the own
/// root that tells this compile's generated runtime from another package.
#[derive(Debug, Default)]
pub(super) struct AliasMemo {
    hits: RefCell<FxHashMap<(String, Box<str>), BareHit>>,
    verdicts: RefCell<FxHashMap<Box<str>, DirVerdict>>,
    probes: ProbeMemo,
    root: Option<Box<str>>,
    own: OnceCell<Option<OwnRoot>>,
}

/// The compile sources over disk: sources answer from memory and keep their
/// lexical key, every other path probes and canonicalizes on disk.
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

    fn is_dir(&self, path: &str) -> bool {
        self.probes.is_dir(path, |probed| DiskFs.is_dir(probed))
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
    /// Name this compile's root (the declaration root, else the source
    /// root), so the runtime it generates under `.reference-ui` is told
    /// apart from another package's. Without one, no directory is own.
    pub(crate) fn with_root(mut self, root: Option<&str>) -> Self {
        self.aliases.root = root.map(Box::from);
        self
    }

    /// Where `specifier`, imported from `from_file`, lands through `tsconfig`
    /// `paths` or `node_modules`. Memoized per importing directory and specifier.
    pub(super) fn bare_hit(&self, from_file: &str, specifier: &str) -> BareHit {
        let key = (
            dir_of(&normalize_path(from_file)).to_string(),
            Box::<str>::from(specifier),
        );
        if let Some(hit) = self.aliases.hits.borrow().get(&key) {
            return hit.clone();
        }
        let hit = self.probe_bare(from_file, specifier);
        self.aliases.hits.borrow_mut().insert(key, hit.clone());
        hit
    }

    /// One uncached probe through the shared ladder. A source hit continues
    /// the walk unless its package published a system (that package renders
    /// it, two syncs over one tree); a package dir ends it with its verdict.
    fn probe_bare(&self, from_file: &str, specifier: &str) -> BareHit {
        let fs = self.project_fs();
        let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source)
            .with_tsconfig(TsconfigPolicy::Follow);
        let Ok(hit) = ladder.resolve_located(&ModuleKey::new(from_file), specifier) else {
            return self.unbuilt_package(&fs, from_file, specifier);
        };
        let path = hit.key.as_str();
        let source = fs.position(path).map(|at| self.sources[at].0.clone());
        let dir = hit
            .package_dir
            .or_else(|| installed_dir(path).map(str::to_string));
        let Some(dir) = dir else {
            return source.map_or(BareHit::Project, BareHit::Source);
        };
        let verdict = self.dir_verdict(&fs, &dir);
        match source {
            Some(source) if !verdict.publishes() => BareHit::Source(source),
            _ => BareHit::Package {
                dir: dir.into(),
                verdict,
            },
        }
    }

    /// A bare specifier whose package is installed but whose entry resolves to
    /// no file (a workspace package whose `dist` is not built yet) still names
    /// that directory, so its published system is not lost to a missing build.
    /// Nothing installed under the name is a miss.
    fn unbuilt_package(&self, fs: &ProjectFs<'_>, from_file: &str, specifier: &str) -> BareHit {
        if !names_package(specifier) {
            return BareHit::Miss;
        }
        let name = package_name(specifier);
        let from = ModuleKey::new(from_file);
        let mut dir = dir_of(from.as_str());
        let found = loop {
            let candidate = format!("{dir}/node_modules/{name}");
            if fs.is_dir(&candidate) {
                break fs.canonicalize(&candidate);
            }
            match dir.rsplit_once('/') {
                Some((parent, _)) => dir = parent,
                None => break None,
            }
        };
        let Some(dir) = found else {
            return BareHit::Miss;
        };
        let verdict = self.dir_verdict(fs, &dir);
        BareHit::Package {
            dir: dir.into(),
            verdict,
        }
    }

    /// The verdict on one package directory, read once per graph.
    fn dir_verdict(&self, fs: &ProjectFs<'_>, dir: &str) -> DirVerdict {
        if let Some(verdict) = self.aliases.verdicts.borrow().get(dir) {
            return verdict.clone();
        }
        let includes = |dir: &str| self.includes(dir);
        let own = self.own_root().map(|root| OwnCompile {
            root,
            includes: &includes,
        });
        let verdict = dir_verdict(fs, dir, own.as_ref());
        self.aliases
            .verdicts
            .borrow_mut()
            .insert(dir.into(), verdict.clone());
        verdict
    }

    /// This compile's own root on disk, canonicalized once.
    fn own_root(&self) -> Option<&OwnRoot> {
        let memo = &self.aliases;
        memo.own
            .get_or_init(|| {
                let root = memo.root.as_deref()?;
                OwnRoot::at(&self.project_fs(), root)
            })
            .as_ref()
    }

    /// True when a compile source lies inside the canonical `dir`: this
    /// compile's include set reaches into it.
    fn includes(&self, dir: &str) -> bool {
        let lexical = match self.own_root() {
            Some(own) => own.lexical_of(dir),
            None => dir.into(),
        };
        let prefix = format!("{}/", normalize_path(&lexical));
        self.index.keys().any(|path| path.starts_with(&prefix))
    }

    /// The compile sources over disk, sharing this graph's probe memo.
    fn project_fs(&self) -> ProjectFs<'_> {
        ProjectFs {
            sources: self.sources,
            index: &self.index,
            probes: &self.aliases.probes,
        }
    }
}
