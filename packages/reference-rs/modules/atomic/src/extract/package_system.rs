//! What a package directory says about the system that renders its components.
//!
//! The identity walk ends a bare import at a package directory when the
//! specifier does not land in this compile's sources, and [`dir_verdict`] reads
//! that directory once: a package that published a system
//! (`exports["./baseSystem"]`, else `.reference-ui/system/baseSystem.mjs`)
//! renders through it, a linked directory that is Reference code for this
//! compile borrows its runtime (`own_runtime`), and anything else is foreign.
//! A published file is Core's `export const baseSystem = <JSON>`; only `name`
//! and `streams[].name` are read, on first demand, once per path and mtime.

use std::sync::{Arc, Mutex, OnceLock, PoisonError};
use std::time::SystemTime;

use module_graph::{package_export_targets, FileSystem, ModuleKey};
use rustc_hash::FxHashMap;
use serde::Deserialize;

use super::own_runtime::{borrows_own_runtime, OwnCompile};

/// Where Core writes a package's published system, when `exports` names none.
const PUBLISHED_FALLBACK: &str = ".reference-ui/system/baseSystem.mjs";

/// The declaration that opens the JSON body of a published system.
const PUBLISHED_MARKER: &str = "export const baseSystem =";

/// A tag root's binding that ends at a package: the bare specifier as
/// imported, the directory it resolved to (none when nothing resolved), and
/// which system renders it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PackageTag {
    pub specifier: Box<str>,
    pub dir: Option<Box<str>>,
    pub verdict: PackageVerdict,
}

impl PackageTag {
    /// A package known by its spelling alone: no directory, so foreign.
    pub(crate) fn unresolved(specifier: &str) -> Self {
        Self {
            specifier: specifier.into(),
            dir: None,
            verdict: PackageVerdict::Foreign,
        }
    }
}

/// Which system renders a package-bound tag.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PackageVerdict {
    /// The package published a system; its names are read on demand.
    Published(Arc<PublishedSystem>),
    /// No Reference system is known for it: not built on Reference UI, or unresolved.
    Foreign,
}

/// What one resolved package directory is to this compile.
#[derive(Debug, Clone)]
pub(crate) enum DirVerdict {
    /// It renders through this compile's own runtime, as project code does.
    OwnRuntime,
    /// It is another package.
    Package(PackageVerdict),
}

impl DirVerdict {
    /// True when the directory published a system of its own.
    pub(crate) fn publishes(&self) -> bool {
        matches!(self, Self::Package(PackageVerdict::Published(_)))
    }
}

/// A published `baseSystem.mjs`: its path, and its names once read.
#[derive(Debug)]
pub struct PublishedSystem {
    path: Box<str>,
    names: OnceLock<Result<SystemNames, String>>,
}

/// The two facts the engine takes from a published system.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SystemNames {
    /// The system's own name (`reference-ui` for `@reference-ui/lib`).
    pub name: String,
    /// Every system its components render through: its `streams` names in
    /// published order (lib's are icons, then itself), or its name alone.
    pub systems: Vec<String>,
}

impl PublishedSystem {
    /// The file this system was published to.
    pub fn path(&self) -> &str {
        &self.path
    }

    /// The published names, read and parsed on first call; an unreadable
    /// or malformed file answers why, naming the file.
    pub fn names(&self) -> Result<&SystemNames, &str> {
        self.names
            .get_or_init(|| read_names(&self.path))
            .as_ref()
            .map_err(String::as_str)
    }
}

impl PartialEq for PublishedSystem {
    fn eq(&self, other: &Self) -> bool {
        self.path == other.path
    }
}

impl Eq for PublishedSystem {}

/// The verdict on one resolved package directory (canonical). This compile's
/// own tree is its own runtime; a published system wins next; a linked
/// directory outside every `node_modules` borrows the own runtime when it is
/// Reference code for this compile; anything else is foreign.
pub(crate) fn dir_verdict<F: FileSystem>(
    fs: &F,
    dir: &str,
    own: Option<&OwnCompile<'_>>,
) -> DirVerdict {
    if own.is_some_and(|own| own.root.owns(dir)) {
        return DirVerdict::OwnRuntime;
    }
    if let Some(file) = published_file(fs, dir) {
        return DirVerdict::Package(PackageVerdict::Published(published(&file)));
    }
    if !is_installed(dir) && own.is_some_and(|own| borrows_own_runtime(fs, dir, own)) {
        return DirVerdict::OwnRuntime;
    }
    DirVerdict::Package(PackageVerdict::Foreign)
}

