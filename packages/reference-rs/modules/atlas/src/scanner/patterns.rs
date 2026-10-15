//! Glob splitting for Atlas discovery. An include pattern is cut at its literal leading directories so its
//! walk can start there, and the remaining glob is anchored to that directory the way the whole pattern was
//! anchored under the project root. Takes a project-relative pattern and emits the base path plus the glob to
//! match beneath it.

use std::path::PathBuf;

/// Splits a project-relative glob at its literal leading directories: `src/ui/**/*.tsx` becomes
/// (`src/ui`, `**/*.tsx`). The last segment always stays in the glob, so a literal file name still matches.
pub fn split_literal_base(pattern: &str) -> (PathBuf, String) {
    let segments: Vec<&str> = pattern.split('/').collect();
    let literal = segments
        .iter()
        .take(segments.len().saturating_sub(1))
        .take_while(|segment| is_literal_segment(segment))
        .count();
    let base: PathBuf = segments[..literal].iter().collect();
    let rest = segments[literal..].join("/");
    // A bare name matches at any depth, so under a base it must match only its direct children.
    if literal == 0 || rest.is_empty() || rest.contains('/') {
        return (base, rest);
    }
    (base, format!("/{rest}"))
}

/// A segment names one directory literally when it is non-empty, is not `.` or `..`, and has no glob syntax.
fn is_literal_segment(segment: &str) -> bool {
    !segment.is_empty()
        && !matches!(segment, "." | "..")
        && !segment.contains(['*', '?', '[', ']', '{', '}', '!', '\\'])
}
