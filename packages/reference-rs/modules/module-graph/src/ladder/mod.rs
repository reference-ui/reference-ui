//! The specifier ladder: one import specifier to one module key.
//!
//! [`SpecifierLadder::resolve`] walks every rung in order — relative join,
//! `tsconfig` `paths`/`baseUrl` when [`TsconfigPolicy::Follow`] is set,
//! ancestor `node_modules` with `exports` mapping, manifest entry fields,
//! and the `@types` fallback — probing each base with the policy's
//! extension, index, and runtime-remap spellings and returning the first
//! file the filesystem holds. [`ExtensionPolicy::Source`] prefers sources
//! (atomic's orders first); [`ExtensionPolicy::Declarations`] prefers
//! declarations (tasty's tables verbatim). [`RootEntryPolicy`] orders a package's
//! `exports` against its declarations, root and conditions alike, source-first by default.
//! [`SpecifierLadder::resolve_located`] also names the package directory a
//! `node_modules` hit came through. Absolute specifiers miss in every policy.

mod memo;
mod package;
mod probe;
mod tsconfig;

pub use memo::ProbeMemo;

use crate::key::{ancestors_iter, join_relative, join_under};
use crate::{FileSystem, ModuleKey};

/// Which extension tables the ladder probes: sources or declarations.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExtensionPolicy {
    /// Source-first probing for value compilers (atomic, styletrace).
    Source,
    /// Declaration-first probing for type scanners (tasty).
    Declarations,
}

/// Whether the ladder consults `tsconfig.json` for bare specifiers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TsconfigPolicy {
    /// Bare specifiers resolve via `node_modules` only. Worlds are
    /// self-contained through symlinked `node_modules`, so an ancestor
    /// authoring alias must never win (styletrace; SYNC-15).
    #[default]
    Skip,
    /// The nearest `tsconfig.json` maps bare specifiers before
    /// `node_modules` (atomic; the SITE-54 alias arm).
    Follow,
}

/// Which entry a package tries first: its source (`exports`, `module`, `main`)
/// or its declarations (`types`, `typings`). A `types` field often names a
/// body-less declaration beside the real source entry, and an `exports` map
/// often pairs `types` with `import`, so the default is source-first and a
/// consumer opts into declarations explicitly.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum RootEntryPolicy {
    /// `exports` first (conditions `source`, `import`, `default`, `require`,
    /// then `types`), then `module`/`main`, then `types`/`typings`.
    #[default]
    SourceFirst,
    /// `types`/`typings` first, then `exports` (conditions `types`, `import`,
    /// `default`, `require`), then `module`/`main`: tasty's manifest order,
    /// kept for consumers that resolve declarations.
    TypesFirst,
}

/// A specifier the ladder could not map to a file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Unresolved {
    /// The importing file's key.
    pub from: ModuleKey,
    /// The specifier as authored.
    pub specifier: String,
}

/// Join two segments with one separator, pre-sized to the exact length so
/// the join allocates once. Hot: resolution formats per probe attempt.
pub(crate) fn join_with(left: &str, sep: char, right: &str) -> String {
    let mut out = String::with_capacity(left.len() + sep.len_utf8() + right.len());
    out.push_str(left);
    out.push(sep);
    out.push_str(right);
    out
}

/// Concatenate two strings, pre-sized to the exact length: one allocation.
/// Hot: suffix needles and prefixes on the probe path.
pub(crate) fn concat2(left: &str, right: &str) -> String {
    let mut out = String::with_capacity(left.len() + right.len());
    out.push_str(left);
    out.push_str(right);
    out
}

/// One ladder over a filesystem: resolve specifiers to canonical keys.
pub struct SpecifierLadder<'f, F: FileSystem> {
    fs: &'f F,
    policy: ExtensionPolicy,
    tsconfig: TsconfigPolicy,
    root_entry: RootEntryPolicy,
}

impl<'f, F: FileSystem> SpecifierLadder<'f, F> {
    /// A ladder over `fs` probing with `policy`, skipping `tsconfig`, and
    /// trying package `exports` before declarations.
    pub fn new(fs: &'f F, policy: ExtensionPolicy) -> Self {
        Self {
            fs,
            policy,
            tsconfig: TsconfigPolicy::Skip,
            root_entry: RootEntryPolicy::SourceFirst,
        }
    }

    /// A ladder with this `tsconfig` policy: atomic follows, worlds skip.
    pub fn with_tsconfig(self, tsconfig: TsconfigPolicy) -> Self {
        Self { tsconfig, ..self }
    }

