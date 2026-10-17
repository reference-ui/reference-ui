//! Gathers a compile's sources from its inputs: the provided `files` union-filled from disk when
//! present, or the filtered `root_dir` scan otherwise. Takes the request's include scope and root and
//! emits unsorted `(path, content)` pairs, which `request::collect` sorts afterwards. An empty `files`
//! list counts as absent, so emptiness and absence both mean the caller handed nothing over.

use std::path::Path;

use rustc_hash::FxHashSet;

use crate::includes::{FileMatcher, IncludeScope};
use crate::{CompileRequest, VirtualSource};

use super::backfill::{walk_root, Backfill};
use super::walk::scan_dir;

/// Provided `files` union-filled from disk when present, otherwise the
/// filtered `root_dir` scan. An empty list scans: absence and emptiness
/// both mean "the caller handed nothing over".
pub(super) fn gather(request: &CompileRequest) -> Vec<(String, String)> {
    let patterns = request.include.as_deref().unwrap_or(&[]);
    let scope = IncludeScope::compile(patterns);
    let matcher = scope.matcher(request.root_dir.as_deref());
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return union_sources(files, request.root_dir.as_deref(), &matcher);
        }
    }

    let mut sources = Vec::new();
    if let Some(root_dir) = &request.root_dir {
        scan_dir(Path::new(root_dir), &matcher, &mut sources);
    }
    sources
}

/// Virtual sources inside the include scope; an open scope keeps every file.
fn filter_virtual_sources(files: &[VirtualSource], matcher: &FileMatcher) -> Vec<(String, String)> {
    files
        .iter()
        .filter(|file| matcher.matches_file(&file.path))
        .map(|file| (file.path.clone(), file.content.clone()))
        .collect()
}

/// Provided sources plus the scope-hit disk paths the list misses: provided
/// bytes win on collision and only missing paths read from disk, so set
/// equality holds by construction whatever glob engine built the list. With
/// no root the walk has nowhere to go and this is exactly the legacy
/// provided filter, so files-only callers keep byte-identical semantics.
/// The known-check runs inside the walk, so already-listed paths cost a
/// hash probe and never a transient path string; missing paths still read
/// from disk in walk order exactly as the two-phase walk did.
fn union_sources(
    files: &[VirtualSource],
    root: Option<&str>,
    matcher: &FileMatcher,
) -> Vec<(String, String)> {
    let mut provided = filter_virtual_sources(files, matcher);
    let Some(root_dir) = root else {
        return provided;
    };
    let mut known: FxHashSet<String> = provided.iter().map(|(path, _)| path.clone()).collect();
    let mut backfill = Backfill {
        matcher,
        known: &mut known,
        acc: &mut provided,
    };
    walk_root(Path::new(root_dir), &mut backfill);
    provided
}
