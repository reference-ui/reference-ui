//! Whether a linked package directory is Reference code that renders through
//! this compile's own runtime.
//!
//! A workspace package linked into `node_modules` canonicalizes outside every
//! `node_modules`, like project code, but only some of it is built on Reference
//! UI. [`borrows_own_runtime`] admits such a directory when this compile's
//! include set reaches inside it, or when it uses `@reference-ui/react` (its
//! manifest depends on it, or a root entry imports it) and that specifier, as
//! Node climbs from the directory, lands where this sync links its runtime. The
//! landing is read without the generated runtime: the own root's `node_modules`
//! is where the sync links it, and a nearer link is read by its target even
//! when nothing is generated there yet, so the first sync agrees with the next.

use std::borrow::Cow;

use module_graph::{package_root_targets, FileSystem, ModuleKey};

/// The specifier a package imports to render through a Reference runtime.
const RUNTIME: &str = "@reference-ui/react";

/// Manifest fields that declare what a package depends on.
const DEPENDENCY_FIELDS: [&str; 4] = [
    "dependencies",
    "peerDependencies",
    "devDependencies",
    "optionalDependencies",
];

/// This compile's own root: canonical on disk, as the request spelled it
/// (the compile sources' prefix), and the generated tree under `.reference-ui`.
#[derive(Debug, Clone)]
pub(crate) struct OwnRoot {
    root: String,
    lexical: String,
    generated: String,
}

impl OwnRoot {
    /// The own root at `root`, when it exists on disk.
    pub(crate) fn at<F: FileSystem>(fs: &F, root: &str) -> Option<Self> {
        let canonical = fs.canonicalize(root)?;
        let generated = format!("{canonical}/.reference-ui");
        Some(Self {
            root: canonical,
            lexical: root.trim_end_matches('/').to_string(),
            generated,
        })
    }

    /// True for the root itself and anything Core generates under it.
    pub(crate) fn owns(&self, dir: &str) -> bool {
        dir == self.root || under_or_at(dir, &self.generated)
    }

    /// A canonical directory as the request spells paths under this root.
    pub(crate) fn lexical_of<'d>(&self, dir: &'d str) -> Cow<'d, str> {
        match dir.strip_prefix(&self.root) {
            Some(rest) if rest.is_empty() || rest.starts_with('/') => {
                Cow::Owned(format!("{}{rest}", self.lexical))
            }
            _ => Cow::Borrowed(dir),
        }
    }

    /// Where this compile's runtime is generated, and linked from `node_modules`.
    fn runtime(&self) -> String {
        format!("{}/react", self.generated)
    }
}

/// This compile as a directory's verdict reads it: its own root, and whether
/// its include set reaches into a (canonical) directory.
pub(crate) struct OwnCompile<'a> {
    pub(crate) root: &'a OwnRoot,
    pub(crate) includes: &'a dyn Fn(&str) -> bool,
}

/// True when a linked (not installed) package directory is Reference code
/// rendering through this compile's runtime: the include set reaches into
/// it, or it uses the runtime specifier and that lands on this runtime.
pub(crate) fn borrows_own_runtime<F: FileSystem>(fs: &F, dir: &str, own: &OwnCompile<'_>) -> bool {
    (own.includes)(dir) || (uses_runtime(fs, dir) && runtime_lands_own(fs, dir, own.root))
}

/// True when the package's manifest depends on the runtime specifier or one
/// of its root entries (code or declarations) imports it.
fn uses_runtime<F: FileSystem>(fs: &F, dir: &str) -> bool {
    let Some(manifest) = fs.read_to_string(&format!("{dir}/package.json")) else {
        return false;
    };
    declares_runtime(&manifest) || root_entries_import(fs, dir, &manifest)
}

