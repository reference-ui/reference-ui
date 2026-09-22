//! Normalized module keys plus the small path algebra the ladder walks on.
//!
//! A [`ModuleKey`] is one lexically normalized path string: backslashes become
//! slashes, `.` segments drop, `..` resolves against the prefix so far, and
//! roots survive. The graph keys records by it, the ladder emits it, and the
//! walk carries it in every origin and refusal. Normalization is lexical only —
//! symlinks resolve later, through [`FileSystem`](crate::FileSystem).

use std::path::{Component, Path, PathBuf};

/// One module's identity: a lexically normalized path string.
#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct ModuleKey(String);

impl ModuleKey {
    /// Normalize `path` into a key. Idempotent: re-keying changes nothing.
    pub fn new(path: &str) -> Self {
        Self(normalize_str(path))
    }

    /// The normalized path text.
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// The key's directory, without a trailing slash.
    pub(crate) fn dir(&self) -> String {
        dir_of(&self.0)
    }
}

/// Join a relative specifier onto the importer's directory, normalized.
pub(crate) fn join_relative(from_file: &str, specifier: &str) -> String {
    join_under(&dir_of(from_file), specifier)
}

/// Join a subpath onto a directory, normalized.
pub(crate) fn join_under(dir: &str, sub: &str) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for segment in dir.split('/').chain(sub.split('/')) {
        push_segment(&mut parts, segment);
    }
    join_parts(dir, &parts)
}

/// A dir plus its ancestors up to the root, nearest first, depth-capped.
pub(crate) fn ancestors(dir: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cursor = dir.to_string();
    for _ in 0..32 {
        out.push(cursor.clone());
        match cursor.rfind('/') {
            Some(0) => {
                out.push("/".to_string());
                break;
            }
            Some(idx) => cursor.truncate(idx),
            None => break,
        }
    }
    out
}

/// Lexically normalize one path string: slashes, dots, and `..` folded.
pub(crate) fn normalize_str(path: &str) -> String {
    let slashed = path.replace('\\', "/");
    normalize(Path::new(&slashed)).to_string_lossy().to_string()
}

/// Lexically normalize a path without touching the filesystem.
fn normalize(path: &Path) -> PathBuf {
    // Normalization only drops segments and separators, so the input byte
    // length bounds the output: reserve once instead of growing per push.
    let mut out = PathBuf::with_capacity(path.as_os_str().len());
    for component in path.components() {
        push_component(&mut out, component);
    }
    if out.as_os_str().is_empty() {
        PathBuf::from(".")
    } else {
        out
    }
}

/// Fold one path component into the normalized path, resolving `..` upward.
fn push_component(out: &mut PathBuf, component: Component<'_>) {
    match component {
        Component::CurDir => {}
        Component::ParentDir => {
            out.pop();
        }
        keep => out.push(keep.as_os_str()),
    }
}

/// Directory of a path, without the trailing slash; root stays root.
fn dir_of(path: &str) -> String {
    path.rfind('/').map_or_else(String::new, |idx| {
        if idx == 0 {
            "/".to_string()
        } else {
            path[..idx].to_string()
        }
    })
}

/// Fold one path segment into the joined parts, resolving `..` upward.
fn push_segment<'a>(parts: &mut Vec<&'a str>, segment: &'a str) {
    match segment {
        "" | "." => {}
        ".." => {
            parts.pop();
        }
        keep => parts.push(keep),
    }
}

/// Join normalized segments, restoring the anchor.
fn join_parts(path: &str, parts: &[&str]) -> String {
    let mut joined = parts.join("/");
    if path.starts_with('/') {
        joined.insert(0, '/');
    }
    if joined.is_empty() {
        joined.push('.');
    }
    joined
}
