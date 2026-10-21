//! Path normalization surface.
//! Converts filesystem paths to Unix-style file ids, stable symbol ids, module specifiers, and package names,
//! and reads the path part of an import specifier. Never touches the filesystem.

mod module_specifier;
mod package;

use std::path::{Path, PathBuf};

use crate::constants::scanner::{NODE_MODULES_DIR, TS_PATH_SUFFIXES};

pub(crate) fn path_to_unix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

/// Characters that open the query or hash suffix of an import specifier.
const SUFFIX_DELIMITERS: [char; 2] = ['?', '#'];

/// The path part of an import specifier: everything before its first `?` or `#`. The on-disk check
/// reads a suffixed import through this prefix, because the file it names is the one a bundler loads.
pub(crate) fn strip_query_and_hash(specifier: &str) -> &str {
    match specifier.find(SUFFIX_DELIMITERS) {
        Some(index) => &specifier[..index],
        None => specifier,
    }
}

/// Whether an import specifier carries a query or hash suffix. Such a specifier is opaque: a bundler
/// loads it as a directive on the file (raw text, a URL, a worker constructor), so it names no module.
pub(crate) fn has_query_or_hash(specifier: &str) -> bool {
    specifier.contains(SUFFIX_DELIMITERS)
}

pub(crate) fn symbol_id(file_id: &str, name: &str) -> String {
    format!("sym:{}#{name}", file_id)
}

pub(crate) fn module_specifier_for_file_id(file_id: &str) -> String {
    module_specifier::module_specifier_for_file_id(file_id)
}

pub(crate) fn package_name_from_file_id(file_id: &str) -> String {
    package::package_name_from_file_id(file_id)
}

pub(crate) fn split_package_specifier(source_module: &str) -> Option<(String, Option<String>)> {
    package::split_package_specifier(source_module)
}

pub(super) fn strip_typescript_suffix(value: &str) -> String {
    for suffix in TS_PATH_SUFFIXES {
        if let Some(stripped) = value.strip_suffix(suffix) {
            return stripped.to_string();
        }
    }

    value.to_string()
}

pub(super) fn strip_typescript_extension(path: &Path) -> PathBuf {
    let unix = path_to_unix(path);
    PathBuf::from(strip_typescript_suffix(&unix))
}

pub(crate) fn normalize_relative_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => push_parent_dir(&mut normalized),
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}

// Preserve leading `..` (dot-dot file ids above the scan root): popping past
// the root would swallow the escape and produce a bogus in-root candidate,
// killing barrel hops from followed packages in outDir-layout scans.
fn push_parent_dir(normalized: &mut PathBuf) {
    let pops_normal = matches!(
        normalized.components().next_back(),
        Some(std::path::Component::Normal(_))
    );
    if pops_normal {
        normalized.pop();
    } else {
        normalized.push("..");
    }
}

pub(crate) fn is_external_file_id(file_id: &str) -> bool {
    file_id
        .split('/')
        .any(|segment| segment == NODE_MODULES_DIR)
}

#[cfg(test)]
mod tests {
    use super::{has_query_or_hash, strip_query_and_hash};

    #[test]
    fn has_query_or_hash_flags_only_suffixed_specifiers() {
        assert!(has_query_or_hash("./notes.md?raw"));
        assert!(has_query_or_hash("./notes.md#usage"));
        assert!(has_query_or_hash("pkg/file.md?url"));
        assert!(!has_query_or_hash("./plain.ts"));
        assert!(!has_query_or_hash("pkg/file.md"));
    }

    #[test]
    fn strip_query_and_hash_keeps_only_the_path_before_the_first_delimiter() {
        let cases = [
            ("./notes.md?raw", "./notes.md"),
            ("./styles.css?inline", "./styles.css"),
            ("./data.json?url", "./data.json"),
            ("./notes.md#usage", "./notes.md"),
            ("./notes.md?raw#usage", "./notes.md"),
            ("./a?b#c?d", "./a"),
            ("./view.ts?x=1&y=2", "./view.ts"),
            ("pkg/file.md?raw", "pkg/file.md"),
            ("@scope/pkg?raw", "@scope/pkg"),
            ("./plain.ts", "./plain.ts"),
            ("pkg", "pkg"),
        ];
        for (specifier, expected) in cases {
            assert_eq!(
                strip_query_and_hash(specifier),
                expected,
                "specifier: {specifier}"
            );
        }
    }
}