    /// A ladder that orders package entries with this policy, root fields and
    /// `exports` conditions alike. Atomic and styletrace keep the source-first
    /// default; types-first is opt-in.
    pub fn with_root_entry(self, root_entry: RootEntryPolicy) -> Self {
        Self { root_entry, ..self }
    }

    /// The policy this ladder probes with.
    pub fn policy(&self) -> ExtensionPolicy {
        self.policy
    }

    /// The `tsconfig` policy this ladder resolves bare specifiers with.
    pub fn tsconfig_policy(&self) -> TsconfigPolicy {
        self.tsconfig
    }

    /// The root-entry order this ladder reads package manifests with.
    pub fn root_entry_policy(&self) -> RootEntryPolicy {
        self.root_entry
    }

    /// Resolve `specifier` authored in `from` to a canonical module key.
    /// Relative specifiers join; bare ones try `tsconfig` bases then ancestor
    /// `node_modules`. Every hit canonicalizes so symlinks share one key.
    pub fn resolve(&self, from: &ModuleKey, specifier: &str) -> Result<ModuleKey, Unresolved> {
        self.hit(from, specifier)
            .map(|hit| ModuleKey::new(&hit.file))
    }

    /// Resolve like [`Self::resolve`], and name the package directory a
    /// `node_modules` hit came through, canonicalized, so a caller can read
    /// what that package ships beside its entry. Relative and `tsconfig`
    /// hits carry no directory; the probes are the same as `resolve`'s.
    pub fn resolve_located(
        &self,
        from: &ModuleKey,
        specifier: &str,
    ) -> Result<Resolution, Unresolved> {
        let hit = self.hit(from, specifier)?;
        Ok(Resolution {
            key: ModuleKey::new(&hit.file),
            package_dir: hit.package_dir.and_then(|dir| self.fs.canonicalize(&dir)),
        })
    }

    /// The one probe order behind both resolvers: relative joins, bare
    /// specifiers through `tsconfig` then `node_modules`, absolute misses.
    fn hit(&self, from: &ModuleKey, specifier: &str) -> Result<Hit, Unresolved> {
        // './tokens' from /proj/src/app.ts  →  /proj/src/tokens.ts
        let found = if specifier.starts_with('.') {
            self.probe_hit(&join_relative(from.as_str(), specifier))
                .map(Hit::file)
        } else if specifier.is_empty() || specifier.starts_with('/') {
            None
        } else {
            self.bare_hit(from, specifier)
        };
        found.ok_or_else(|| self.miss(from, specifier))
    }

    /// A bare specifier: `tsconfig` bases when followed, then `node_modules`.
    fn bare_hit(&self, from: &ModuleKey, specifier: &str) -> Option<Hit> {
        if self.tsconfig == TsconfigPolicy::Follow {
            if let Some(file) = self.tsconfig_hit(from, specifier) {
                return Some(Hit::file(file));
            }
        }
        self.node_hit(from, specifier)
    }

    /// First `tsconfig`-mapped base that probes to a file, if any.
    fn tsconfig_hit(&self, from: &ModuleKey, specifier: &str) -> Option<String> {
        let (text, dir) = self.find_tsconfig(from.dir_str())?;
        let tsconfig = tsconfig::parse_text(&text, &dir)?;
        tsconfig
            .candidates(specifier)
            .iter()
            .find_map(|base| self.probe_hit(base))
    }

    /// First ancestor `node_modules` package that resolves, nearest first.
    /// The `@types` fallback request is loop-invariant, so it builds once;
    /// the `roots` and package-dir scratch buffers regrow per level instead
    /// of allocating per probe. Same levels, same probes, same order. The
    /// hit hands back the package-dir buffer itself, so naming it is free.
    fn node_hit(&self, from: &ModuleKey, specifier: &str) -> Option<Hit> {
        let (package, subpath) = package::split_bare(specifier)?;
        let request = NodeRequest { package, subpath };
        let fallback = if request.subpath == "." {
            Some(NodeRequest {
                package: package::types_package_name(&request.package),
                subpath: ".".to_string(),
            })
        } else {
            None
        };
        let mut roots = String::new();
        let mut pkg_dir = String::new();
        for dir in ancestors_iter(from.dir_str()) {
            roots.clear();
            roots.push_str(dir);
            roots.push_str("/node_modules");
            if let Some(file) = self.package_hit(&roots, &request, &mut pkg_dir) {
                return Some(Hit::package(file, pkg_dir));
            }
            if let Some(shadow) = fallback.as_ref() {
                if let Some(file) = self.package_hit(&roots, shadow, &mut pkg_dir) {
                    return Some(Hit::package(file, pkg_dir));
                }
            }
        }
        None
    }

