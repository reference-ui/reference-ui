//! Specifier candidates for the binding walk (SPEC-V2-76).
//! Turns a specifier authored in one file into the ordered paths the walk
//! probes against the graph: relative joins here, bare `tsconfig` and
//! `node_modules` bases from the SITE-54 slice, each followed by extension
//! and index probes. Every candidate normalizes lexically to match graph
//! keys, and the walk takes the first graph member.

use std::path::{Component, Path, PathBuf};

/// Ordered probe candidates for a specifier authored in `from_file`.
/// Relative joins first, then the bare `tsconfig` and `node_modules` bases;
/// each side dedupes, and the walk takes the first graph member.
pub fn candidates(from_file: &str, specifier: &str) -> Vec<String> {
    // import { brand } from './tokens'  inside  /proj/src/App.tsx
    let mut out = candidate_paths(from_file, specifier);
    for bare in super::bare::candidates(from_file, specifier) {
        if !out.contains(&bare) {
            out.push(bare);
        }
    }
    out
}

/// Ordered probe candidates for a relative specifier: the joined path, four
/// extensions, and three index spellings. Bare and absolute specifiers yield
/// nothing — the bare seam and the graph keys own those.
pub fn candidate_paths(from_file: &str, specifier: &str) -> Vec<String> {
    if !specifier.starts_with('.') {
        return Vec::new();
    }
    let joined = join_relative(from_file, specifier);
    let mut out = Vec::with_capacity(8);
    push_normalized(&mut out, joined.clone());
    for ext in ["ts", "tsx", "js", "jsx"] {
        push_normalized(&mut out, format!("{joined}.{ext}"));
    }
    for index in ["index.ts", "index.tsx", "index.js"] {
        push_normalized(&mut out, format!("{joined}/{index}"));
    }
    out
}

/// Join a relative specifier onto the importer's directory.
fn join_relative(from_file: &str, specifier: &str) -> String {
    let dir = from_file.rfind('/').map_or("", |idx| &from_file[..idx]);
    let mut parts: Vec<&str> = Vec::new();
    for segment in dir.split('/').chain(specifier.split('/')) {
        push_segment(&mut parts, segment);
    }
    let mut joined = parts.join("/");
    if from_file.starts_with('/') {
        joined.insert(0, '/');
    }
    joined
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

/// Push a candidate unless normalization already produced it.
fn push_normalized(out: &mut Vec<String>, candidate: String) {
    let key = normalize_key(&candidate);
    if !out.contains(&key) {
        out.push(key);
    }
}

/// Lexically normalize a path string for graph keys on both sides.
pub fn normalize_key(path: &str) -> String {
    normalize(Path::new(path)).to_string_lossy().to_string()
}

/// Lexically normalize a path without touching the filesystem: drops `.`
/// segments, resolves `..` against the prefix so far, and keeps roots and
/// prefixes intact.
pub fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_probes_bare_then_extensions_then_index() {
        assert_eq!(
            candidate_paths("/proj/src/App.tsx", "./tokens"),
            vec![
                "/proj/src/tokens".to_string(),
                "/proj/src/tokens.ts".to_string(),
                "/proj/src/tokens.tsx".to_string(),
                "/proj/src/tokens.js".to_string(),
                "/proj/src/tokens.jsx".to_string(),
                "/proj/src/tokens/index.ts".to_string(),
                "/proj/src/tokens/index.tsx".to_string(),
                "/proj/src/tokens/index.js".to_string(),
            ]
        );
    }

    #[test]
    fn parent_segments_climb_and_explicit_extensions_dedupe() {
        let got = candidate_paths("/proj/src/ui/App.tsx", "../tokens.ts");
        assert!(got.contains(&"/proj/src/tokens.ts".to_string()));
        assert_eq!(
            got.iter().filter(|c| c.as_str() == "/proj/src/tokens.ts").count(),
            1
        );
    }

    #[test]
    fn bare_and_absolute_specifiers_yield_nothing() {
        assert!(candidate_paths("/proj/src/App.tsx", "@reference-ui/react").is_empty());
        assert!(candidate_paths("/proj/src/App.tsx", "@/tokens").is_empty());
        assert!(candidate_paths("/proj/src/App.tsx", "/abs/tokens").is_empty());
    }

    #[test]
    fn normalize_drops_dots_and_keeps_roots() {
        assert_eq!(normalize(Path::new("/a/./b/../c")), PathBuf::from("/a/c"));
        assert_eq!(normalize(Path::new("a/b")), PathBuf::from("a/b"));
        assert_eq!(normalize_key("/r/./src/tokens"), "/r/src/tokens");
    }
}
