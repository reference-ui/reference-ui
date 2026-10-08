//! Filesystem access behind one trait, so resolution never touches disk directly.
//!
//! [`FileSystem`] is the five operations the ladder needs: read a file, test
//! for file or dir, list a dir, and canonicalize a path. [`DiskFs`] runs them
//! against `std::fs` and is the only type in the crate allowed to; [`MemoryFs`]
//! serves an in-memory tree with symlink support for tests and virtual
//! compiles. Every operation fails closed (`None`, `false`, empty) — a missing
//! file is a missed probe, never an error.

use std::collections::HashMap;

/// The five filesystem operations module resolution may use.
pub trait FileSystem {
    /// File text, or `None` when the path cannot be read as a file.
    fn read_to_string(&self, path: &str) -> Option<String>;
    /// True when `path` names a file, following symlinks.
    fn is_file(&self, path: &str) -> bool;
    /// True when `path` names a directory, following symlinks.
    fn is_dir(&self, path: &str) -> bool;
    /// Sorted full paths of the direct children; empty when unreadable.
    fn read_dir(&self, path: &str) -> Vec<String>;
    /// The link-free path, or `None` for dangling links and loops.
    fn canonicalize(&self, path: &str) -> Option<String>;
}

/// [`FileSystem`] against the real disk. Alone in owning `std::fs` calls.
#[derive(Debug, Default)]
pub struct DiskFs;

impl FileSystem for DiskFs {
    fn read_to_string(&self, path: &str) -> Option<String> {
        std::fs::read_to_string(path).ok()
    }

    fn is_file(&self, path: &str) -> bool {
        std::fs::metadata(path).is_ok_and(|meta| meta.is_file())
    }

    fn is_dir(&self, path: &str) -> bool {
        std::fs::metadata(path).is_ok_and(|meta| meta.is_dir())
    }

    fn read_dir(&self, path: &str) -> Vec<String> {
        let mut out: Vec<String> = std::fs::read_dir(path)
            .into_iter()
            .flatten()
            .flatten()
            .map(|entry| entry.path().to_string_lossy().replace('\\', "/"))
            .collect();
        out.sort();
        out
    }

    fn canonicalize(&self, path: &str) -> Option<String> {
        std::fs::canonicalize(path)
            .ok()
            .map(|path| path.to_string_lossy().replace('\\', "/"))
    }
}

/// [`FileSystem`] over an in-memory tree: files, links, and implicit dirs.
/// Every path normalizes on insert; every lookup resolves links first, so a
/// dangling link reads as missing and a link to a dir lists as one.
#[derive(Debug, Default)]
pub struct MemoryFs {
    files: HashMap<String, String>,
    links: HashMap<String, String>,
}

impl MemoryFs {
    /// An empty tree.
    pub fn new() -> Self {
        Self::default()
    }

    /// Store `content` at `path`. Parent dirs are implicit; re-insert wins.
    pub fn insert(&mut self, path: &str, content: &str) {
        self.links.remove(&crate::key::normalize_str(path));
        self.files
            .insert(crate::key::normalize_str(path), content.to_string());
    }

    /// Link `link` at `target`: absolute, or relative to the link's dir.
    pub fn symlink(&mut self, link: &str, target: &str) {
        let link = crate::key::normalize_str(link);
        self.files.remove(&link);
        self.links.insert(link, target.to_string());
    }

    /// The link-free path for `path`, or `None` when dangling or looping.
    fn resolve(&self, path: &str) -> Option<String> {
        let mut current = crate::key::normalize_str(path);
        for _ in 0..40 {
            let Some(prefix) = self.link_prefix(&current) else {
                return Some(current);
            };
            let rest = current[prefix.len()..].to_string();
            current = self.expand_link(&prefix, &rest)?;
        }
        None
    }

    /// The longest leading path that is a link, if any link fires on `path`.
    fn link_prefix(&self, path: &str) -> Option<String> {
        let mut best: Option<String> = None;
        for link in self.links.keys() {
            if is_prefix_path(path, link)
                && best.as_ref().is_none_or(|seen| link.len() > seen.len())
            {
                best = Some(link.clone());
            }
        }
        best
    }

    /// One link expansion: the target plus the unresolved remainder.
    fn expand_link(&self, link: &str, rest: &str) -> Option<String> {
        let target = self.links.get(link)?;
        let base = if target.starts_with('/') {
            target.clone()
        } else {
            let dir = link.rfind('/').map_or("", |idx| &link[..idx]);
            format!("{dir}/{target}")
        };
        Some(crate::key::normalize_str(&format!("{base}{rest}")))
    }

    /// True when a resolved path names a file in the tree.
    fn resolved_is_file(&self, resolved: &str) -> bool {
        self.files.contains_key(resolved)
    }

    /// True when a resolved path is a dir: a proper prefix of a stored path.
    fn resolved_is_dir(&self, resolved: &str) -> bool {
        let prefix = dir_prefix(resolved);
        self.files
            .keys()
            .chain(self.links.keys())
            .any(|stored| stored != resolved && stored.starts_with(&prefix))
    }
}

impl FileSystem for MemoryFs {
    fn read_to_string(&self, path: &str) -> Option<String> {
        let resolved = self.resolve(path)?;
        if self.resolved_is_file(&resolved) {
            self.files.get(&resolved).cloned()
        } else {
            None
        }
    }

    fn is_file(&self, path: &str) -> bool {
        self.resolve(path)
            .is_some_and(|resolved| self.resolved_is_file(&resolved))
    }

    fn is_dir(&self, path: &str) -> bool {
        self.resolve(path)
            .is_some_and(|resolved| self.resolved_is_dir(&resolved))
    }

    fn read_dir(&self, path: &str) -> Vec<String> {
        let Some(resolved) = self.resolve(path) else {
            return Vec::new();
        };
        if !self.resolved_is_dir(&resolved) {
            return Vec::new();
        }
        let prefix = dir_prefix(&resolved);
        let shown = dir_prefix(&crate::key::normalize_str(path));
        let mut out: Vec<String> = self
            .files
            .keys()
            .chain(self.links.keys())
            .filter_map(|stored| child_head(stored, &prefix))
            .map(|head| format!("{shown}{head}"))
            .collect();
        out.sort();
        out.dedup();
        out
    }

    fn canonicalize(&self, path: &str) -> Option<String> {
        let resolved = self.resolve(path)?;
        if self.resolved_is_file(&resolved) || self.resolved_is_dir(&resolved) {
            Some(resolved)
        } else {
            None
        }
    }
}

/// True when `link` is `path` itself or one of its ancestor dirs.
fn is_prefix_path(path: &str, link: &str) -> bool {
    path == link || path.starts_with(&format!("{link}/"))
}

/// A dir path with its trailing slash, for prefix tests.
fn dir_prefix(resolved: &str) -> String {
    if resolved.ends_with('/') {
        resolved.to_string()
    } else {
        format!("{resolved}/")
    }
}

/// The first segment of `stored` under `prefix`, if `stored` is under it.
fn child_head(stored: &str, prefix: &str) -> Option<String> {
    let rest = stored.strip_prefix(prefix)?;
    let head = rest.split('/').next()?;
    if head.is_empty() {
        return None;
    }
    Some(head.to_string())
}