    /// Resolve one package dir: manifest entries, then the direct subpath.
    /// The package dir assembles in the caller's scratch buffer; every
    /// return owns its string, so reuse across levels is sound.
    fn package_hit(
        &self,
        roots: &str,
        request: &NodeRequest,
        pkg_dir: &mut String,
    ) -> Option<String> {
        pkg_dir.clear();
        pkg_dir.push_str(roots);
        pkg_dir.push('/');
        pkg_dir.push_str(&request.package);
        if !self.fs.is_dir(pkg_dir) {
            return None;
        }
        let manifest = self
            .fs
            .read_to_string(&join_with(pkg_dir, '/', "package.json"));
        self.manifest_hit(pkg_dir, manifest.as_deref(), request)
            .or_else(|| self.direct_hit(pkg_dir, &request.subpath))
    }

    /// First manifest entry that probes to a file: fields and `exports`.
    fn manifest_hit(
        &self,
        pkg_dir: &str,
        manifest: Option<&str>,
        request: &NodeRequest,
    ) -> Option<String> {
        let text = manifest?;
        if request.subpath != "." {
            let targets = package::export_targets(text, &request.subpath, self.root_entry);
            return self.targets_hit(pkg_dir, &targets);
        }
        self.targets_hit(pkg_dir, &package::root_targets(text, self.root_entry))
    }

    /// First entry target that probes to a file under the package dir.
    fn targets_hit(&self, pkg_dir: &str, targets: &[String]) -> Option<String> {
        targets.iter().find_map(|target| {
            let base = join_under(pkg_dir, target);
            self.probe_hit(&base)
        })
    }

    /// The direct subpath under the package dir, probed with the policy.
    fn direct_hit(&self, pkg_dir: &str, subpath: &str) -> Option<String> {
        let base = if subpath == "." {
            pkg_dir.to_string()
        } else {
            join_with(pkg_dir, '/', subpath.trim_start_matches("./"))
        };
        self.probe_hit(&base)
    }

    /// Probe one base with remap or extension order, then canonicalize.
    fn probe_hit(&self, base: &str) -> Option<String> {
        let hit = if probe::has_runtime_ext(base) {
            probe::probe_runtime(self.fs, self.policy, base)
        } else {
            probe::probe_base(self.fs, self.policy, base)
        }?;
        self.fs.canonicalize(&hit)
    }

    /// Nearest `tsconfig.json` walking up: its text plus its home dir.
    /// The candidate path reuses one scratch buffer across levels.
    fn find_tsconfig(&self, from_dir: &str) -> Option<(String, String)> {
        let mut path = String::new();
        ancestors_iter(from_dir).find_map(|dir| {
            path.clear();
            path.push_str(dir);
            path.push_str("/tsconfig.json");
            self.fs
                .read_to_string(&path)
                .map(|text| (text, dir.to_string()))
        })
    }

    /// The miss for `specifier` authored in `from`.
    fn miss(&self, from: &ModuleKey, specifier: &str) -> Unresolved {
        Unresolved {
            from: from.clone(),
            specifier: specifier.to_string(),
        }
    }
}

/// One node package lookup: the package plus the requested subpath.
struct NodeRequest {
    package: String,
    subpath: String,
}

/// A resolved specifier: its canonical key, plus the canonical package
/// directory a `node_modules` hit came through (`None` for relative and
/// `tsconfig` hits).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolution {
    pub key: ModuleKey,
    pub package_dir: Option<String>,
}

/// One raw hit: the canonical file, plus the package dir as probed.
struct Hit {
    file: String,
    package_dir: Option<String>,
}

impl Hit {
    fn file(file: String) -> Self {
        let package_dir = None;
        Self { file, package_dir }
    }

    fn package(file: String, dir: String) -> Self {
        let package_dir = Some(dir);
        Self { file, package_dir }
    }
}

/// The ordered `exports` targets a manifest maps `subpath` to, source-first:
/// exact keys, then `*` patterns, conditions in [`RootEntryPolicy::SourceFirst`]
/// order. Paths stay as authored (`./dist/x.mjs`); nothing touches disk.
pub fn package_export_targets(manifest: &str, subpath: &str) -> Vec<String> {
    package::export_targets(manifest, subpath, RootEntryPolicy::SourceFirst)
}