/// True when a dependency field of the manifest names the runtime specifier.
fn declares_runtime(manifest: &str) -> bool {
    let Ok(json) = serde_json::from_str::<serde_json::Value>(manifest) else {
        return false;
    };
    DEPENDENCY_FIELDS.iter().any(|field| {
        json.get(field)
            .and_then(serde_json::Value::as_object)
            .is_some_and(|deps| deps.contains_key(RUNTIME))
    })
}

/// True when a root entry file on disk imports the runtime specifier. Each
/// file is read once and dropped: a package's entries are never retained.
fn root_entries_import<F: FileSystem>(fs: &F, dir: &str, manifest: &str) -> bool {
    let mut seen: Vec<String> = Vec::new();
    for target in package_root_targets(manifest) {
        let path = ModuleKey::new(&format!("{dir}/{target}"))
            .as_str()
            .to_string();
        if seen.contains(&path) || !fs.is_file(&path) {
            continue;
        }
        if std::fs::read_to_string(&path).is_ok_and(|text| imports_runtime(&text)) {
            return true;
        }
        seen.push(path);
    }
    false
}

/// True when `text` names the runtime specifier as a quoted module string
/// (`'@reference-ui/react'`, or a subpath of it), not as a longer name.
fn imports_runtime(text: &str) -> bool {
    text.match_indices(RUNTIME).any(|(at, _)| {
        let before = text[..at].chars().next_back();
        let after = text[at + RUNTIME.len()..].chars().next();
        matches!(before, Some('\'' | '"' | '`')) && matches!(after, Some('\'' | '"' | '`' | '/'))
    })
}

/// True when the runtime specifier, climbing from `dir` as Node does, lands
/// on this compile's runtime. Reaching the own root lands there whatever is
/// on disk, since the sync links it there; a nearer entry decides by where it
/// points, generated or not. A directory outside the own root that meets no
/// entry lands nowhere.
fn runtime_lands_own<F: FileSystem>(fs: &F, dir: &str, own: &OwnRoot) -> bool {
    let mut at = Some(dir);
    while let Some(dir) = at {
        if dir == own.root {
            return true;
        }
        if let Some(target) = entry_target(fs, &format!("{dir}/node_modules/{RUNTIME}")) {
            return target == own.runtime();
        }
        at = dir
            .rsplit_once('/')
            .map(|(parent, _)| parent)
            .filter(|parent| !parent.is_empty());
    }
    false
}

/// Where a `node_modules` entry points: its canonical path when it resolves,
/// the target of a link that points nowhere yet (settled against what does
/// exist), or nothing when there is no entry at all.
fn entry_target<F: FileSystem>(fs: &F, entry: &str) -> Option<String> {
    if let Some(found) = fs.canonicalize(entry) {
        return Some(found);
    }
    let target = std::fs::read_link(entry).ok()?;
    let target = target.to_str()?;
    let joined = if target.starts_with('/') {
        target.to_string()
    } else {
        let parent = entry.rsplit_once('/').map_or("", |(parent, _)| parent);
        format!("{parent}/{target}")
    };
    Some(settle(fs, ModuleKey::new(&joined).as_str()))
}

/// A path whose tail may not exist yet, its longest existing head
/// canonicalized so it compares with canonical paths.
fn settle<F: FileSystem>(fs: &F, path: &str) -> String {
    if let Some(found) = fs.canonicalize(path) {
        return found;
    }
    let mut head = path;
    while let Some((parent, _)) = head
        .rsplit_once('/')
        .filter(|(parent, _)| !parent.is_empty())
    {
        if let Some(found) = fs.canonicalize(parent) {
            return format!("{found}{}", &path[parent.len()..]);
        }
        head = parent;
    }
    path.to_string()
}

/// True when `path` is `dir` or lies under it.
fn under_or_at(path: &str, dir: &str) -> bool {
    path.strip_prefix(dir)
        .is_some_and(|rest| rest.is_empty() || rest.starts_with('/'))
}

#[cfg(test)]
#[path = "own_runtime_tests.rs"]
mod tests;
