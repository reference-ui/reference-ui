//! Relative import path resolution and declaration candidate enumeration.
//! A relative specifier is joined onto its importer's directory and probed for the exact file first, then with
//! TypeScript's extensions appended to the whole name (so a dotted basename such as `theme.fragments` is never
//! read as an extension), then directory index files. A runtime specifier (`.js`, `.mjs`, `.cjs`) probes its declaration
//! siblings first (`.d.ts`, plus `.d.mts` or `.d.cts` for `.mjs` and `.cjs`), then the source siblings TypeScript maps it
//! to (`.ts` or `.tsx`, `.mts`, `.cts`), so packages and dist stay declaration-driven. A `?query` or `#hash` suffix is
//! dropped before the join, since bundlers read it as a directive on the file rather than as part of its name.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use crate::constants::scanner::{TS_INDEX_FILENAMES, TS_PATH_EXTENSIONS};

use crate::scanner::paths::{normalize_relative_path, path_to_unix, strip_query_and_hash};

/// Whether filesystem lookup is allowed when resolving relative imports beyond the known set.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum FileLookup {
    Allowed,
    Denied,
}

/// What one relative specifier resolves against: the root that filesystem probes are relative to,
/// the file ids the scan already knows, and whether probes may answer beyond that set.
#[derive(Clone, Copy, Debug)]
pub(super) struct RelativeLookup<'a> {
    pub(super) root_dir: &'a Path,
    pub(super) file_ids: &'a BTreeSet<String>,
    pub(super) file_lookup: FileLookup,
}

pub(super) fn resolve_relative_import(
    lookup: &RelativeLookup<'_>,
    current_file_id: &str,
    source_module: &str,
) -> Option<String> {
    let current_path = Path::new(current_file_id);
    let base_dir = current_path.parent().unwrap_or_else(|| Path::new(""));
    let joined = normalize_relative_path(&base_dir.join(strip_query_and_hash(source_module)));

    declaration_candidates(&joined, true)
        .into_iter()
        .map(|candidate| path_to_unix(&candidate))
        .find(|file_id| candidate_matches(lookup, file_id))
}

pub(super) fn declaration_candidates(path: &Path, include_runtime_entry: bool) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    push_path_candidates(&mut candidates, path, include_runtime_entry);
    push_index_candidates(&mut candidates, path);

    candidates
}

/// The TypeScript spellings a runtime extension stands for, in probe order: declaration siblings first, then the sources
/// TypeScript maps it to. Packages and dist rely on the declarations leading, so a source never shadows a `.d.ts`.
/// `.js` maps to `.d.ts`, `.ts` and `.tsx`; `.mjs` to `.d.ts`, `.d.mts` and `.mts`; `.cjs` to `.d.ts`, `.d.cts` and `.cts`.
struct RuntimeSpellings {
    declarations: &'static [&'static str],
    sources: &'static [&'static str],
}

fn runtime_spellings(extension: &str) -> Option<RuntimeSpellings> {
    match extension {
        "js" => Some(RuntimeSpellings {
            declarations: &["d.ts"],
            sources: &["ts", "tsx"],
        }),
        "mjs" => Some(RuntimeSpellings {
            declarations: &["d.ts", "d.mts"],
            sources: &["mts"],
        }),
        "cjs" => Some(RuntimeSpellings {
            declarations: &["d.ts", "d.cts"],
            sources: &["cts"],
        }),
        _ => None,
    }
}

fn candidate_matches(lookup: &RelativeLookup<'_>, file_id: &str) -> bool {
    lookup.file_ids.contains(file_id)
        || (matches!(lookup.file_lookup, FileLookup::Allowed)
            && lookup.root_dir.join(file_id).is_file())
}

fn push_path_candidates(candidates: &mut Vec<PathBuf>, path: &Path, include_runtime_entry: bool) {
    let Some(spellings) = path
        .extension()
        .and_then(|extension| extension.to_str())
        .and_then(runtime_spellings)
    else {
        push_unique_candidate(candidates, path.to_path_buf());
        push_extension_candidates(candidates, path);
        return;
    };

    let base = path.with_extension("");
    for extension in spellings.declarations.iter().chain(spellings.sources) {
        push_unique_candidate(candidates, append_extension(&base, extension));
    }
    if include_runtime_entry {
        push_unique_candidate(candidates, path.to_path_buf());
    }
}

fn push_extension_candidates(candidates: &mut Vec<PathBuf>, path: &Path) {
    // An empty specifier names the importer's directory, which has no file name to extend.
    if path.as_os_str().is_empty() {
        return;
    }
    for extension in TS_PATH_EXTENSIONS {
        push_unique_candidate(candidates, append_extension(path, extension));
    }
}

/// `path` with `.extension` appended to its whole file name. `with_extension` would replace the
/// last dotted segment, so `theme.fragments` would never be tried as `theme.fragments.ts`.
fn append_extension(path: &Path, extension: &str) -> PathBuf {
    let mut name = path.as_os_str().to_os_string();
    name.push(".");
    name.push(extension);
    PathBuf::from(name)
}

fn push_index_candidates(candidates: &mut Vec<PathBuf>, path: &Path) {
    for index_name in TS_INDEX_FILENAMES {
        push_unique_candidate(candidates, path.join(index_name));
    }
}

fn push_unique_candidate(candidates: &mut Vec<PathBuf>, candidate: PathBuf) {
    if !candidates.contains(&candidate) {
        candidates.push(candidate);
    }
}
