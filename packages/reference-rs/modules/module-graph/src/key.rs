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

    /// The key's directory as a borrow, without a trailing slash.
    /// Ancestor walks probe per level off it and pay no string per level.
    pub(crate) fn dir_str(&self) -> &str {
        dir_slice(&self.0)
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

/// Nearest-first ancestors of `dir` up to the root, depth-capped at 32:
/// `dir`, then each parent, then `/` for absolute paths. A zero-alloc
/// cursor walk: probing callers pay no strings per level.
pub(crate) fn ancestors_iter(dir: &str) -> Ancestors<'_> {
    Ancestors {
        cursor: Some(dir),
        root: false,
        remaining: 32,
    }
}

/// Zero-alloc ancestor cursor over one directory string.
pub(crate) struct Ancestors<'a> {
    cursor: Option<&'a str>,
    root: bool,
    remaining: u8,
}

impl<'a> Iterator for Ancestors<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<&'a str> {
        if self.root {
            self.root = false;
            self.cursor = None;
            return Some("/");
        }
        let current = self.cursor?;
        if self.remaining == 0 {
            self.cursor = None;
            return None;
        }
        self.remaining -= 1;
        match current.rfind('/') {
            Some(0) => self.root = true,
            Some(idx) => self.cursor = Some(&current[..idx]),
            None => self.cursor = None,
        }
        Some(current)
    }
}

/// Lexically normalize one path string: slashes, dots, and `..` folded.
/// Already-normal paths (no backslash, dot, or empty segments, no
/// trailing slash) survive byte-identical, so they return one copy
/// instead of paying a replaced scan plus a component walk.
pub(crate) fn normalize_str(path: &str) -> String {
    if is_normalized(path) {
        return path.to_string();
    }
    let slashed = path.replace('\\', "/");
    normalize(Path::new(&slashed)).to_string_lossy().to_string()
}

/// True when `path` needs no normalization: no backslash, no `.`/`..`
/// segments, no empty segments, no trailing slash. Dotfiles (`.hidden`)
/// are plain segments and pass; anything doubtful answers false and
/// pays the slow path, so this predicate can only cost, never corrupt.
fn is_normalized(path: &str) -> bool {
    let bytes = path.as_bytes();
    if bytes.is_empty() || bytes == b".." || bytes.starts_with(b"../") {
        return false;
    }
    if bytes.ends_with(b"/") {
        return false;
    }
    let mut prev = 0u8;
    for (index, &byte) in bytes.iter().enumerate() {
        if unnormalized_byte(bytes, index, byte, prev) {
            return false;
        }
        prev = byte;
    }
    true
}

/// True when the byte at `index` forces the slow walk: a backslash, an
/// empty segment, or a dot opening a `.`/`..` segment.
fn unnormalized_byte(bytes: &[u8], index: usize, byte: u8, prev: u8) -> bool {
    if byte == b'\\' {
        return true;
    }
    if byte == b'/' {
        return prev == b'/';
    }
    if byte != b'.' {
        return false;
    }
    if prev != b'/' && index != 0 {
        return false;
    }
    dot_segment_end(bytes, index)
}

/// True when the dot at `index` opens a `.`/`..` segment: end, slash, or
/// another dot follows. A dot opening `.hidden` is a plain name and fails.
fn dot_segment_end(bytes: &[u8], index: usize) -> bool {
    matches!(bytes.get(index + 1), None | Some(&b'/') | Some(&b'.'))
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

/// Directory of a path as a borrow, without the trailing slash; root
/// stays root. Same cut as [`dir_of`]; the ladder walks ancestors off it.
fn dir_slice(path: &str) -> &str {
    match path.rfind('/') {
        None => "",
        Some(0) => "/",
        Some(idx) => &path[..idx],
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

#[cfg(test)]
mod tests {
    use super::*;

    /// Fast path agrees with the slow walk on every predicate arm, and
    /// every fast verdict is byte-identical to its normalized output.
    #[test]
    fn normalized_predicate_matches_the_walk() {
        let cases: &[(&str, &str, bool)] = &[
            ("/a/b/c", "/a/b/c", true),
            ("a/b", "a/b", true),
            ("/", "/", false),
            ("", ".", false),
            (".", ".", false),
            ("..", ".", false),
            ("../x", "x", false),
            ("a/../b", "b", false),
            ("a/./b", "a/b", false),
            ("./x", "x", false),
            ("a//b", "a/b", false),
            ("a/", "a", false),
            ("a\\b", "a/b", false),
            ("/.hidden/x", "/.hidden/x", true),
            (".hidden", ".hidden", true),
            ("a/.b/c", "a/.b/c", true),
            ("a.b/c..d", "a.b/c..d", true),
            ("...", "...", false),
            ("/a/b/..", "/a", false),
            ("C:/a", "C:/a", true),
            (
                "/tmp/neo-bench-XYZ/src/ui12/Card3.ts",
                "/tmp/neo-bench-XYZ/src/ui12/Card3.ts",
                true,
            ),
        ];
        for (input, expected, expected_fast) in cases {
            assert_eq!(normalize_str(input), *expected, "normalize {input:?}");
            assert_eq!(is_normalized(input), *expected_fast, "predicate {input:?}");
            if *expected_fast {
                assert_eq!(*input, *expected, "fast must be identical {input:?}");
            }
        }
    }

    /// Borrowed dirs cut exactly where the owned dir did.
    #[test]
    fn dir_borrows_match_owned_dirs() {
        for path in ["/a/b/c", "/a", "/", "a/b", "a", "", "C:/a/b", "/.hidden/x"] {
            assert_eq!(dir_slice(path), dir_of(path), "dir {path:?}");
            assert_eq!(ModuleKey::new(path).dir_str(), dir_slice(path));
        }
    }

    /// Ancestor cursor yields dir-to-root, root included for absolutes.
    #[test]
    fn ancestors_walk_dir_to_root() {
        fn collect(dir: &str) -> Vec<&str> {
            ancestors_iter(dir).collect()
        }
        assert_eq!(collect("/a/b/c"), ["/a/b/c", "/a/b", "/a", "/"]);
        assert_eq!(collect("a/b"), ["a/b", "a"]);
        assert_eq!(collect("a"), ["a"]);
        assert_eq!(collect(""), [""]);
        assert_eq!(collect("/"), ["/", "/"]);
    }

    /// Ancestor cursor stops at 32 levels plus the queued root.
    #[test]
    fn ancestors_stop_at_depth_cap() {
        let deep = (0..40).map(|_| "d").collect::<Vec<_>>().join("/");
        let walked = ancestors_iter(&deep).collect::<Vec<_>>();
        assert_eq!(walked.len(), 32);
        assert_eq!(walked[0], deep);
        let rooted = format!("/{deep}");
        let rooted_walked = ancestors_iter(&rooted).collect::<Vec<_>>();
        assert_eq!(rooted_walked.len(), 32);
    }
}