/// The package directory an installed file sits in: the path through its
/// last `node_modules` segment plus the package name (two segments scoped).
pub(crate) fn installed_dir(path: &str) -> Option<&str> {
    const SEGMENT: &str = "/node_modules/";
    let start = path.rfind(SEGMENT)? + SEGMENT.len();
    let mut names = path[start..].split('/');
    let first = names.next().filter(|name| !name.is_empty())?;
    let len = if first.starts_with('@') {
        first.len() + 1 + names.next()?.len()
    } else {
        first.len()
    };
    Some(&path[..start + len])
}

/// The npm package a bare specifier names, without its subpath:
/// `@reference-ui/lib/primitives` is `@reference-ui/lib`, `acme-ui/button` is `acme-ui`.
pub(crate) fn package_name(specifier: &str) -> &str {
    let slashes = if specifier.starts_with('@') { 2 } else { 1 };
    match specifier.match_indices('/').nth(slashes - 1) {
        Some((end, _)) => &specifier[..end],
        None => specifier,
    }
}

/// The system file a package directory publishes: its `exports["./baseSystem"]`
/// target (declarations skipped), else Core's conventional path.
fn published_file<F: FileSystem>(fs: &F, dir: &str) -> Option<String> {
    let manifest = fs.read_to_string(&format!("{dir}/package.json"));
    let exported = manifest
        .iter()
        .flat_map(|text| package_export_targets(text, "./baseSystem"))
        .filter(|target| !is_declaration(target));
    exported
        .chain(std::iter::once(PUBLISHED_FALLBACK.to_string()))
        .map(|target| under(dir, &target))
        .find(|path| fs.is_file(path))
}

/// True for a `.d.ts`-family target: types, never the published value.
fn is_declaration(target: &str) -> bool {
    [".d.ts", ".d.mts", ".d.cts"]
        .iter()
        .any(|suffix| target.ends_with(suffix))
}

/// A package-relative target joined under its directory, normalized.
fn under(dir: &str, target: &str) -> String {
    ModuleKey::new(&format!("{dir}/{target}")).as_str().to_string()
}

/// True when the directory sits inside a `node_modules` tree: an installed
/// copy, which brings its own runtime and never borrows the consumer's.
fn is_installed(dir: &str) -> bool {
    dir.split('/').any(|segment| segment == "node_modules")
}

/// Published systems by path for the life of the process, each beside the
/// mtime it was opened under, so a re-sync of the package reads it afresh.
type PublishedMemo = Mutex<FxHashMap<Box<str>, (Option<SystemTime>, Arc<PublishedSystem>)>>;

static PUBLISHED: OnceLock<PublishedMemo> = OnceLock::new();

/// The published system at `path`, shared until the file's mtime moves.
pub(crate) fn published(path: &str) -> Arc<PublishedSystem> {
    let stamp = std::fs::metadata(path).and_then(|meta| meta.modified()).ok();
    let memo = PUBLISHED.get_or_init(PublishedMemo::default);
    let mut map = memo.lock().unwrap_or_else(PoisonError::into_inner);
    if let Some((seen, system)) = map.get(path) {
        if *seen == stamp {
            return Arc::clone(system);
        }
    }
    let system = Arc::new(PublishedSystem {
        path: path.into(),
        names: OnceLock::new(),
    });
    map.insert(path.into(), (stamp, Arc::clone(&system)));
    system
}

/// Read and parse one published file, naming it in any failure.
fn read_names(path: &str) -> Result<SystemNames, String> {
    let text = std::fs::read_to_string(path).map_err(|error| format!("{path}: {error}"))?;
    parse_names(&text).map_err(|error| format!("{path}: {error}"))
}

/// The JSON body's `name` and `streams[].name`; serde skips everything else.
#[derive(Deserialize)]
struct RawSystem {
    name: String,
    #[serde(default)]
    streams: Vec<RawStream>,
}

/// One published stream: its system name only.
#[derive(Deserialize)]
struct RawStream {
    name: String,
}

/// Parse Core's `export const baseSystem = <JSON>` text into its names.
pub(crate) fn parse_names(text: &str) -> Result<SystemNames, String> {
    let (_, body) = text
        .split_once(PUBLISHED_MARKER)
        .ok_or_else(|| format!("no `{PUBLISHED_MARKER}` declaration"))?;
    let body = body.trim().trim_end_matches(';');
    let raw: RawSystem = serde_json::from_str(body).map_err(|error| error.to_string())?;
    let mut systems: Vec<String> = raw.streams.into_iter().map(|stream| stream.name).collect();
    if systems.is_empty() {
        systems.push(raw.name.clone());
    }
    Ok(SystemNames {
        name: raw.name,
        systems,
    })
}

#[cfg(test)]
#[path = "package_system_tests.rs"]
mod tests;
